"""Tests for PayPal webhook transactional outbox processor."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models.payment import PaypalWebhookEvent
from app.tasks.webhook_outbox import tick


@pytest.mark.asyncio
async def test_webhook_outbox_tick_processes_pending_events() -> None:
    event = PaypalWebhookEvent(
        paypal_event_id="WH-OUTBOX-001",
        event_type="PAYMENT.AUTHORIZATION.VOIDED",
        resource_json={"id": "AUTH-TEST-123"},
        verification_status="VERIFIED",
        processed_at=None,
    )

    db = AsyncMock()
    db.commit = AsyncMock()
    db.rollback = AsyncMock()

    mock_scalars = MagicMock()
    mock_scalars.all = MagicMock(return_value=[event])
    mock_res = MagicMock()
    mock_res.scalars = MagicMock(return_value=mock_scalars)
    db.execute = AsyncMock(return_value=mock_res)

    session_ctx = MagicMock()
    session_ctx.__aenter__ = AsyncMock(return_value=db)
    session_ctx.__aexit__ = AsyncMock(return_value=None)

    with (
        patch("app.tasks.webhook_outbox.AsyncSessionLocal", return_value=session_ctx),
        patch("app.tasks.webhook_outbox.ingest_webhook", new_callable=AsyncMock) as mock_ingest,
    ):
        processed = await tick(batch_size=10)

        assert processed == 1
        assert event.processed_at is not None
        mock_ingest.assert_awaited_once_with(
            db,
            paypal_event_id="WH-OUTBOX-001",
            event_type="PAYMENT.AUTHORIZATION.VOIDED",
            resource={"id": "AUTH-TEST-123"},
            verification_status="VERIFIED",
        )
        db.commit.assert_awaited_once()
