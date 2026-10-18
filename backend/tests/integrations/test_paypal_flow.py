from decimal import Decimal

import pytest

from app.services.paypal_rest import PayPalRestClient


@pytest.mark.asyncio
async def test_authorize_order_stub() -> None:
    client = PayPalRestClient()
    result = await client.authorize_order(amount=Decimal("10"))
    assert result["status"] == "not_implemented"


@pytest.mark.asyncio
async def test_reauthorize_authorization_stub() -> None:
    client = PayPalRestClient()
    result = await client.reauthorize_authorization(authorization_id="auth-1")
    assert result["status"] == "not_implemented"
