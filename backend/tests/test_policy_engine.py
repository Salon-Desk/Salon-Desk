from decimal import Decimal

import pytest

from app.core.exceptions import PolicyViolationException
from app.services.policy_engine import (
    assert_deposit_within_ceiling,
    can_self_cancel,
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
