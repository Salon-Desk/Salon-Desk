"""Transactional Outbox worker for PayPal webhooks.

Processes queued/unprocessed PayPalWebhookEvent records idempotently to ensure zero
duplicate captures or dropped status updates under network retry.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.payment import PaypalWebhookEvent
from app.services.webhook_service import ingest_webhook

logger = logging.getLogger(__name__)


async def tick(batch_size: int = 50) -> int:
    """Process a batch of un-processed webhook events from the outbox."""
    processed = 0
    async with AsyncSessionLocal() as db:
        stmt = (
            select(PaypalWebhookEvent)
            .where(PaypalWebhookEvent.processed_at.is_(None))
            .order_by(PaypalWebhookEvent.created_at.asc())
            .limit(batch_size)
        )
        res = await db.execute(stmt)
        events = list(res.scalars().all())

        for event in events:
            try:
                # Re-ingest with idempotency guards
                await ingest_webhook(
                    db,
                    paypal_event_id=event.paypal_event_id,
                    event_type=event.event_type,
                    resource=event.resource_json,
                    verification_status=event.verification_status,
                )
                event.processed_at = datetime.now(UTC)
                await db.commit()
                processed += 1
            except Exception as exc:
                await db.rollback()
                logger.warning(
                    "Failed to process outbox webhook event %s: %s",
                    event.paypal_event_id,
                    exc,
                )

    return processed


async def run_webhook_outbox_loop(*, interval_seconds: float = 30.0) -> None:
    """Continuous polling loop for outbox webhook processing."""
    while True:
        try:
            count = await tick()
            if count:
                logger.info("Outbox worker processed %d webhook event(s)", count)
        except Exception:
            logger.exception("Outbox worker tick failed")
        await asyncio.sleep(interval_seconds)
