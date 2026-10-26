from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import uuid4

import pytest

from app.core.exceptions import ForbiddenError, PolicyViolationException
from app.models.enums import BookingStatus, PaymentHoldStatus, UserRole
from app.services.policy_engine import (
    agreed_late_cancel_fee,
    agreed_no_show_fee,
    assert_can_settle,
    assert_deposit_within_ceiling,
    assert_valid_booking_transition,
    assert_valid_hold_transition,
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


def test_booking_transitions() -> None:
    # Valid transitions
    assert_valid_booking_transition(BookingStatus.PENDING_PAYMENT, BookingStatus.CONFIRMED)
    assert_valid_booking_transition(BookingStatus.PENDING_PAYMENT, BookingStatus.CANCELLED)
    assert_valid_booking_transition(BookingStatus.PENDING, BookingStatus.CONFIRMED)
    assert_valid_booking_transition(BookingStatus.PENDING, BookingStatus.CANCELLED)
    assert_valid_booking_transition(BookingStatus.CONFIRMED, BookingStatus.COMPLETED)
    assert_valid_booking_transition(BookingStatus.CONFIRMED, BookingStatus.CANCELLED)
    assert_valid_booking_transition(BookingStatus.CONFIRMED, BookingStatus.NO_SHOW)

    # Invalid transitions
    with pytest.raises(PolicyViolationException):
        assert_valid_booking_transition(BookingStatus.COMPLETED, BookingStatus.CANCELLED)
    with pytest.raises(PolicyViolationException):
        assert_valid_booking_transition(BookingStatus.CANCELLED, BookingStatus.CONFIRMED)
    with pytest.raises(PolicyViolationException):
        assert_valid_booking_transition(BookingStatus.PENDING, BookingStatus.COMPLETED)
    with pytest.raises(PolicyViolationException):
        assert_valid_booking_transition(BookingStatus.PENDING_PAYMENT, BookingStatus.COMPLETED)


def test_hold_transitions() -> None:
    # Valid transitions
    assert_valid_hold_transition(PaymentHoldStatus.PENDING, PaymentHoldStatus.AUTHORIZED)
    assert_valid_hold_transition(PaymentHoldStatus.AUTHORIZED, PaymentHoldStatus.CAPTURED)
    assert_valid_hold_transition(PaymentHoldStatus.AUTHORIZED, PaymentHoldStatus.REAUTHORIZED)
    assert_valid_hold_transition(PaymentHoldStatus.AUTHORIZED, PaymentHoldStatus.VOIDED)
    assert_valid_hold_transition(PaymentHoldStatus.AUTHORIZED, PaymentHoldStatus.EXPIRED)

    # Invalid transitions
    with pytest.raises(PolicyViolationException):
        assert_valid_hold_transition(PaymentHoldStatus.CAPTURED, PaymentHoldStatus.VOIDED)
    with pytest.raises(PolicyViolationException):
        assert_valid_hold_transition(PaymentHoldStatus.VOIDED, PaymentHoldStatus.AUTHORIZED)


def test_can_settle_permissions() -> None:
    org_id = uuid4()
    other_org_id = uuid4()

    # Admin can settle across any org
    assert_can_settle(UserRole.PLATFORM_ADMIN, None, org_id)
    assert_can_settle(UserRole.PLATFORM_STAFF, org_id, other_org_id)

    # Org owner/reception can settle for their org
    assert_can_settle(UserRole.ORG_OWNER, org_id, org_id)
    assert_can_settle(UserRole.RECEPTION, org_id, org_id)

    # Org owner/reception cannot settle for another org
    with pytest.raises(ForbiddenError):
        assert_can_settle(UserRole.ORG_OWNER, org_id, other_org_id)

    # Stylist or client cannot settle
    with pytest.raises(ForbiddenError):
        assert_can_settle(UserRole.STYLIST, org_id, org_id)
    with pytest.raises(ForbiddenError):
        assert_can_settle(UserRole.CLIENT, org_id, org_id)
