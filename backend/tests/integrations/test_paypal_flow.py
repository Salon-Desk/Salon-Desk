from decimal import Decimal

import httpx
import pytest

from app.services.paypal_rest import (
    PayPalAPIError,
    PayPalRestClient,
    _raise_for_paypal,
    is_paypal_merchant_id,
)


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("QJ7XZ8ME9GKDA", True),
        ("DEMO-0024-FIKERBEAUTYSALONANDSPA", False),
        ("qj7xz8me9gkda", False),
        ("", False),
        (None, False),
    ],
)
def test_is_paypal_merchant_id(value: str | None, expected: bool) -> None:
    assert is_paypal_merchant_id(value) is expected


def test_raise_for_paypal_surfaces_issue_and_debug_id() -> None:
    request = httpx.Request("POST", "https://api-m.sandbox.paypal.com/v2/checkout/orders")
    resp = httpx.Response(
        400,
        request=request,
        json={
            "name": "INVALID_REQUEST",
            "message": "Request is not well-formed",
            "debug_id": "abc123",
            "details": [
                {"issue": "INVALID_PARAMETER_SYNTAX", "description": "Bad merchant_id"},
            ],
        },
    )
    with pytest.raises(PayPalAPIError) as info:
        _raise_for_paypal(resp)
    assert info.value.status_code == 400
    assert info.value.debug_id == "abc123"
    assert "INVALID_PARAMETER_SYNTAX" in info.value.message


@pytest.mark.asyncio
async def test_create_authorize_order_stub() -> None:
    client = PayPalRestClient()
    result = await client.create_authorize_order(
        amount=Decimal("10"),
        return_url="http://localhost:3000/client/paypal/return?hold_id=x",
        cancel_url="http://localhost:3000/client/book",
    )
    assert result["status"] == "CREATED"
    assert result["mode"] == "stub"
    assert result["order_id"]
    assert result["approval_url"]
    assert "token=" in result["approval_url"]


@pytest.mark.asyncio
async def test_authorize_order_stub() -> None:
    client = PayPalRestClient()
    result = await client.authorize_order(order_id="STUB-abc", amount=Decimal("10"))
    assert result["status"] == "COMPLETED"
    assert result["authorization_id"]


@pytest.mark.asyncio
async def test_reauthorize_authorization_stub() -> None:
    client = PayPalRestClient()
    result = await client.reauthorize_authorization(authorization_id="auth-1")
    assert result["status"] == "CREATED"
    assert result["authorization_id"]
