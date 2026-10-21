"""Payment notification service for booking confirmations and updates."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.booking import Booking, BookingService
from app.models.organization import Organization
from app.models.service import Service
from app.models.user import User
from app.services import email_service


async def send_booking_confirmation_notification(db: AsyncSession, booking: Booking) -> None:
    """Send email client confirmation + ops notification after hold authorization."""
    client_result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == booking.client_id)
    )
    client = client_result.scalar_one_or_none()
    org = await db.get(Organization, booking.org_id)

    service_name = "Appointment"
    bs_result = await db.execute(
        select(BookingService)
        .options(selectinload(BookingService.service))
        .where(BookingService.booking_id == booking.id)
        .limit(1)
    )
    first_line = bs_result.scalar_one_or_none()
    if first_line is not None and isinstance(first_line.service, Service):
        service_name = first_line.service.name

    client_name = "there"
    client_email = None
    if client is not None:
        client_email = client.email
        if client.profile is not None:
            client_name = client.profile.first_name or client_name

    starts_label = booking.starts_at.strftime("%Y-%m-%d %H:%M %Z") or booking.starts_at.isoformat()
    free_label = (
        booking.free_cancel_deadline_at.strftime("%Y-%m-%d %H:%M %Z")
        or booking.free_cancel_deadline_at.isoformat()
    )
    salon_name = org.name if org else "Salon"

    if client_email:
        await email_service.send_booking_confirmation_email(
            to_address=client_email,
            client_name=client_name,
            service_name=service_name,
            salon_name=salon_name,
            starts_at_label=starts_label,
            hold_amount=str(booking.agreed_hold_amount),
            no_show_fee=str(booking.agreed_no_show_fee),
            free_cancel_deadline=free_label,
            booking_id=str(booking.id),
        )

    await email_service.notify_platform(
        subject=f"New booking confirmed — {salon_name}",
        body=(
            f"Booking {booking.id} confirmed at {salon_name}.\n"
            f"Client: {client_name} <{client_email or 'n/a'}>\n"
            f"Service: {service_name}\n"
            f"When: {starts_label}\n"
            f"Hold: ${booking.agreed_hold_amount}\n"
        ),
    )
