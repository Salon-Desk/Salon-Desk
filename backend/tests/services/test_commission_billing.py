from decimal import Decimal
from uuid import uuid4

import pytest

from app.services.commission_billing_service import _commission_from_snapshot


def test_commission_from_percentage_snapshot() -> None:
    fee = _commission_from_snapshot(
        Decimal("100.00"),
        {"type": "percentage", "percentage": "5", "flat": None},
    )
    assert fee == Decimal("5.00")


def test_commission_from_hybrid_snapshot() -> None:
    fee = _commission_from_snapshot(
        Decimal("100.00"),
        {"type": "hybrid", "percentage": "5", "flat": "2.00"},
    )
    assert fee == Decimal("7.00")


def test_commission_from_legacy_amount_only() -> None:
    fee = _commission_from_snapshot(
        Decimal("100.00"),
        {"type": "percentage", "amount": "4.50"},
    )
    assert fee == Decimal("4.50")


@pytest.mark.asyncio
async def test_paypal_reauthorize_stub() -> None:
    from app.services.paypal_rest import PayPalRestClient

    client = PayPalRestClient()
    auth_id = str(uuid4())
    result = await client.reauthorize_authorization(authorization_id=auth_id)
    assert result["status"] == "CREATED"
    assert result["authorization_id"] == f"stub-reauth-{auth_id}"
