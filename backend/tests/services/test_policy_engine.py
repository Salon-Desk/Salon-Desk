from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import uuid4

import pytest

from app.core.exceptions import ForbiddenError, PolicyViolationException
from app.models.enums import BookingStatus, PaymentHoldStatus, UserRole
from app.services.policy_engine import (
    DEFAULT_RESCHEDULE_CUTOFF_HOURS,
    agreed_late_cancel_fee,
    agreed_no_show_fee,
    assert_can_reauthorize_hold,
    assert_can_reschedule,
    assert_can_settle,
    assert_capture_within_ceiling,
    assert_deposit_within_ceiling,
    assert_valid_booking_transition,
    assert_valid_hold_transition,
    can_reschedule,
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


def test_assert_capture_within_ceiling() -> None:
    # Valid capture: hold $100, already captured $40, capturing $50 (remaining $60)
    assert_capture_within_ceiling(Decimal("100.00"), Decimal("40.00"), Decimal("50.00"))

    # Valid exact remaining capture: capturing $60
    assert_capture_within_ceiling(Decimal("100.00"), Decimal("40.00"), Decimal("60.00"))

    # Invalid: capture amount zero or negative
    with pytest.raises(PolicyViolationException, match="greater than zero"):
        assert_capture_within_ceiling(Decimal("100.00"), Decimal("0.00"), Decimal("0.00"))
    with pytest.raises(PolicyViolationException, match="greater than zero"):
        assert_capture_within_ceiling(Decimal("100.00"), Decimal("0.00"), Decimal("-10.00"))

    # Invalid: capture exceeds remaining ceiling ($40 + $65 = $105 > $100)
    with pytest.raises(PolicyViolationException, match="exceed authorized ceiling"):
        assert_capture_within_ceiling(Decimal("100.00"), Decimal("40.00"), Decimal("65.00"))


def test_can_reschedule_cutoff() -> None:
    now = datetime(2026, 6, 1, 10, 0, tzinfo=UTC)

    # 5 hours before start: client can reschedule (cutoff is 4)
    starts_5h = now + timedelta(hours=5)
    assert can_reschedule(starts_at=starts_5h, now=now, cutoff_hours=4.0) is True

    # 3 hours before start: client cannot reschedule
    starts_3h = now + timedelta(hours=3)
    assert can_reschedule(starts_at=starts_3h, now=now, cutoff_hours=4.0) is False

    # Negative hours (past start): cannot reschedule
    starts_past = now - timedelta(hours=1)
    assert can_reschedule(starts_at=starts_past, now=now, cutoff_hours=4.0) is False

    # Org staff can reschedule anytime
    assert can_reschedule(starts_at=starts_3h, now=now, cutoff_hours=4.0, is_org=True) is True

    # Default cutoff is 4.0
    assert DEFAULT_RESCHEDULE_CUTOFF_HOURS == 4.0


def test_assert_can_reschedule_client_and_staff() -> None:
    now = datetime(2026, 6, 1, 10, 0, tzinfo=UTC)

    # 1. Client rescheduling 6 hours before start -> OK
    starts_at_ok = datetime(2026, 6, 1, 16, 0, tzinfo=UTC)
    assert_can_reschedule(starts_at=starts_at_ok, is_org=False, now=now)

    # 2. Client rescheduling 2 hours before start -> Raises PolicyViolationException
    starts_at_late = datetime(2026, 6, 1, 12, 0, tzinfo=UTC)
    with pytest.raises(PolicyViolationException, match="within 4 hours of appointment"):
        assert_can_reschedule(starts_at=starts_at_late, is_org=False, now=now)

    # 3. Org staff rescheduling 2 hours before start -> Bypasses cutoff successfully
    assert_can_reschedule(starts_at=starts_at_late, is_org=True, now=now)

    # 4. Custom cutoff (e.g., 2 hours) -> Client 3 hours before start is OK
    assert_can_reschedule(
        starts_at=datetime(2026, 6, 1, 13, 0, tzinfo=UTC),
        is_org=False,
        policy_data={"reschedule_cutoff_hours": 2.0},
        now=now,
    )


def test_reauthorize_hold_day_1_blocked() -> None:
    now = datetime(2026, 6, 2, 10, 0, tzinfo=UTC)
    # Hold authorized 1 day ago (Day 1)
    hold = type("MockHold", (), {"authorized_at": now - timedelta(days=1)})()
    with pytest.raises(PolicyViolationException) as exc_info:
        assert_can_reauthorize_hold(hold, now=now)
    assert exc_info.value.code == "REAUTHORIZATION_TOO_SOON"
    assert "initial 3-day honor period" in exc_info.value.message
    assert getattr(exc_info.value, "status_code", None) == 422


def test_reauthorize_hold_day_2_blocked() -> None:
    now = datetime(2026, 6, 3, 10, 0, tzinfo=UTC)
    # Hold authorized 2 days ago (Day 2)
    hold = type("MockHold", (), {"authorized_at": now - timedelta(days=2)})()
    with pytest.raises(PolicyViolationException) as exc_info:
        assert_can_reauthorize_hold(hold, now=now)
    assert exc_info.value.code == "REAUTHORIZATION_TOO_SOON"
    assert "initial 3-day honor period" in exc_info.value.message
    assert getattr(exc_info.value, "status_code", None) == 422


def test_reauthorize_hold_day_4_allowed() -> None:
    now = datetime(2026, 6, 5, 10, 0, tzinfo=UTC)
    # Hold authorized 4 days ago (Day 4)
    hold = type("MockHold", (), {"authorized_at": now - timedelta(days=4)})()
    # Should not raise any exception
    assert_can_reauthorize_hold(hold, now=now)


def test_reauthorize_hold_day_29_blocked() -> None:
    now = datetime(2026, 6, 30, 10, 0, tzinfo=UTC)
    # Hold authorized 29 days ago (Day 29 - absolute ceiling)
    hold = type("MockHold", (), {"authorized_at": now - timedelta(days=29)})()
    with pytest.raises(PolicyViolationException) as exc_info:
        assert_can_reauthorize_hold(hold, now=now)
    assert exc_info.value.code == "HOLD_EXPIRED"
    assert "maximum 29-day lifetime" in exc_info.value.message
    assert getattr(exc_info.value, "status_code", None) == 422


def test_reauthorize_hold_day_30_blocked() -> None:
    now = datetime(2026, 7, 1, 10, 0, tzinfo=UTC)
    # Hold authorized 30 days ago
    hold = type("MockHold", (), {"authorized_at": now - timedelta(days=30)})()
    with pytest.raises(PolicyViolationException) as exc_info:
        assert_can_reauthorize_hold(hold, now=now)
    assert exc_info.value.code == "HOLD_EXPIRED"
    assert getattr(exc_info.value, "status_code", None) == 422
