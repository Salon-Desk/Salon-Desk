"""Pending booking tool that returns a checkout link instead of placing a hold."""

from __future__ import annotations

import logging
from collections.abc import Callable
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models.organization import Organization
from app.services import booking_service

from .booking_helpers import invoke_callback, parse_starts_at, resolve_client, resolve_service
from .booking_responses import error_response, pending_payment_response

logger = logging.getLogger("salondesk.ai.booking_tools")


def build_pending_tools(
    session_factory: async_sessionmaker[AsyncSession],
    on_payment_link: Callable[[dict[str, Any]], Any] | None,
    function_tool: Callable,
) -> list:
    """Return the tool that creates a pending booking and a payment link."""

    @function_tool()
    async def create_pending_booking_with_payment_link(
        service_query: str,
        preferred_time: str | None = None,
        client_email: str | None = None,
        notes: str | None = None,
    ) -> str:
        """Create a pending booking and return a payment link for the user to click.

        Use this when the client wants to book but should complete payment separately via a link.
        This creates a PENDING booking that the user can complete by clicking the payment link.
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
                await db.commit()
            except Exception as exc:
                logger.warning("Failed to create booking: %s", exc)
                return error_response(f"Could not book the appointment: {exc}")

            org = await db.get(Organization, service.organization_id)
            org_name = org.name if org else "Salon"
            formatted_time = starts_at.strftime("%A, %b %d at %I:%M %p")
            payment_link = f"/client/book/{service.id}?slot={starts_at.isoformat()}"

            payload = {
                "type": "payment_link",
                "booking_id": str(booking.id),
                "service_id": str(service.id),
                "service_name": service.name,
                "organization_name": org_name,
                "organization_id": str(service.organization_id),
                "starts_at": starts_at.isoformat(),
                "formatted_time": formatted_time,
                "total_price": str(booking.total_price),
                "payment_link": payment_link,
            }
            await invoke_callback(on_payment_link, payload, log_label="on_payment_link")

            return pending_payment_response(
                booking_id=str(booking.id),
                service_id=str(service.id),
                service_name=service.name,
                org_name=org_name,
                org_id=str(service.organization_id),
                starts_at=starts_at.isoformat(),
                formatted_time=formatted_time,
                total_price=str(booking.total_price),
                payment_link=payment_link,
                message=(
                    f"I've created your appointment for {service.name} at {org_name} on {formatted_time}. "
                    f"The total is ${booking.total_price}. Please click the payment link to complete your booking with a $0 PayPal authorization hold."
                ),
            )

    return [create_pending_booking_with_payment_link]
