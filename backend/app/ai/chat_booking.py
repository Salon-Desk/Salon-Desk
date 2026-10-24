"""Chat booking handler for booking and confirming appointments via AI concierge."""

from __future__ import annotations

import json
import logging
import re
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.ai.llm import BaseLLMService, LLMError
from app.ai.tools.booking_helpers import get_organization_stylists, resolve_stylist
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
    "reserve",
    "appointment",
    "schedule",
    "confirm booking",
    "hold with paypal",
    "haircut",
    "braid",
    "manicure",
    "pedicure",
    "facial",
    "salon",
    "stylist",
)

_BOOKING_EXTRACT_PROMPT = """You extract booking requests from a user chat message and recent conversation.
Return ONLY a JSON object with:
- "action": "book" | "confirm" | "none"
- "service_query": string or null (e.g. "Haircut", "Fade", "Balayage", "Braids", "Manicure")
- "preferred_time": string or null (ISO datetime or human string like "tomorrow at 2pm", "Friday at 10am")
- "stylist_query": string or null (e.g. "Sarah", "Alex", "any", "anyone", "any available stylist", "no preference", or null if not yet mentioned)
- "client_email": string or null (e.g. "user@example.com" if mentioned in the message or recent conversation, otherwise null)
- "notes": string or null

Rules:
- "book": User wants to book or is continuing a booking (e.g. picking a time, choosing a stylist, confirming service).
- "confirm": User explicitly wants to confirm an existing pending booking or finalize a hold.
- "none": User is just asking questions, browsing, or greeting.
- If the user specifies or selects a stylist (e.g. 'with Sarah', 'Sarah is fine', 'any stylist', 'anyone', 'any available'), capture it in "stylist_query".
- If the user previously mentioned service and time, and is now replying with a stylist (or "any"), keep the service_query and preferred_time from context.
- If the user has NOT specified any preference for a stylist yet, set "stylist_query" to null.
- If the user provided or answers with their email address, capture it in "client_email".
"""

_CONFIRM_TERMS = "I authorize a $0 PayPal authorization hold for this booking."


def mentions_booking(message: str, history: list[ChatMessage] | None = None) -> bool:
    """Fast gate: check if message or recent assistant turn looks like booking."""
    lowered = message.lower().strip()
    if any(phrase in lowered for phrase in BOOKING_INTENT_PHRASES):
        return True
    if history and len(history) > 0:
        last_turns = [m for m in history if m.role == "assistant"]
        if last_turns:
            last_content = last_turns[-1].content.lower()
            if any(w in last_content for w in ("stylist", "appointment", "reserve", "slot")):
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


def _parse_starts_at(preferred_time: str | None) -> datetime:
    if preferred_time:
        try:
            dt = datetime.fromisoformat(preferred_time.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=UTC)
            return dt
        except ValueError:
            pass
    tomorrow = datetime.now(UTC) + timedelta(days=1)
    return tomorrow.replace(hour=14, minute=0, second=0, microsecond=0)


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
    user_prompt = (
        f"Recent Conversation:\n{context_str}\n\nLatest User Message: {message}"
        if context_str
        else f"Latest User Message: {message}"
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
    parsed_uuid: UUID | None = None
    try:
        parsed_uuid = UUID(service_query.strip())
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
    elif service_query:
        stmt = stmt.where(
            or_(
                Service.name.ilike(f"%{service_query.strip()}%"),
                Organization.name.ilike(f"%{service_query.strip()}%"),
            )
        )

    service = (await db.execute(stmt.limit(1))).scalar_one_or_none()
    if service is not None:
        return service

    fallback = await db.execute(
        select(Service)
        .join(Organization, Service.organization_id == Organization.id)
        .where(
            Organization.status == OrganizationStatus.APPROVED,
            Service.status == ServiceStatus.ACTIVE,
        )
        .limit(1)
    )
    return fallback.scalar_one_or_none()


async def _get_active_service_cards(db: AsyncSession, limit: int = 4) -> list[dict[str, Any]]:
    result = await db.execute(
        select(Service, Organization)
        .join(Organization, Service.organization_id == Organization.id)
        .where(
            Organization.status == OrganizationStatus.APPROVED,
            Service.status == ServiceStatus.ACTIVE,
        )
        .order_by(Service.name)
        .limit(limit)
    )
    cards = []
    for srv, org in result.all():
        cards.append(
            {
                "service_id": str(srv.id),
                "organization_id": str(org.id),
                "name": srv.name,
                "organization_name": org.name,
                "organization_picture": org.picture,
                "image_url": srv.image_url,
                "base_price": str(srv.base_price),
                "duration_minutes": srv.duration_minutes,
                "description": srv.description,
                "physical_address": org.physical_address,
            }
        )
    return cards


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
    time_str = starts_at.strftime("%A, %b %d at %I:%M %p")

    stylist_query = parsed.get("stylist_query")
    if not stylist_query:
        stylists = await get_organization_stylists(db, service.organization_id)
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
                        "bio": ", ".join(s.get("specialties", []))
                        if s.get("specialties")
                        else None,
                        "rating": float(s.get("rating_avg", 0.0)) if s.get("rating_avg") else None,
                        "is_any": False,
                    }
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
                m_org = await db.get(Organization, matched_svc.organization_id)
                rec_cards.append(
                    {
                        "service_id": str(matched_svc.id),
                        "organization_id": str(matched_svc.organization_id),
                        "name": matched_svc.name,
                        "organization_name": m_org.name if m_org else "Salon",
                        "organization_picture": m_org.picture if m_org else None,
                        "image_url": matched_svc.image_url,
                        "base_price": str(matched_svc.base_price),
                        "duration_minutes": matched_svc.duration_minutes,
                        "description": matched_svc.description,
                        "physical_address": m_org.physical_address if m_org else None,
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
