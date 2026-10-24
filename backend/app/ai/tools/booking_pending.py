"""Pending booking tool that returns a checkout link instead of placing a hold."""

from __future__ import annotations

import logging
from collections.abc import Callable
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models.organization import Organization
from app.services import booking_service, payment_service

from .booking_helpers import (
    invoke_callback,
    parse_starts_at,
    resolve_client,
    resolve_service,
    resolve_stylist,
)
from .booking_responses import error_response, pending_payment_response

logger = logging.getLogger("salondesk.ai.booking_tools")

_PENDING_CONFIRM_TERMS = (
    "I authorize a $0 PayPal authorization hold for this booking under the salon "
    "cancellation policy."
)


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
        stylist_name: str | None = None,
        client_email: str | None = None,
        notes: str | None = None,
    ) -> str:
        """Create a pending booking and return the direct PayPal authorization hold link.

        Use this when the client confirms they want to book a service at a specific time
        with a chosen stylist (or 'any available stylist'). This creates the booking,
        sets up the PayPal authorization hold, and returns the direct PayPal payment link.
        """
        async with session_factory() as db:
            client = await resolve_client(db, client_email)
            if client is None:
                if client_email:
                    return error_response(
                        f"I couldn't find a client account for '{client_email}'. "
                        "Please create an account or sign in first."
                    )
                return error_response(
                    "You need to be signed in or provide your registered email address before booking. "
                    "Could you please tell me your account email?"
                )

            service = await resolve_service(db, service_query)
            if service is None:
                return error_response(
                    f"Could not find an active service matching '{service_query}'."
                )

            starts_at = parse_starts_at(preferred_time)
            stylist_id, resolved_stylist = await resolve_stylist(
                db, service.organization_id, stylist_name
            )

            try:
                booking = await booking_service.create_booking(
                    db,
                    client_id=client.id,
                    org_id=service.organization_id,
                    service_ids=[service.id],
                    starts_at=starts_at,
                    stylist_id=stylist_id,
                    customer_notes=notes
                    or f"Booked via SalonDesk AI Voice Assistant · Stylist: {resolved_stylist}",
                )
            except Exception as exc:
                logger.warning("Failed to create booking: %s", exc)
                return error_response(f"Could not book the appointment: {exc}")

            payment_link = ""
            try:
                await payment_service.create_consent(
                    db,
                    booking=booking,
                    client_id=client.id,
                    terms_version="v1",
                    terms_text=_PENDING_CONFIRM_TERMS,
                    signed_payload=f"booking={booking.id};client={client.id};voice_booking=true",
                )
                hold, approval_url = await payment_service.create_hold(
                    db,
                    booking=booking,
                    idempotency_key=f"voice-hold-{booking.id}",
                    currency="USD",
                )
                await db.commit()
                payment_link = approval_url or f"/client/paypal/return?hold_id={hold.id}"
            except Exception as exc:
                logger.warning(
                    "Failed to place PayPal hold on pending booking %s: %s", booking.id, exc
                )
                await db.commit()
                payment_link = f"/client/book/{service.id}?slot={starts_at.isoformat()}"

            org = await db.get(Organization, service.organization_id)
            org_name = org.name if org else "Salon"
            formatted_time = starts_at.strftime("%A, %b %d at %I:%M %p")
            commission_amount = str(booking.commission_snapshot.get("amount", "0.00"))
            free_cancel_str = booking.free_cancel_deadline_at.strftime("%A, %b %d at %I:%M %p")

            payload = {
                "type": "payment_link",
                "booking_id": str(booking.id),
                "service_id": str(service.id),
                "service_name": service.name,
                "organization_name": org_name,
                "organization_id": str(service.organization_id),
                "stylist_name": resolved_stylist,
                "starts_at": starts_at.isoformat(),
                "formatted_time": formatted_time,
                "service_price": str(booking.total_price),
                "platform_fee": commission_amount,
                "hold_amount": str(booking.agreed_hold_amount),
                "total_price": str(booking.total_price),
                "free_cancel_deadline": booking.free_cancel_deadline_at.isoformat(),
                "free_cancel_label": free_cancel_str,
                "late_cancel_fee": str(booking.agreed_late_cancel_fee),
                "no_show_fee": str(booking.agreed_no_show_fee),
                "payment_link": payment_link,
            }
            await invoke_callback(on_payment_link, payload, log_label="on_payment_link")

            return pending_payment_response(
                booking_id=str(booking.id),
                service_id=str(service.id),
                service_name=service.name,
                org_name=org_name,
                org_id=str(service.organization_id),
                stylist_name=resolved_stylist,
                starts_at=starts_at.isoformat(),
                formatted_time=formatted_time,
                service_price=str(booking.total_price),
                platform_fee=commission_amount,
                hold_amount=str(booking.agreed_hold_amount),
                total_price=str(booking.total_price),
                free_cancel_deadline=booking.free_cancel_deadline_at.isoformat(),
                free_cancel_label=free_cancel_str,
                late_cancel_fee=str(booking.agreed_late_cancel_fee),
                no_show_fee=str(booking.agreed_no_show_fee),
                payment_link=payment_link,
                message=(
                    f"I've reserved your appointment for {service.name} with {resolved_stylist} at {org_name} on {formatted_time}. "
                    f"The service price is ${booking.total_price} plus a platform fee of ${commission_amount} (total hold ${booking.agreed_hold_amount}, $0 charged today). "
                    f"Free cancellation is available until {free_cancel_str} (late cancel: ${booking.agreed_late_cancel_fee}, no-show: ${booking.agreed_no_show_fee}). "
                    "Please review the cancellation policy, accept the terms, and click the PayPal link to complete your authorization hold."
                ),
            )

    return [create_pending_booking_with_payment_link]
