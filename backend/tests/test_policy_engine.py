"""Tests for PayPal authorization hold policy constraints and lifecycle rules."""

from datetime import UTC, datetime, timedelta

import pytest

from app.core.exceptions import PolicyViolationException
from app.services.policy_engine import assert_can_reauthorize_hold


def test_reauthorization_day_1_triggers_reauthorization_too_soon() -> None:
    now = datetime(2026, 6, 2, 10, 0, tzinfo=UTC)
    hold = type("MockHold", (), {"authorized_at": now - timedelta(days=1)})()
    with pytest.raises(PolicyViolationException) as exc_info:
        assert_can_reauthorize_hold(hold, now=now)
    assert exc_info.value.code == "REAUTHORIZATION_TOO_SOON"
    assert getattr(exc_info.value, "status_code", None) == 422


def test_reauthorization_day_2_triggers_reauthorization_too_soon() -> None:
    now = datetime(2026, 6, 3, 10, 0, tzinfo=UTC)
    hold = type("MockHold", (), {"authorized_at": now - timedelta(days=2)})()
    with pytest.raises(PolicyViolationException) as exc_info:
        assert_can_reauthorize_hold(hold, now=now)
    assert exc_info.value.code == "REAUTHORIZATION_TOO_SOON"
    assert getattr(exc_info.value, "status_code", None) == 422


def test_reauthorization_day_4_passes_cleanly() -> None:
    now = datetime(2026, 6, 5, 10, 0, tzinfo=UTC)
    hold = type("MockHold", (), {"authorized_at": now - timedelta(days=4)})()
    assert_can_reauthorize_hold(hold, now=now)


def test_reauthorization_day_29_triggers_hold_expired() -> None:
    now = datetime(2026, 6, 30, 10, 0, tzinfo=UTC)
    hold = type("MockHold", (), {"authorized_at": now - timedelta(days=29)})()
    with pytest.raises(PolicyViolationException) as exc_info:
        assert_can_reauthorize_hold(hold, now=now)
    assert exc_info.value.code == "HOLD_EXPIRED"
    assert getattr(exc_info.value, "status_code", None) == 422
