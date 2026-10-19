"""Deterministic booking/deposit/cancel policy state machine."""

from datetime import UTC, datetime, timedelta
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


def free_cancel_deadline_at(*, starts_at: datetime, policy_data: dict) -> datetime:
    """Compute immutable free-cancel deadline from policy window at booking time."""
    free_hours = float(policy_data.get("free_cancel_hours", 24))
    starts = starts_at if starts_at.tzinfo is not None else starts_at.replace(tzinfo=UTC)
    return starts - timedelta(hours=free_hours)


def agreed_no_show_fee(*, total_price: Decimal, policy_data: dict) -> Decimal:
    """Compute immutable no-show fee from policy at booking time."""
    if "no_show_fee_amount" in policy_data and policy_data["no_show_fee_amount"] is not None:
        return Decimal(str(policy_data["no_show_fee_amount"])).quantize(Decimal("0.01"))
    pct = Decimal(str(policy_data.get("no_show_fee_percent", 50)))
    return (total_price * pct / Decimal("100")).quantize(Decimal("0.01"))


def agreed_late_cancel_fee(*, total_price: Decimal, policy_data: dict) -> Decimal:
    """Compute immutable late-cancellation fee (within policy window, after free cutoff)."""
    if (
        "late_cancel_fee_amount" in policy_data
        and policy_data["late_cancel_fee_amount"] is not None
    ):
        return Decimal(str(policy_data["late_cancel_fee_amount"])).quantize(Decimal("0.01"))
    late_pct = policy_data.get("late_cancel_fee_percent")
    if late_pct is None:
        late_pct = policy_data.get("no_show_fee_percent", 50)
    return (total_price * Decimal(str(late_pct)) / Decimal("100")).quantize(Decimal("0.01"))


def is_within_free_cancel_window(
    *, free_cancel_deadline_at: datetime, now: datetime | None = None
) -> bool:
    """Evaluate cancellation against the booking-locked free-cancel deadline."""
    current = now or datetime.now(UTC)
    deadline = free_cancel_deadline_at
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=UTC)
    if current.tzinfo is None:
        current = current.replace(tzinfo=UTC)
    return current <= deadline
