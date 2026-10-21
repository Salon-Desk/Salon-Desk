"""Confirm and hold tools for voice and chat booking."""

from __future__ import annotations

import logging
from collections.abc import Callable
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models.booking import Booking
from app.models.enums import BookingStatus
from app.models.organization import Organization
from app.models.user import User
from app.services import booking_service, payment_service

from .booking_helpers import (
    build_booking_payload,
    invoke_callback,
    parse_starts_at,
    resolve_client,
    resolve_service,
)
from .booking_responses import error_response, partial_success_response, success_response

logger = logging.getLogger("salondesk.ai.booking_tools")

_CONFIRM_TERMS = (
    "I authorize a $0 PayPal authorization hold for this booking under the salon "
    "cancellation policy. $0 is debited today; settlement occurs at the salon."
)
_EXISTING_TERMS = (
    "I authorize a $0 PayPal authorization hold for this booking under the salon "
    "cancellation policy."
)


def build_confirm_tools(
    session_factory: async_sessionmaker[AsyncSession],
    on_booking_success: Callable[[dict[str, Any]], Any] | None,
    function_tool: Callable,
) -> list:
    """Return tools that place a PayPal hold and confirm a booking."""

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
            client = await resolve_client(db, client_email)
            if client is None:
                return error_response("Please log in first before booking an appointment.")

            service = await resolve_service(db, service_query)
            if service is None:
                return error_response(
                    f"Could not find an active service matching '{service_query}'."
                )

            starts_at = parse_starts_at(preferred_time)

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
                return error_response(f"Could not book the appointment: {exc}")

            try:
                await payment_service.create_consent(
                    db,
                    booking=booking,
                    client_id=client.id,
                    terms_version="v1",
                    terms_text=_CONFIRM_TERMS,
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
                return partial_success_response(
                    str(booking.id),
                    f"Appointment created, but authorization hold could not be placed: {exc}",
                )

            org = await db.get(Organization, service.organization_id)
            formatted_time = starts_at.strftime("%A, %b %d at %I:%M %p")
            payload = build_booking_payload(booking, service, org, starts_at)
            await invoke_callback(on_booking_success, payload, log_label="on_booking_success")

            org_name = org.name if org else "Salon"
            return success_response(
                booking_id=str(booking.id),
                service_name=service.name,
                org_name=org_name,
                formatted_time=formatted_time,
                total_price=str(booking.total_price),
                message=(
                    f"Your appointment for {service.name} at {org_name} has been booked and "
                    f"confirmed for {formatted_time}. A $0 PayPal authorization hold is active with free cancellation."
                ),
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
                return error_response("No pending booking was found to confirm.")

            await payment_service.create_consent(
                db,
                booking=booking,
                client_id=booking.client_id,
                terms_version="v1",
                terms_text=_EXISTING_TERMS,
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
            await invoke_callback(
                on_booking_success, payload, log_label="on_booking_success", silent=True
            )

            return success_response(
                booking_id=str(booking.id),
                service_name="",
                org_name="",
                formatted_time=formatted_time,
                total_price=str(booking.total_price),
                message=f"Booking {booking.id} is now confirmed with an authorized $0 PayPal hold.",
            )

    return [book_and_confirm_appointment, confirm_existing_booking]
