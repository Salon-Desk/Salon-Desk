"""Tests for PayPal webhook verification, event deduplication, and ledger logging."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app
from app.models.enums import PaymentHoldStatus
from app.models.payment import PaymentHold, PaypalWebhookEvent
from app.services.payment_service import ingest_webhook
from app.services.paypal_rest import PayPalRestClient


@pytest.mark.asyncio
async def test_webhook_ingest_stub_mode() -> None:
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/webhooks/paypal",
            json={
                "id": "WH-TEST-EVENT-001",
                "event_type": "PAYMENT.CAPTURE.COMPLETED",
                "resource": {"id": "CAP-12345", "amount": {"value": "45.00"}},
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        # Enveloped by standardize_response_middleware
        data = body.get("data", body)
        assert data.get("detail") == "accepted"


@pytest.mark.asyncio
async def test_webhook_missing_event_id_ignored() -> None:
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/webhooks/paypal",
            json={"resource": {}},
        )
        assert resp.status_code == 200
        body = resp.json()
        data = body.get("data", body)
        assert "ignored" in data.get("detail", "")


@pytest.mark.asyncio
async def test_webhook_signature_failure_rejected() -> None:
    app = create_app()
    transport = ASGITransport(app=app)
    with patch.object(
        PayPalRestClient, "verify_webhook_signature", new=AsyncMock(return_value=False)
    ):
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/v1/webhooks/paypal",
                json={
                    "id": "WH-FORGED-001",
                    "event_type": "PAYMENT.CAPTURE.COMPLETED",
                    "resource": {},
                },
                headers={
                    "paypal-transmission-id": "trans-1",
                    "paypal-transmission-sig": "fake-sig",
                },
            )
            assert resp.status_code == 200
            body = resp.json()
            data = body.get("data", body)
            assert "rejected" in data.get("detail", "")


@pytest.mark.asyncio
async def test_webhook_event_deduplication() -> None:
    db = AsyncMock()
    existing_event = PaypalWebhookEvent(
        id=uuid4(),
        paypal_event_id="WH-DUP-123",
        event_type="PAYMENT.CAPTURE.COMPLETED",
        resource_json={},
    )
    mock_res = AsyncMock()
    mock_res.scalar_one_or_none = lambda: existing_event
    db.execute = AsyncMock(return_value=mock_res)

    result = await ingest_webhook(
        db,
        paypal_event_id="WH-DUP-123",
        event_type="PAYMENT.CAPTURE.COMPLETED",
        resource={},
    )
    assert result is existing_event
    db.add.assert_not_called()


@pytest.mark.asyncio
async def test_webhook_void_updates_hold_and_records_ledger() -> None:
    db = AsyncMock()
    db.add = MagicMock()
    # First execute is checking existing event -> None
    # Second execute is finding hold -> returns mock hold
    mock_res_none = AsyncMock()
    mock_res_none.scalar_one_or_none = lambda: None

    mock_hold = PaymentHold(
        id=uuid4(),
        booking_id=uuid4(),
        org_id=uuid4(),
        amount=50.0,
        currency="USD",
        status=PaymentHoldStatus.AUTHORIZED,
        parent_authorization_id="AUTH-999",
    )
    mock_res_hold = AsyncMock()
    mock_res_hold.scalar_one_or_none = lambda: mock_hold

    db.execute = AsyncMock(side_effect=[mock_res_none, mock_res_hold])
    db.flush = AsyncMock()

    with patch("app.services.webhook_service.append_ledger", new=AsyncMock()) as mock_append:
        event = await ingest_webhook(
            db,
            paypal_event_id="WH-VOID-999",
            event_type="PAYMENT.AUTHORIZATION.VOIDED",
            resource={"id": "AUTH-999"},
        )
        assert event.paypal_event_id == "WH-VOID-999"
        assert mock_hold.status == PaymentHoldStatus.VOIDED
        mock_append.assert_awaited_once()
        args, kwargs = mock_append.call_args
        assert kwargs["event_type"] == "WEBHOOK_HOLD_VOIDED"
        assert kwargs["hold_id"] == mock_hold.id


@pytest.mark.asyncio
async def test_verify_webhook_signature_rest_client() -> None:
    client = PayPalRestClient()
    client.settings.paypal_client_id = "test-client"
    client.settings.paypal_client_secret = "test-secret"
    client.settings.paypal_webhook_id = "WH-ID-CONFIGURED"

    mock_resp = AsyncMock()
    mock_resp.status_code = 200
    mock_resp.json = MagicMock(return_value={"verification_status": "SUCCESS"})

    with (
        patch.object(client, "_access_token", new=AsyncMock(return_value="mock-token")),
        patch("httpx.AsyncClient.post", new=AsyncMock(return_value=mock_resp)),
    ):
        result = await client.verify_webhook_signature(
            transmission_id="tid",
            transmission_time="ttime",
            cert_url="curl",
            auth_algo="algo",
            transmission_sig="sig",
            raw_body={"id": "evt"},
        )
        assert result is True
