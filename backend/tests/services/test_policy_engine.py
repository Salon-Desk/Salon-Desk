from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest

from app.core.exceptions import PolicyViolationException
from app.services.policy_engine import (
    agreed_late_cancel_fee,
    agreed_no_show_fee,
    assert_deposit_within_ceiling,
    can_self_cancel,
    free_cancel_deadline_at,
    is_within_free_cancel_window,
)


def test_deposit_within_ceiling_ok() -> None:
    assert_deposit_within_ceiling(Decimal("100"), Decimal("40"))


def test_deposit_exceeds_ceiling() -> None:
    with pytest.raises(PolicyViolationException):
        assert_deposit_within_ceiling(Decimal("100"), Decimal("60"))


def test_self_cancel_within_window() -> None:
    assert can_self_cancel(hours_until_start=48, free_cancel_hours=24) is True


def test_self_cancel_too_late() -> None:
    assert can_self_cancel(hours_until_start=2, free_cancel_hours=24) is False


def test_free_cancel_deadline_at() -> None:
    starts = datetime(2026, 6, 1, 15, 0, tzinfo=UTC)
    deadline = free_cancel_deadline_at(starts_at=starts, policy_data={"free_cancel_hours": 24})
    assert deadline == starts - timedelta(hours=24)


def test_agreed_no_show_fee_percent() -> None:
    fee = agreed_no_show_fee(
        total_price=Decimal("100.00"),
        policy_data={"no_show_fee_percent": 50},
    )
    assert fee == Decimal("50.00")


def test_agreed_late_cancel_fee_uses_late_percent() -> None:
    fee = agreed_late_cancel_fee(
        total_price=Decimal("1000.00"),
        policy_data={"late_cancel_fee_percent": 25, "no_show_fee_percent": 50},
    )
    assert fee == Decimal("250.00")


def test_agreed_late_cancel_fee_falls_back_to_no_show_percent() -> None:
    fee = agreed_late_cancel_fee(
        total_price=Decimal("100.00"),
        policy_data={"no_show_fee_percent": 50},
    )
    assert fee == Decimal("50.00")


def test_agreed_no_show_fee_flat_amount() -> None:
    fee = agreed_no_show_fee(
        total_price=Decimal("100.00"),
        policy_data={"no_show_fee_amount": "25.00"},
    )
    assert fee == Decimal("25.00")


def test_is_within_free_cancel_window() -> None:
    deadline = datetime.now(UTC) + timedelta(hours=1)
    assert is_within_free_cancel_window(free_cancel_deadline_at=deadline) is True
    past = datetime.now(UTC) - timedelta(hours=1)
    assert is_within_free_cancel_window(free_cancel_deadline_at=past) is False
