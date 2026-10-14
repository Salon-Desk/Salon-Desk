import pytest

from app.services.paypal_rest import PayPalRestClient


@pytest.mark.asyncio
async def test_authorize_order_stub() -> None:
    client = PayPalRestClient()
    result = await client.authorize_order(amount=10)  # type: ignore[arg-type]
    assert result["status"] == "not_implemented"
