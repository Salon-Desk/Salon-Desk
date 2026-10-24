"""Tests for PayPal-Request-Id header propagation and duplicate-charge protection."""

from decimal import Decimal
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from app.services.paypal_rest import PayPalRestClient


@pytest.mark.asyncio
async def test_create_authorize_order_idempotency_header() -> None:
    client = PayPalRestClient()
    client.settings.paypal_client_id = "test-client"
    client.settings.paypal_client_secret = "test-secret"

    mock_resp = httpx.Response(
        201,
        request=httpx.Request("POST", "https://api-m.sandbox.paypal.com/v2/checkout/orders"),
        json={
            "id": "ORD-12345",
            "status": "CREATED",
            "links": [{"rel": "approve", "href": "https://paypal.com/checkout?token=ORD-12345"}],
        },
    )

    with (
        patch.object(client, "_access_token", new=AsyncMock(return_value="mock-token")),
        patch("httpx.AsyncClient.post", new=AsyncMock(return_value=mock_resp)) as mock_post,
    ):
        res = await client.create_authorize_order(
            amount=Decimal("50.00"),
            return_url="http://localhost:3000/return",
            cancel_url="http://localhost:3000/cancel",
            paypal_request_id="unique-key-abc-123",
        )

        assert res["order_id"] == "ORD-12345"
        mock_post.assert_called_once()
        headers = mock_post.call_args.kwargs.get("headers", {})
        assert headers.get("PayPal-Request-Id") == "unique-key-abc-123"


@pytest.mark.asyncio
async def test_partial_capture_idempotency_and_final_capture() -> None:
    client = PayPalRestClient()
    client.settings.paypal_client_id = "test-client"
    client.settings.paypal_client_secret = "test-secret"

    mock_resp = httpx.Response(
        201,
        request=httpx.Request(
            "POST", "https://api-m.sandbox.paypal.com/v2/payments/authorizations/AUTH-1/capture"
        ),
        json={"id": "CAP-777", "status": "COMPLETED"},
    )

    with (
        patch.object(client, "_access_token", new=AsyncMock(return_value="mock-token")),
        patch("httpx.AsyncClient.post", new=AsyncMock(return_value=mock_resp)) as mock_post,
    ):
        res = await client.partial_capture(
            authorization_id="AUTH-1",
            amount=Decimal("25.00"),
            final_capture=True,
            paypal_request_id="capture-retry-key-999",
        )

        assert res["capture_id"] == "CAP-777"
        assert res["final_capture"] is True
        mock_post.assert_called_once()
        headers = mock_post.call_args.kwargs.get("headers", {})
        assert headers.get("PayPal-Request-Id") == "capture-retry-key-999"

        body = mock_post.call_args.kwargs.get("json", {})
        assert body.get("final_capture") is True
        assert body["amount"]["value"] == "25.00"
