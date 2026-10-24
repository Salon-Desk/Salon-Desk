"""Tools that list and cancel a client's bookings."""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy.orm import selectinload

from app.models.booking import Booking
from app.services import booking_service

from .booking_helpers import build_booking_data_dict, resolve_client
from .booking_responses import (
    bookings_list_response,
    cancel_free_response,
    cancel_late_response,
    error_response,
    no_bookings_response,
)

logger = logging.getLogger("salondesk.ai.booking_tools")

_CANCELLABLE = ("CONFIRMED", "PENDING", "REAUTHORIZED")


def build_manage_tools(
    session_factory: async_sessionmaker[AsyncSession],
    function_tool,
) -> list:
    """Return tools that read and cancel client bookings."""

    @function_tool()
    async def get_client_bookings(
        client_email: str | None = None,
    ) -> str:
        """Get the client's current and upcoming bookings with cancellation details.

        Use this when the client asks about their bookings, appointments, or reservations.
        """
        async with session_factory() as db:
            client = await resolve_client(db, client_email)
            if client is None:
                return error_response("Please log in first to view your bookings.")

            bookings_result = await db.execute(
                select(Booking)
                .where(Booking.client_id == client.id)
                .options(selectinload(Booking.organization))
                .order_by(Booking.starts_at.desc())
                .limit(10)
            )
            bookings = list(bookings_result.scalars().all())

            if not bookings:
                return no_bookings_response()

            booking_data = [build_booking_data_dict(b) for b in bookings]
            return bookings_list_response(booking_data, len(bookings))

    @function_tool()
    async def cancel_booking(
        booking_id: str,
        client_email: str | None = None,
    ) -> str:
        """Cancel a booking and explain what the client gains or loses.

        Use this when the client wants to cancel an appointment. This will explain
        the cancellation policy impact (free cancel vs late cancel fee).
        """
        async with session_factory() as db:
            try:
                parsed_id = UUID(booking_id.strip())
            except ValueError:
                return error_response("Invalid booking ID format.")

            stmt = (
                select(Booking)
                .options(selectinload(Booking.organization))
                .where(Booking.id == parsed_id)
            )
            res = await db.execute(stmt)
            booking = res.scalar_one_or_none()

            if not booking:
                return error_response("Booking not found.")

            if booking.status.value not in _CANCELLABLE:
                return error_response(
                    f"This booking cannot be cancelled. Current status: {booking.status.value}"
                )

            now = datetime.now(UTC)
            is_free_cancel = (
                booking.free_cancel_deadline_at and now < booking.free_cancel_deadline_at
            )
            formatted_time = booking.starts_at.strftime("%A, %b %d at %I:%M %p")
            deadline_str = (
                booking.free_cancel_deadline_at.strftime("%b %d at %I:%M %p")
                if booking.free_cancel_deadline_at
                else "24h prior"
            )

            if is_free_cancel:
                try:
                    await booking_service.cancel_booking(db, booking.id, reason="Client request")
                    await db.commit()
                    return cancel_free_response(
                        booking_id=str(booking.id),
                        refund_amount=str(booking.agreed_hold_amount),
                        deadline=deadline_str,
                        formatted_time=formatted_time,
                    )
                except Exception as exc:
                    logger.warning("Failed to cancel booking: %s", exc)
                    return error_response(f"Could not cancel booking: {exc}")

            return cancel_late_response(
                booking_id=str(booking.id),
                late_fee=str(booking.agreed_late_cancel_fee),
                deadline=deadline_str,
            )

    return [get_client_bookings, cancel_booking]
