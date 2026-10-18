"""Send appointment reminder emails ahead of confirmed bookings."""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.models.booking import Booking, BookingService
from app.models.enums import BookingStatus
from app.models.organization import Organization
from app.models.service import Service
from app.models.user import User
from app.services import email_service

logger = logging.getLogger(__name__)

# Remind clients roughly one day before the appointment starts.
REMINDER_WINDOW_START = timedelta(hours=20)
REMINDER_WINDOW_END = timedelta(hours=28)


async def run_booking_reminder_loop(*, interval_seconds: float = 300.0) -> None:
    while True:
        try:
            sent = await tick()
            if sent:
                logger.info("Sent %s booking reminder email(s)", sent)
        except Exception:
            logger.exception("Booking reminder tick failed")
        await asyncio.sleep(interval_seconds)


async def tick() -> int:
    now = datetime.now(UTC)
    window_start = now + REMINDER_WINDOW_START
    window_end = now + REMINDER_WINDOW_END
    sent = 0

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Booking)
            .where(
                Booking.status == BookingStatus.CONFIRMED,
                Booking.reminder_sent_at.is_(None),
                Booking.starts_at >= window_start,
                Booking.starts_at <= window_end,
            )
            .limit(50)
        )
        bookings = list(result.scalars().all())

        for booking in bookings:
            ok = await _send_reminder(db, booking)
            if ok:
                booking.reminder_sent_at = now
                sent += 1

        if sent:
            await db.commit()
        else:
            await db.rollback()

    return sent


async def _send_reminder(db, booking: Booking) -> bool:
    client_result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == booking.client_id)
    )
    client = client_result.scalar_one_or_none()
    if client is None or not client.email:
        return False

    org = await db.get(Organization, booking.org_id)
    salon_name = org.name if org else "Salon"

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
    if client.profile is not None and client.profile.first_name:
        client_name = client.profile.first_name

    starts_label = booking.starts_at.strftime("%Y-%m-%d %H:%M %Z") or booking.starts_at.isoformat()
    free_label = (
        booking.free_cancel_deadline_at.strftime("%Y-%m-%d %H:%M %Z")
        or booking.free_cancel_deadline_at.isoformat()
    )

    return await email_service.send_booking_reminder_email(
        to_address=client.email,
        client_name=client_name,
        service_name=service_name,
        salon_name=salon_name,
        starts_at_label=starts_label,
        free_cancel_deadline=free_label,
        booking_id=str(booking.id),
    )
