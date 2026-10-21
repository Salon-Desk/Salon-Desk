import asyncio
import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.booking import Booking
from app.models.enums import BookingStatus, PaymentHoldStatus
from app.models.payment import PaymentHold
from app.services import payment_service

logger = logging.getLogger(__name__)


async def run_hold_expiration_loop(*, interval_seconds: float = 300.0) -> None:
    while True:
        try:
            processed = await tick()
            if processed:
                logger.info("Processed %d expiring/expired payment hold(s)", processed)
        except Exception:
            logger.exception("Hold expiration tick failed")
        await asyncio.sleep(interval_seconds)


async def tick() -> int:
    now = datetime.now(UTC)
    # Target holds expiring soon (within next 2 hours) or already past expiration
    expiry_threshold = now + timedelta(hours=2)
    processed = 0

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(PaymentHold)
            .where(
                PaymentHold.status.in_(
                    [PaymentHoldStatus.AUTHORIZED, PaymentHoldStatus.REAUTHORIZED]
                ),
                PaymentHold.honor_expires_at.is_not(None),
                PaymentHold.honor_expires_at <= expiry_threshold,
            )
            .limit(50)
        )
        holds = list(result.scalars().all())

        for hold in holds:
            booking = await db.get(Booking, hold.booking_id)
            if booking is None:
                continue

            # Case A: Booking is cancelled but hold was not yet voided
            if booking.status == BookingStatus.CANCELLED:
                try:
                    await payment_service.void_hold(db, booking=booking)
                    processed += 1
                except Exception as exc:
                    logger.warning(
                        "Failed to void hold for cancelled booking %s: %s", booking.id, exc
                    )

            # Case B: Booking is confirmed for a future date and eligible for one-time reauthorization (Day 4+)
            elif (
                booking.status == BookingStatus.CONFIRMED
                and booking.starts_at > now
                and hold.reauthorization_count < 1
            ):
                try:
                    await payment_service.reauthorize_hold(db, booking=booking)
                    processed += 1
                    logger.info("Extended honor period (reauthorized) for booking %s", booking.id)
                except Exception as exc:
                    logger.warning("Failed to reauthorize hold for booking %s: %s", booking.id, exc)

        if processed:
            await db.commit()
        else:
            await db.rollback()

    return processed
