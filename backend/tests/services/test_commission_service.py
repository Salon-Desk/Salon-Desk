from decimal import Decimal

from app.services.commission_service import commission_amount


def test_commission_amount_percentage() -> None:
    fee = commission_amount({"percentage": "10", "flat": None}, Decimal("100.00"))
    assert fee == Decimal("10.00")


def test_commission_amount_hybrid() -> None:
    fee = commission_amount({"percentage": "10", "flat": "2.50"}, Decimal("100.00"))
    assert fee == Decimal("12.50")
