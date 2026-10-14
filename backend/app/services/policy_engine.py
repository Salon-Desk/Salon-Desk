"""Deterministic booking/deposit/cancel policy state machine."""

from decimal import Decimal

from app.core.exceptions import PolicyViolationException

# Hard caps for deposits (fraction of service price)
MAX_DEPOSIT_FRACTION = Decimal("0.50")


def assert_deposit_within_ceiling(service_price: Decimal, deposit_amount: Decimal) -> None:
    if deposit_amount < 0:
        raise PolicyViolationException("Deposit cannot be negative")
    ceiling = service_price * MAX_DEPOSIT_FRACTION
    if deposit_amount > ceiling:
        raise PolicyViolationException(f"Deposit {deposit_amount} exceeds ceiling {ceiling}")


def can_self_cancel(*, hours_until_start: float, free_cancel_hours: float) -> bool:
    return hours_until_start >= free_cancel_hours
