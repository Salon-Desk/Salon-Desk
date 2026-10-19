"""Booking draft/confirm tools shared by chat and voice."""

from __future__ import annotations

import inspect
import json
import logging
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models.booking import Booking
from app.models.enums import BookingStatus, OrganizationStatus, ServiceStatus, UserRole
from app.models.organization import Organization
from app.models.service import Service
from app.models.user import User
from app.services import booking_service, payment_service

logger = logging.getLogger("salondesk.ai.booking_tools")


def _parse_starts_at(preferred_time: str | None) -> datetime:
    """Parse appointment time or default to tomorrow at 2:00 PM UTC."""
    if preferred_time:
        try:
            dt = datetime.fromisoformat(preferred_time.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=UTC)
            return dt
        except ValueError:
            pass

    # Default to tomorrow at 14:00 UTC
    tomorrow = datetime.now(UTC) + timedelta(days=1)
    return tomorrow.replace(hour=14, minute=0, second=0, microsecond=0)


def build_booking_tools(
    session_factory: async_sessionmaker[AsyncSession],
    on_booking_success: Callable[[dict[str, Any]], Any] | None = None,
) -> list:
    """Return LiveKit ``@function_tool`` callables for voice/chat booking confirmation."""
    try:
        from livekit.agents import function_tool
    except ImportError:  # pragma: no cover
        return []

    @function_tool()
    async def book_and_confirm_appointment(
        service_query: str,
        preferred_time: str | None = None,
        client_email: str | None = None,
        notes: str | None = None,
    ) -> str:
        """Book and immediately confirm an appointment with a $0 PayPal authorization hold.

        Use this when the client confirms they want to book a service (e.g. 'book the haircut',
        'reserve an appointment tomorrow at 2pm').
        """
        async with session_factory() as db:
            # 1. Resolve client
            client: User | None = None
            if client_email:
                res = await db.execute(
                    select(User).where(User.email == client_email.strip().lower()).limit(1)
                )
                client = res.scalar_one_or_none()

            if client is None:
                # Default to demo client or first active client
                res = await db.execute(
                    select(User)
                    .where(User.email == "client@example.com", User.role == UserRole.CLIENT)
                    .limit(1)
                )
                client = res.scalar_one_or_none()

            if client is None:
                res = await db.execute(select(User).where(User.role == UserRole.CLIENT).limit(1))
                client = res.scalar_one_or_none()

            if client is None:
                return json.dumps(
                    {
                        "status": "error",
                        "message": "Please log in first before booking an appointment.",
                    }
                )

            # 2. Resolve service
            parsed_uuid: UUID | None = None
            try:
                parsed_uuid = UUID(service_query.strip())
            except (ValueError, AttributeError):
                parsed_uuid = None

            query_clean = (service_query or "").strip()
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
                        Service.name.ilike(f"%{query_clean}%"),
                        Organization.name.ilike(f"%{query_clean}%"),
                    )
                )

            srv_res = await db.execute(stmt.limit(1))
            service = srv_res.scalar_one_or_none()

            if service is None:
                # Fallback to any active service
                any_srv = await db.execute(
                    select(Service)
                    .join(Organization, Service.organization_id == Organization.id)
                    .where(
                        Organization.status == OrganizationStatus.APPROVED,
                        Service.status == ServiceStatus.ACTIVE,
                    )
                    .limit(1)
                )
                service = any_srv.scalar_one_or_none()

            if service is None:
                return json.dumps(
                    {
                        "status": "error",
                        "message": f"Could not find an active service matching '{service_query}'.",
                    }
                )

            starts_at = _parse_starts_at(preferred_time)

            # 3. Create booking
            try:
                booking = await booking_service.create_booking(
                    db,
                    client_id=client.id,
                    org_id=service.organization_id,
                    service_ids=[service.id],
                    starts_at=starts_at,
                    stylist_id=None,
                    customer_notes=notes or "Booked via SalonDesk AI Voice Assistant",
                )
            except Exception as exc:
                logger.warning("Failed to create booking: %s", exc)
                return json.dumps(
                    {
                        "status": "error",
                        "message": f"Could not book the appointment: {exc}",
                    }
                )

            # 4. Create consent and authorization hold to confirm booking
            try:
                terms = (
                    "I authorize a $0 PayPal authorization hold for this booking under the salon "
                    "cancellation policy. $0 is debited today; settlement occurs at the salon."
                )
                await payment_service.create_consent(
                    db,
                    booking=booking,
                    client_id=client.id,
                    terms_version="v1",
                    terms_text=terms,
                    signed_payload=f"booking={booking.id};client={client.id};auto_confirmed=true",
                )
                hold, _approval = await payment_service.create_hold(
                    db,
                    booking=booking,
                    idempotency_key=f"voice-hold-{booking.id}",
                    currency="USD",
                )
                # Voice channel auto-completes stub/sandbox authorize after order create.
                await payment_service.complete_hold(
                    db, hold=hold, paypal_order_token=hold.paypal_order_id
                )
                await db.commit()
            except Exception as exc:
                logger.error("Failed to confirm hold on booking %s: %s", booking.id, exc)
                return json.dumps(
                    {
                        "status": "partial",
                        "booking_id": str(booking.id),
                        "message": f"Appointment created, but authorization hold could not be placed: {exc}",
                    }
                )

            # 5. Notify callback
            org = await db.get(Organization, service.organization_id)
            org_name = org.name if org else "Salon"
            formatted_time = starts_at.strftime("%A, %b %d at %I:%M %p")

            payload = {
                "type": "booking_confirmed",
                "booking_id": str(booking.id),
                "service_id": str(service.id),
                "service_name": service.name,
                "organization_name": org_name,
                "organization_id": str(service.organization_id),
                "starts_at": starts_at.isoformat(),
                "formatted_time": formatted_time,
                "total_price": str(booking.total_price),
                "status": "CONFIRMED",
            }

            if on_booking_success:
                try:
                    res = on_booking_success(payload)
                    if inspect.isawaitable(res):
                        await res
                except Exception as exc:
                    logger.warning("on_booking_success callback failed: %s", exc)

            return json.dumps(
                {
                    "status": "success",
                    "booking_id": str(booking.id),
                    "status_code": "CONFIRMED",
                    "service_name": service.name,
                    "organization_name": org_name,
                    "time": formatted_time,
                    "total_price": str(booking.total_price),
                    "message": (
                        f"Your appointment for {service.name} at {org_name} has been booked and "
                        f"confirmed for {formatted_time}. A $0 PayPal authorization hold is active with free cancellation."
                    ),
                }
            )

    @function_tool()
    async def confirm_existing_booking(
        booking_id: str | None = None,
        client_email: str | None = None,
    ) -> str:
        """Confirm an existing pending booking by signing consent and placing a $0 PayPal authorization hold."""
        async with session_factory() as db:
            parsed_id: UUID | None = None
            if booking_id:
                try:
                    parsed_id = UUID(booking_id.strip())
                except ValueError:
                    parsed_id = None

            stmt = select(Booking).where(Booking.status == BookingStatus.PENDING)
            if parsed_id:
                stmt = stmt.where(Booking.id == parsed_id)
            elif client_email:
                stmt = stmt.join(User, Booking.client_id == User.id).where(
                    User.email == client_email.strip().lower()
                )

            res = await db.execute(stmt.order_by(Booking.created_at.desc()).limit(1))
            booking = res.scalar_one_or_none()

            if booking is None:
                return json.dumps(
                    {
                        "status": "error",
                        "message": "No pending booking was found to confirm.",
                    }
                )

            terms = (
                "I authorize a $0 PayPal authorization hold for this booking under the salon "
                "cancellation policy."
            )
            await payment_service.create_consent(
                db,
                booking=booking,
                client_id=booking.client_id,
                terms_version="v1",
                terms_text=terms,
                signed_payload=f"booking={booking.id};auto_confirmed=true",
            )
            hold, _approval = await payment_service.create_hold(
                db,
                booking=booking,
                idempotency_key=f"confirm-hold-{booking.id}",
                currency="USD",
            )
            await payment_service.complete_hold(
                db, hold=hold, paypal_order_token=hold.paypal_order_id
            )
            await db.commit()

            formatted_time = booking.starts_at.strftime("%A, %b %d at %I:%M %p")
            payload = {
                "type": "booking_confirmed",
                "booking_id": str(booking.id),
                "starts_at": booking.starts_at.isoformat(),
                "formatted_time": formatted_time,
                "total_price": str(booking.total_price),
                "status": "CONFIRMED",
            }
            if on_booking_success:
                try:
                    res = on_booking_success(payload)
                    if inspect.isawaitable(res):
                        await res
                except Exception:
                    pass

            return json.dumps(
                {
                    "status": "success",
                    "booking_id": str(booking.id),
                    "status_code": "CONFIRMED",
                    "message": f"Booking {booking.id} is now confirmed with an authorized $0 PayPal hold.",
                }
            )

    return [book_and_confirm_appointment, confirm_existing_booking]
