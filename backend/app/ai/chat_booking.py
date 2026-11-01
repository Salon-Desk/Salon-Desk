"""Chat booking handler for booking and confirming appointments via AI concierge."""

from __future__ import annotations

import json
import logging
import re
from datetime import UTC, date, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.ai.llm import BaseLLMService, LLMError
from app.ai.tools.booking_helpers import get_organization_stylists, resolve_stylist
from app.core.exceptions import ForbiddenError
from app.core.security import create_access_token
from app.models.booking import Booking
from app.models.enums import BookingStatus, OrganizationStatus, ServiceStatus, UserRole
from app.models.organization import Organization
from app.models.service import Service
from app.models.user import User
from app.schemas.ai import ChatMessage
from app.services import booking_service, payment_service

logger = logging.getLogger("salondesk.ai.chat_booking")

BOOKING_INTENT_PHRASES = (
    "book",
    "booking",
    "reserve",
    "reservation",
    "appointment",
    "schedule",
    "confirm",
    "confirming",
    "confirmation",
    "lock in",
    "lock that in",
    "hold with paypal",
    "haircut",
    "hair cut",
    "fade",
    "braid",
    "braids",
    "manicure",
    "pedicure",
    "facial",
    "massage",
    "swedish massage",
    "deep tissue",
    "spa",
    "waxing",
    "balayage",
    "color",
    "treatment",
    "salon",
    "stylist",
)

ASSISTANT_BOOKING_PROMPTS = (
    "stylist",
    "appointment",
    "reserve",
    "reservation",
    "slot",
    "date and time",
    "what date",
    "what time",
    "when would you like",
    "lock that in",
    "lock in",
    "book with",
    "would you like to book",
    "confirm",
    "booking",
    "opening tomorrow",
    "great choice!",
)

USER_BOOKING_CONTINUATIONS = (
    "yes",
    "yes please",
    "sure",
    "ok",
    "okay",
    "please",
    "tomorrow",
    "today",
    "morning",
    "afternoon",
    "evening",
    "pm",
    "am",
    "lock it in",
    "lock that in",
    "sounds good",
    "go ahead",
    "do it",
    "perfect",
)

_BOOKING_EXTRACT_PROMPT = """You extract booking requests from a user chat message and recent conversation.
Return ONLY a JSON object with:
- "action": "book" | "confirm" | "none"
- "service_query": string or null (e.g. "Haircut", "Fade", "Balayage", "Braids", "Manicure", "Swedish Massage")
- "preferred_time": string or null (ISO 8601 formatted datetime string like "2026-10-25T14:00:00Z" calculated relative to Current Date/Time, or null if the user has NOT specified a date or time yet)
- "stylist_query": string or null (e.g. "Sarah", "Alex", "Yared Desta", "any", "anyone", "any available stylist", "no preference", or null if not yet mentioned)
- "client_email": string or null (e.g. "user@example.com" if mentioned in the message or recent conversation, otherwise null)
- "notes": string or null

Rules:
- "book": User wants to book or is continuing a booking (e.g. picking a time, choosing a stylist, confirming service).
- "confirm": User explicitly wants to confirm an existing pending booking or finalize a hold.
- "none": User is just asking questions, browsing, or greeting.
- ALWAYS carry over service_query, stylist_query, and preferred_time from recent conversation if they were already identified in previous turns.
- If the user provides a time (e.g. 'tomorrow at 2 pm'), set "preferred_time" to its ISO 8601 datetime based on Current Date/Time, while keeping the service_query and stylist_query from context.
- If the user specifies or selects a stylist (e.g. 'with Yared Desta', 'Yared Desta', 'any stylist'), capture it in "stylist_query", while keeping service_query and preferred_time from context.
- If the user replies with 'yes', 'yes please', 'sounds good', 'lock it in', 'confirm', or agrees to book, keep action="book" (or "confirm" if pending), and preserve the service_query, preferred_time, and stylist_query from context.
- If the user has NOT specified any preference for a stylist yet, set "stylist_query" to null.
- If the user has NOT specified a date or time yet, set "preferred_time" to null. DO NOT assume or invent a date or time.
- If the user provided or answers with their email address, capture it in "client_email".
"""

_CONFIRM_TERMS = "I authorize a $0 PayPal authorization hold for this booking."


def mentions_booking(message: str, history: list[ChatMessage] | None = None) -> bool:
    """Fast gate: check if message or recent assistant turn looks like booking."""
    lowered = message.lower().strip()
    if any(phrase in lowered for phrase in BOOKING_INTENT_PHRASES):
        return True

    if history and len(history) > 0:
        recent_assistant_turns = [m for m in history[-4:] if m.role == "assistant"]
        assistant_was_booking = any(
            any(hint in turn.content.lower() for hint in ASSISTANT_BOOKING_PROMPTS)
            for turn in recent_assistant_turns
        )
        if assistant_was_booking:
            if any(term in lowered for term in USER_BOOKING_CONTINUATIONS):
                return True
            if re.search(r"\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b", lowered):
                return True
            if "@" in lowered:
                return True
            if len(lowered.split()) <= 4:
                return True

    return False


def _extract_json(text: str) -> dict[str, Any] | None:
    text = text.strip()
    try:
        data = json.loads(text)
        return data if isinstance(data, dict) else None
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return None
    try:
        data = json.loads(match.group(0))
        return data if isinstance(data, dict) else None
    except json.JSONDecodeError:
        return None


def _parse_starts_at(preferred_time: str | None) -> datetime | None:
    if not preferred_time or not preferred_time.strip():
        return None
    cleaned = preferred_time.strip()
    try:
        dt = datetime.fromisoformat(cleaned.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=UTC)
        return dt
    except ValueError:
        pass

    try:
        from dateutil import parser

        dt = parser.parse(cleaned)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=UTC)
        return dt
    except Exception:
        pass

    low = cleaned.lower()
    now = datetime.now(UTC)
    base_day = now
    if "tomorrow" in low:
        base_day = now + timedelta(days=1)
    elif "today" in low:
        base_day = now

    time_match = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)?", low)
    if time_match:
        h = int(time_match.group(1))
        m = int(time_match.group(2) or 0)
        meridiem = time_match.group(3)
        if meridiem == "pm" and h < 12:
            h += 12
        elif meridiem == "am" and h == 12:
            h = 0
        hour, minute = h, m
        return base_day.replace(hour=hour, minute=minute, second=0, microsecond=0)

    return None


async def _extract_booking_action(
    llm: BaseLLMService,
    message: str,
    history: list[ChatMessage] | None = None,
) -> dict[str, Any] | None:
    """Ask the LLM for book/confirm slots. None means the turn is not a booking."""
    context_lines = []
    if history:
        for m in history[-6:]:
            context_lines.append(f"{m.role.capitalize()}: {m.content}")
    context_str = "\n".join(context_lines)
    now_str = datetime.now(UTC).strftime("%A, %Y-%m-%d %H:%M UTC")
    user_prompt = (
        f"Current Date/Time: {now_str}\n\nRecent Conversation:\n{context_str}\n\nLatest User Message: {message}"
        if context_str
        else f"Current Date/Time: {now_str}\n\nLatest User Message: {message}"
    )
    messages = [
        {"role": "system", "content": _BOOKING_EXTRACT_PROMPT},
        {"role": "user", "content": user_prompt},
    ]
    try:
        raw = await llm.chat(messages, temperature=0.0)
    except LLMError as exc:
        logger.warning("LLM booking extraction failed: %s", exc)
        return None
    parsed = _extract_json(raw) or {}
    if parsed.get("action") not in ("book", "confirm"):
        return None
    return parsed


async def _resolve_chat_client(
    db: AsyncSession,
    user: User | None,
    client_email: str | None = None,
) -> User | None:
    if user is not None and user.role == UserRole.CLIENT:
        return user
    if client_email:
        res = await db.execute(
            select(User)
            .options(selectinload(User.profile))
            .where(
                User.email == client_email.strip().lower(),
                User.role == UserRole.CLIENT,
            )
            .limit(1)
        )
        return res.scalar_one_or_none()
    return None


async def _confirm_pending_booking(
    db: AsyncSession,
    client: User,
) -> tuple[bool, str, dict[str, str | None] | None]:
    b_res = await db.execute(
        select(Booking)
        .where(Booking.client_id == client.id, Booking.status == BookingStatus.PENDING)
        .order_by(Booking.created_at.desc())
        .limit(1)
    )
    pending = b_res.scalar_one_or_none()
    if pending is None:
        return (
            True,
            "You have no pending bookings awaiting confirmation. All your bookings are already confirmed!",
            None,
        )

    await payment_service.create_consent(
        db,
        booking=pending,
        client_id=client.id,
        terms_version="v1",
        terms_text=_CONFIRM_TERMS,
        signed_payload=f"booking={pending.id};confirmed_via_chat=true",
    )
    hold, _approval = await payment_service.create_hold(
        db,
        booking=pending,
        idempotency_key=f"chat-hold-{pending.id}",
        currency="USD",
    )
    await payment_service.complete_hold(db, hold=hold, paypal_order_token=hold.paypal_order_id)
    await db.commit()

    time_str = pending.starts_at.strftime("%A, %b %d at %I:%M %p")
    confirmed_info = {
        "id": str(pending.id),
        "service_name": "Appointment",
        "starts_at": pending.starts_at.isoformat(),
        "formatted_time": time_str,
        "total_price": str(pending.total_price),
        "status": "CONFIRMED",
    }
    return (
        True,
        (
            f"You're confirmed for {time_str}. Nothing leaves your card today — "
            "just a $0 PayPal hold, and you can cancel free up to 24 hours before."
        ),
        confirmed_info,
    )


async def _resolve_requested_service(db: AsyncSession, service_query: str) -> Service | None:
    clean_query = (service_query or "").strip()
    if not clean_query:
        return None

    # Avoid matching generic intent words as service names
    if clean_query.lower() in {
        "service",
        "services",
        "booking",
        "appointment",
        "treatment",
        "treatments",
        "hair",
        "salon",
    }:
        return None

    parsed_uuid: UUID | None = None
    try:
        parsed_uuid = UUID(clean_query)
    except (ValueError, AttributeError):
        parsed_uuid = None

    stmt = (
        select(Service)
        .join(Organization, Service.organization_id == Organization.id)
        .where(
            Organization.status == OrganizationStatus.APPROVED,
            Service.status == ServiceStatus.ACTIVE,
        )
    )
    if parsed_uuid:
        stmt = stmt.where(Service.id == parsed_uuid)
    else:
        stmt = stmt.where(
            or_(
                Service.name.ilike(f"%{clean_query}%"),
                Organization.name.ilike(f"%{clean_query}%"),
            )
        )

    service = (await db.execute(stmt.limit(1))).scalar_one_or_none()
    return service


async def _get_active_service_cards(db: AsyncSession, limit: int = 4) -> list[dict[str, Any]]:
    result = await db.execute(
        select(Service, Organization)
        .join(Organization, Service.organization_id == Organization.id)
        .where(
            Organization.status == OrganizationStatus.APPROVED,
            Service.status == ServiceStatus.ACTIVE,
        )
        .options(selectinload(Organization.settings))
        .order_by(Service.name)
        .limit(limit)
    )
    cards = []
    for srv, org in result.all():
        settings = org.settings
        cards.append(
            {
                "service_id": str(srv.id),
                "organization_id": str(org.id),
                "name": srv.name,
                "organization_name": org.name,
                "organization_picture": org.picture,
                "image_url": (srv.images or {}).get("cover"),
                "base_price": str(srv.base_price),
                "duration_minutes": srv.duration_minutes,
                "description": srv.description,
                "physical_address": settings.physical_address if settings else None,
            }
        )
    return cards


async def _get_sample_available_slots(
    db: AsyncSession,
    service_id: UUID,
    target_day: date | None = None,
) -> tuple[str, list[str]]:
    """Query live DB availability for service_id on target_day and return formatted slot strings."""
    try:
        from app.services.availability_service import get_availability, resolve_org_timezone

        day = target_day or (datetime.now(UTC) + timedelta(days=1)).date()
        avail = await get_availability(db, service_id=service_id, day=day)
        org_tz = resolve_org_timezone(avail.timezone)
        open_slots = [
            s.starts_at.astimezone(org_tz).strftime("%I:%M %p").lstrip("0")
            for s in avail.slots
            if s.available
        ]
        if open_slots:
            sample_str = f" Available openings tomorrow include {', '.join(open_slots[:4])}."
            return sample_str, open_slots
    except Exception as exc:
        logger.debug("Live availability lookup skipped: %s", exc)
    return "", []


async def _book_requested_service(
    db: AsyncSession,
    client: User,
    parsed: dict[str, Any],
    user_was_anonymous: bool = False,
    frontend_base: str | None = None,
) -> tuple[bool, str, dict[str, Any] | None]:
    service = await _resolve_requested_service(db, parsed.get("service_query") or "")
    if service is None:
        rec_cards = await _get_active_service_cards(db)
        return (
            True,
            "I couldn't find that specific service. Which salon or treatment did you have in mind? Here are some available services you can choose from:",
            {"recommendations": rec_cards},
        )

    starts_at = _parse_starts_at(parsed.get("preferred_time"))
    org = await db.get(Organization, service.organization_id)
    org_name = org.name if org else "Salon"
    stylist_query = parsed.get("stylist_query")

    stylists = await get_organization_stylists(db, service.organization_id)
    stylist_cards = [
        {
            "id": "any",
            "name": "Any available stylist",
            "organization_name": org_name,
            "role": "Fastest appointment",
            "is_any": True,
        }
    ]
    for s in stylists:
        if s.get("display_name"):
            stylist_cards.append(
                {
                    "id": str(s["id"]),
                    "name": s["display_name"],
                    "organization_name": org_name,
                    "role": s.get("role") or "Stylist",
                    "picture": s.get("picture"),
                    "bio": ", ".join(s.get("specialties", [])) if s.get("specialties") else None,
                    "rating": float(s.get("rating_avg", 0.0)) if s.get("rating_avg") else None,
                    "is_any": False,
                }
            )

    # 1. Missing time and missing stylist (e.g. user selected service card)
    if starts_at is None and not stylist_query:
        sample_str, _ = await _get_sample_available_slots(db, service.id)
        reply = (
            f"Great choice! For {service.name} at {org_name},{sample_str} "
            "what date and time would you like to come in? "
            "You can also pick your preferred stylist below, or choose 'Any available stylist'."
        )
        return True, reply, {"stylists": stylist_cards, "needs_time": True, "needs_stylist": True}

    # 2. Missing time, but stylist is chosen
    if starts_at is None and stylist_query:
        _s_id, resolved_stylist = await resolve_stylist(db, service.organization_id, stylist_query)
        sample_str, _ = await _get_sample_available_slots(db, service.id)
        reply = (
            f"Great! What date and time would you like to book {service.name} with {resolved_stylist} at {org_name}? "
            f"(e.g. tomorrow at 2 PM, Friday at 10 AM, or any time that works for you){sample_str}"
        )
        return True, reply, {"needs_time": True}

    # Verify live slot availability before committing
    slot_open = True
    try:
        from app.services.availability_service import check_slot_available

        ends_at = starts_at + timedelta(minutes=service.duration_minutes)
        slot_open = await check_slot_available(
            db,
            service=service,
            starts_at=starts_at,
            ends_at=ends_at,
        )
    except Exception as exc:
        logger.debug("Slot availability pre-check skipped: %s", exc)
        slot_open = True

    if not slot_open:
        sample_str, _ = await _get_sample_available_slots(db, service.id, starts_at.date())
        reply = (
            f"Sorry, that time is no longer available for {service.name} at {org_name}.{sample_str} "
            "Would you like to pick another time?"
        )
        return True, reply, {"needs_time": True}

    # 3. Time is specified, but stylist is not chosen
    time_str = starts_at.strftime("%A, %b %d at %I:%M %p")
    if not stylist_query:
        stylist_names = [s.get("display_name") for s in stylists if s.get("display_name")]
        if stylist_names:
            stylist_options = ", ".join(stylist_names)
            reply = (
                f"Great choice! For {service.name} at {org_name} on {time_str}, "
                f"which stylist would you like to book with? We have {stylist_options}, "
                "or you can choose 'Any available stylist'."
            )
        else:
            reply = (
                f"Great choice! For {service.name} at {org_name} on {time_str}, "
                "would you like to request a specific stylist, or book with any available stylist?"
            )
        return True, reply, {"stylists": stylist_cards, "needs_stylist": True}

    stylist_id, resolved_stylist = await resolve_stylist(db, service.organization_id, stylist_query)

    try:
        booking = await booking_service.create_booking(
            db,
            client_id=client.id,
            org_id=service.organization_id,
            service_ids=[service.id],
            starts_at=starts_at,
            stylist_id=stylist_id,
            customer_notes=parsed.get("notes")
            or f"Booked via AI Concierge Chat · Stylist: {resolved_stylist}",
        )
    except ForbiddenError:
        sample_str, _ = await _get_sample_available_slots(db, service.id, starts_at.date())
        return (
            True,
            f"That time slot was just booked or is unavailable for {service.name} at {org_name}.{sample_str} Want to try another time?",
            {"needs_time": True},
        )
    except Exception as exc:
        logger.error("Failed to create booking via chat: %s", exc)
        return (
            True,
            f"I ran into a snag reserving that slot: {exc}. Want to try another time?",
            None,
        )

    payment_link = ""
    try:
        await payment_service.create_consent(
            db,
            booking=booking,
            client_id=client.id,
            terms_version="v1",
            terms_text=_CONFIRM_TERMS,
            signed_payload=f"booking={booking.id};client={client.id};chat_booking=true",
        )
        hold, approval_url = await payment_service.create_hold(
            db,
            booking=booking,
            idempotency_key=f"chat-hold-{booking.id}",
            currency="USD",
            frontend_base=frontend_base,
        )
        await db.commit()
        payment_link = approval_url or f"/client/paypal/return?hold_id={hold.id}"
    except Exception as exc:
        logger.warning("Failed to place PayPal hold on chat booking %s: %s", booking.id, exc)
        await db.commit()
        payment_link = f"/client/book/{service.id}?slot={starts_at.isoformat()}"

    commission_amount = str(booking.commission_snapshot.get("amount", "0.00"))
    free_cancel_str = booking.free_cancel_deadline_at.strftime("%A, %b %d at %I:%M %p")

    booking_info = {
        "id": str(booking.id),
        "service_name": service.name,
        "organization_name": org_name,
        "stylist_name": resolved_stylist,
        "starts_at": starts_at.isoformat(),
        "formatted_time": time_str,
        "service_price": str(booking.total_price),
        "platform_fee": commission_amount,
        "hold_amount": str(booking.agreed_hold_amount),
        "total_price": str(booking.total_price),
        "free_cancel_deadline": booking.free_cancel_deadline_at.isoformat(),
        "free_cancel_label": free_cancel_str,
        "late_cancel_fee": str(booking.agreed_late_cancel_fee),
        "no_show_fee": str(booking.agreed_no_show_fee),
        "status": "PENDING",
        "payment_link": payment_link,
    }

    if user_was_anonymous and client is not None:
        auth_token = create_access_token(client.id, extra_claims={"role": client.role.value})
        u_first = (client.profile.first_name if client.profile else "") or ""
        u_last = (client.profile.last_name if client.profile else "") or ""
        u_name = f"{u_first} {u_last}".strip() or client.email
        booking_info["auth_token"] = auth_token
        booking_info["user"] = {
            "id": str(client.id),
            "email": client.email,
            "role": client.role.value,
            "first_name": u_first,
            "last_name": u_last,
            "name": u_name,
            "org_id": str(client.org_id) if client.org_id else None,
        }

    return (
        True,
        (
            f"I've reserved your appointment for {service.name} with {resolved_stylist} at {org_name} on {time_str}. "
            f"Service price is ${booking.total_price} plus a ${commission_amount} platform fee (total hold ${booking.agreed_hold_amount}, $0 charged today). "
            f"Free cancellation is available until {free_cancel_str} (late cancel: ${booking.agreed_late_cancel_fee}, no-show: ${booking.agreed_no_show_fee}). "
            "Please review the cancellation policy, accept the terms, and click the PayPal button below to complete your authorization hold."
        ),
        booking_info,
    )


async def try_handle_chat_booking(
    db: AsyncSession,
    llm: BaseLLMService,
    message: str,
    history: list[ChatMessage],
    user: User | None = None,
    frontend_base: str | None = None,
) -> tuple[bool, str, dict[str, Any] | None]:
    """Check if the user is asking to book or confirm an appointment, and execute if so.

    Returns:
        (handled, reply_text, confirmed_booking_dict)
    """
    if not mentions_booking(message, history):
        return False, "", None

    parsed = await _extract_booking_action(llm, message, history)
    if parsed is None:
        return False, "", None

    client_email = parsed.get("client_email")
    client = await _resolve_chat_client(db, user, client_email)
    if client is None:
        auth_ui_action = {
            "action": "open_auth_modal",
            "target": "sign-in",
            "label": "Sign In",
            "details": "Sign in or create an account to reserve your appointment and authorize the PayPal deposit hold.",
        }
        rec_cards: list[dict[str, Any]] = []
        if parsed.get("service_query"):
            matched_svc = await _resolve_requested_service(db, parsed.get("service_query") or "")
            if matched_svc:
                m_org = await db.get(
                    Organization,
                    matched_svc.organization_id,
                    options=[selectinload(Organization.settings)],
                )
                rec_cards.append(
                    {
                        "service_id": str(matched_svc.id),
                        "organization_id": str(matched_svc.organization_id),
                        "name": matched_svc.name,
                        "organization_name": m_org.name if m_org else "Salon",
                        "organization_picture": m_org.picture if m_org else None,
                        "image_url": (matched_svc.images or {}).get("cover"),
                        "base_price": str(matched_svc.base_price),
                        "duration_minutes": matched_svc.duration_minutes,
                        "description": matched_svc.description,
                        "physical_address": m_org.settings.physical_address
                        if (m_org and m_org.settings)
                        else None,
                    }
                )
        if client_email:
            return (
                True,
                f"I couldn't find a registered client account for '{client_email}'. "
                "I've opened the sign-in modal for you — please sign in or create an account to continue your booking right here!",
                {
                    "ui_action": auth_ui_action,
                    "needs_auth": True,
                    "recommendations": rec_cards,
                },
            )
        return (
            True,
            "To reserve your appointment and authorize the PayPal hold, you must be signed in. "
            "I've opened the sign-in modal for you — once signed in, we can finalize your booking right here!",
            {
                "ui_action": auth_ui_action,
                "needs_auth": True,
                "recommendations": rec_cards,
            },
        )

    user_was_anonymous = user is None
    if parsed.get("action") == "confirm":
        return await _confirm_pending_booking(db, client)
    return await _book_requested_service(
        db, client, parsed, user_was_anonymous=user_was_anonymous, frontend_base=frontend_base
    )
