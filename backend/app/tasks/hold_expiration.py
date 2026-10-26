import asyncio
import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.booking import Booking
from app.models.enums import BookingStatus, PaymentHoldStatus
from app.models.payment import PaymentHold
from app.services import payment_service
from app.services.ledger_service import append_ledger

logger = logging.getLogger(__name__)

PAYPAL_MAX_AUTH_LIFETIME_DAYS = 29


async def run_hold_expiration_loop(*, interval_seconds: float = 300.0) -> None:
    while True:
        try:
            processed = await tick()
            if processed:
                logger.info("Processed %d expiring/expired payment hold(s)", processed)
            expired_pending = await expire_abandoned_pending_bookings()
            if expired_pending:
                logger.info("Auto-cancelled %d abandoned pending booking(s)", expired_pending)
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

            created_at = hold.created_at
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=UTC)

            # Case A: Booking was cancelled but hold was not yet voided
            if booking.status == BookingStatus.CANCELLED:
                try:
                    await payment_service.void_hold(db, booking=booking)
                    processed += 1
                except Exception as exc:
                    logger.warning(
                        "Failed to void hold for cancelled booking %s: %s", booking.id, exc
                    )

            # Case B: Hard Day-29 PayPal Authorization Expiry
            elif now >= created_at + timedelta(days=PAYPAL_MAX_AUTH_LIFETIME_DAYS):
                try:
                    hold.status = PaymentHoldStatus.EXPIRED
                    await append_ledger(
                        db,
                        event_type="PAYMENT_HOLD_EXPIRED",
                        payload={
                            "hold_id": str(hold.id),
                            "booking_id": str(booking.id),
                            "reason": "Reached 29-day PayPal authorization lifetime cap",
                        },
                        org_id=hold.org_id,
                        booking_id=hold.booking_id,
                        hold_id=hold.id,
                        amount=hold.amount,
                        currency=hold.currency,
                    )
                    processed += 1
                    logger.warning(
                        "Payment hold %s for booking %s expired (29-day lifetime reached)",
                        hold.id,
                        booking.id,
                    )
                except Exception as exc:
                    logger.warning("Failed to mark hold %s expired: %s", hold.id, exc)

            # Case C: Confirmed booking for future date eligible for reauthorization (Day 4+)
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

            # Case D: Honor period elapsed and reauthorization limit reached
            elif hold.reauthorization_count >= 1 and now > hold.honor_expires_at:
                logger.info(
                    "Hold %s honor period elapsed with max reauthorizations for booking %s (starts_at=%s)",
                    hold.id,
                    booking.id,
                    booking.starts_at,
                )

        if processed:
            await db.commit()
        else:
            await db.rollback()

    return processed


async def expire_abandoned_pending_bookings(*, max_age_minutes: int = 30) -> int:
    """Auto-cancel pending bookings where buyer never completed payment hold."""
    now = datetime.now(UTC)
    threshold = now - timedelta(minutes=max_age_minutes)
    processed = 0

    async with AsyncSessionLocal() as db:
        stale_pending = await db.execute(
            select(Booking)
            .where(
                Booking.status.in_([BookingStatus.PENDING, BookingStatus.PENDING_PAYMENT]),
                Booking.created_at <= threshold,
            )
            .limit(50)
        )
        for abandoned in stale_pending.scalars().all():
            abandoned.status = BookingStatus.CANCELLED
            abandoned.cancellation_reason = "Payment session expired or abandoned"
            processed += 1

        if processed:
            await db.commit()
        else:
            await db.rollback()

    return processed
