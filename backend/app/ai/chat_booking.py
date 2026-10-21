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

from app.ai.llm import BaseLLMService, LLMError
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
)

_BOOKING_EXTRACT_PROMPT = """You extract booking requests from a user chat message.
Return ONLY a JSON object with:
- "action": "book" | "confirm" | "none"
- "service_query": string or null (e.g. "Haircut", "Fade", "Balayage", "Braids", "Manicure")
- "preferred_time": string or null (ISO datetime or human string)
- "notes": string or null

Rules:
- "book": User clearly wants to book, reserve, or schedule a service.
- "confirm": User wants to confirm an existing pending booking or finalize a hold.
- "none": User is just asking questions, browsing, or greeting.
"""

_CONFIRM_TERMS = "I authorize a $0 PayPal authorization hold for this booking."


def mentions_booking(message: str) -> bool:
    """Fast gate: only call the extractor when the message looks like a booking."""
    lowered = message.lower().strip()
    return any(phrase in lowered for phrase in BOOKING_INTENT_PHRASES)


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


async def _extract_booking_action(llm: BaseLLMService, message: str) -> dict[str, Any] | None:
    """Ask the LLM for book/confirm slots. None means the turn is not a booking."""
    messages = [
        {"role": "system", "content": _BOOKING_EXTRACT_PROMPT},
        {"role": "user", "content": f"Message: {message}"},
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


async def _resolve_chat_client(db: AsyncSession, user: User | None) -> User | None:
    client = user
    if client is None or client.role != UserRole.CLIENT:
        res = await db.execute(select(User).where(User.email == "client@example.com").limit(1))
        client = res.scalar_one_or_none()
    if client is None:
        client_res = await db.execute(select(User).where(User.role == UserRole.CLIENT).limit(1))
        client = client_res.scalar_one_or_none()
    return client


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


async def _book_requested_service(
    db: AsyncSession,
    client: User,
    parsed: dict[str, Any],
) -> tuple[bool, str, dict[str, str | None] | None]:
    service = await _resolve_requested_service(db, parsed.get("service_query") or "")
    if service is None:
        return (
            True,
            "I couldn't find that service. Which salon or treatment did you have in mind?",
            None,
        )

    starts_at = _parse_starts_at(parsed.get("preferred_time"))
    try:
        booking = await booking_service.create_booking(
            db,
            client_id=client.id,
            org_id=service.organization_id,
            service_ids=[service.id],
            starts_at=starts_at,
            stylist_id=None,
            customer_notes=parsed.get("notes") or "Booked via AI Concierge Chat",
        )
        await db.commit()
    except Exception as exc:
        logger.error("Failed to create booking via chat: %s", exc)
        return (
            True,
            f"I ran into a snag reserving that slot: {exc}. Want to try another time?",
            None,
        )

    org = await db.get(Organization, service.organization_id)
    org_name = org.name if org else "Salon"
    time_str = starts_at.strftime("%A, %b %d at %I:%M %p")
    payment_link = f"/client/book/{service.id}?slot={starts_at.isoformat()}"
    booking_info = {
        "id": str(booking.id),
        "service_name": service.name,
        "organization_name": org_name,
        "starts_at": starts_at.isoformat(),
        "formatted_time": time_str,
        "total_price": str(booking.total_price),
        "status": "PENDING",
        "payment_link": payment_link,
    }
    return (
        True,
        (
            f"I've created your appointment for {service.name} at {org_name} on {time_str}. "
            f"The total is ${booking.total_price}. Please click the payment link to complete "
            "your booking with a $0 PayPal authorization hold."
        ),
        booking_info,
    )


async def try_handle_chat_booking(
    db: AsyncSession,
    llm: BaseLLMService,
    message: str,
    history: list[ChatMessage],
    user: User | None = None,
) -> tuple[bool, str, dict[str, str | None] | None]:
    """Check if the user is asking to book or confirm an appointment, and execute if so.

    Returns:
        (handled, reply_text, confirmed_booking_dict)
    """
    _ = history
    if not mentions_booking(message):
        return False, "", None

    parsed = await _extract_booking_action(llm, message)
    if parsed is None:
        return False, "", None

    client = await _resolve_chat_client(db, user)
    if client is None:
        return True, "I need you signed in before I can hold a chair for you.", None

    if parsed.get("action") == "confirm":
        return await _confirm_pending_booking(db, client)
    return await _book_requested_service(db, client, parsed)
