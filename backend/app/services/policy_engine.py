"""Deterministic booking/deposit/cancel policy state machine."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any
from uuid import UUID

from app.core.exceptions import ForbiddenError, PolicyViolationException
from app.models.enums import BookingStatus, PaymentHoldStatus, UserRole
from app.models.payment import AuthorizationHold, PaymentHold

VALID_BOOKING_TRANSITIONS: dict[BookingStatus, set[BookingStatus]] = {
    BookingStatus.PENDING_PAYMENT: {BookingStatus.CONFIRMED, BookingStatus.CANCELLED},
    BookingStatus.PENDING: {BookingStatus.CONFIRMED, BookingStatus.CANCELLED},
    BookingStatus.CONFIRMED: {
        BookingStatus.COMPLETED,
        BookingStatus.CANCELLED,
        BookingStatus.NO_SHOW,
    },
    BookingStatus.COMPLETED: set(),
    BookingStatus.CANCELLED: set(),
    BookingStatus.NO_SHOW: set(),
}

VALID_HOLD_TRANSITIONS: dict[PaymentHoldStatus, set[PaymentHoldStatus]] = {
    PaymentHoldStatus.PENDING: {
        PaymentHoldStatus.AUTHORIZED,
        PaymentHoldStatus.VOIDED,
        PaymentHoldStatus.EXPIRED,
    },
    PaymentHoldStatus.AUTHORIZED: {
        PaymentHoldStatus.REAUTHORIZED,
        PaymentHoldStatus.CAPTURED,
        PaymentHoldStatus.PARTIALLY_CAPTURED,
        PaymentHoldStatus.VOIDED,
        PaymentHoldStatus.EXPIRED,
    },
    PaymentHoldStatus.REAUTHORIZED: {
        PaymentHoldStatus.REAUTHORIZED,
        PaymentHoldStatus.CAPTURED,
        PaymentHoldStatus.PARTIALLY_CAPTURED,
        PaymentHoldStatus.VOIDED,
        PaymentHoldStatus.EXPIRED,
    },
    PaymentHoldStatus.PARTIALLY_CAPTURED: {
        PaymentHoldStatus.CAPTURED,
        PaymentHoldStatus.VOIDED,
    },
    PaymentHoldStatus.CAPTURED: set(),
    PaymentHoldStatus.VOIDED: set(),
    PaymentHoldStatus.EXPIRED: set(),
}


def assert_valid_booking_transition(
    current: BookingStatus | str, target: BookingStatus | str
) -> None:
    curr = BookingStatus(current) if isinstance(current, str) else current
    tgt = BookingStatus(target) if isinstance(target, str) else target
    allowed = VALID_BOOKING_TRANSITIONS.get(curr, set())
    if tgt not in allowed:
        raise PolicyViolationException(
            f"Invalid booking transition from {curr.value} to {tgt.value}"
        )


def assert_valid_hold_transition(
    current: PaymentHoldStatus | str, target: PaymentHoldStatus | str
) -> None:
    curr = PaymentHoldStatus(current) if isinstance(current, str) else current
    tgt = PaymentHoldStatus(target) if isinstance(target, str) else target
    allowed = VALID_HOLD_TRANSITIONS.get(curr, set())
    if tgt not in allowed:
        raise PolicyViolationException(f"Invalid hold transition from {curr.value} to {tgt.value}")


def assert_can_reauthorize_hold(
    hold: AuthorizationHold | PaymentHold | Any,
    now: datetime | None = None,
) -> None:
    """Enforce PayPal authorization hold lifecycle constraints.

    - Days 0-3 (72-hour honor window): Reauthorization is blocked (REAUTHORIZATION_TOO_SOON).
    - Days 4-29: Reauthorization is permitted.
    - Day 29+: Hold has reached its maximum lifetime and cannot be reauthorized (HOLD_EXPIRED).
    """
    current = now or datetime.now(UTC)
    if current.tzinfo is None:
        current = current.replace(tzinfo=UTC)

    auth_at = getattr(hold, "authorized_at", None)
    if not isinstance(auth_at, datetime):
        auth_at = getattr(hold, "created_at", None)
    if not isinstance(auth_at, datetime):
        auth_at = current
    if auth_at.tzinfo is None:
        auth_at = auth_at.replace(tzinfo=UTC)

    hold_age = current - auth_at
    days_since_auth = hold_age.total_seconds() / 86400.0

    # Block reauthorization during Days 0–3 honor period
    if days_since_auth < 3.0:
        raise PolicyViolationException(
            code="REAUTHORIZATION_TOO_SOON",
            message=(
                f"Hold is in its initial 3-day honor period ({days_since_auth:.1f} days old). "
                "Reauthorization is only permitted between Day 4 and Day 29."
            ),
            status_code=422,
        )

    # Block reauthorization on or after Day 29
    if days_since_auth >= 29.0:
        raise PolicyViolationException(
            code="HOLD_EXPIRED",
            message="Hold has reached the maximum 29-day lifetime and cannot be reauthorized.",
            status_code=422,
        )


def assert_can_settle(
    user_role: UserRole | str,
    org_id: UUID | None,
    target_org_id: UUID,
) -> None:
    role = UserRole(user_role) if isinstance(user_role, str) else user_role
    if role in {UserRole.PLATFORM_ADMIN, UserRole.PLATFORM_STAFF}:
        return
    if role not in {UserRole.ORG_OWNER, UserRole.RECEPTION}:
        raise ForbiddenError("Insufficient permissions to settle booking")
    if org_id != target_org_id:
        raise ForbiddenError("Booking belongs to another organization")


# Hard caps for deposits (fraction of service price)
MAX_DEPOSIT_FRACTION = Decimal("0.50")


def assert_deposit_within_ceiling(service_price: Decimal, deposit_amount: Decimal) -> None:
    if deposit_amount < 0:
        raise PolicyViolationException("Deposit cannot be negative")
    ceiling = service_price * MAX_DEPOSIT_FRACTION
    if deposit_amount > ceiling:
        raise PolicyViolationException(f"Deposit {deposit_amount} exceeds ceiling {ceiling}")


def assert_capture_within_ceiling(
    hold_amount: Decimal, already_captured: Decimal, capture_amount: Decimal
) -> None:
    """Ensure capture amount is positive and does not exceed remaining authorized ceiling."""
    if capture_amount <= Decimal("0"):
        raise PolicyViolationException("Capture amount must be greater than zero")
    remaining = hold_amount - already_captured
    if capture_amount > remaining:
        raise PolicyViolationException(
            f"Capture {capture_amount} would exceed authorized ceiling "
            f"(remaining {remaining} of {hold_amount})"
        )


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


DEFAULT_RESCHEDULE_CUTOFF_HOURS = 4.0


def can_reschedule(
    *,
    starts_at: datetime,
    now: datetime | None = None,
    cutoff_hours: float = DEFAULT_RESCHEDULE_CUTOFF_HOURS,
    is_org: bool = False,
) -> bool:
    """Evaluate whether client self-service rescheduling is permitted based on the cutoff window.

    Salon staff (is_org=True) can bypass cutoff limits.
    Clients are restricted if the appointment is fewer than cutoff_hours away.
    """
    if is_org:
        return True
    current = now or datetime.now(UTC)
    s_at = starts_at if starts_at.tzinfo is not None else starts_at.replace(tzinfo=UTC)
    if current.tzinfo is None:
        current = current.replace(tzinfo=UTC)
    hours_until_start = (s_at - current).total_seconds() / 3600.0
    return hours_until_start >= cutoff_hours


def assert_can_reschedule(
    *,
    starts_at: datetime,
    now: datetime | None = None,
    policy_data: dict | None = None,
    is_org: bool = False,
) -> None:
    """Raise PolicyViolationException if client attempts to reschedule within the cutoff window."""
    if is_org:
        return
    policy = policy_data or {}
    cutoff_hours = float(policy.get("reschedule_cutoff_hours", DEFAULT_RESCHEDULE_CUTOFF_HOURS))
    if not can_reschedule(starts_at=starts_at, now=now, cutoff_hours=cutoff_hours, is_org=is_org):
        display_cutoff = int(cutoff_hours) if cutoff_hours.is_integer() else cutoff_hours
        raise PolicyViolationException(
            f"Rescheduling is not permitted within {display_cutoff} hours of appointment start time."
        )


SLOT_RESCUE_ELIGIBLE_STATUSES = frozenset({BookingStatus.NO_SHOW, BookingStatus.CANCELLED})


def evaluate_slot_rescue(
    original_booking_status: BookingStatus,
    hold_status: PaymentHoldStatus | None,
    agreed_no_show_fee: Decimal,
    captured_amount: Decimal,
) -> dict[str, Any]:
    """Deterministic referee deciding whether to void the hold or refund the captured fee.

    Only vacated chairs (no-show or cancellation) qualify. ``captured_amount`` must be the
    fee still held by the salon, excluding captures that were already refunded.
    """
    if original_booking_status not in SLOT_RESCUE_ELIGIBLE_STATUSES:
        return {
            "action": "NOOP",
            "waived_amount": Decimal("0.00"),
            "refund_amount": Decimal("0.00"),
        }

    if captured_amount > Decimal("0.00"):
        return {
            "action": "REFUND_CAPTURE",
            "waived_amount": captured_amount,
            "refund_amount": captured_amount,
        }

    if hold_status in {PaymentHoldStatus.AUTHORIZED, PaymentHoldStatus.REAUTHORIZED}:
        return {
            "action": "VOID_HOLD",
            "waived_amount": agreed_no_show_fee,
            "refund_amount": Decimal("0.00"),
        }

    return {
        "action": "NOOP",
        "waived_amount": Decimal("0.00"),
        "refund_amount": Decimal("0.00"),
    }


def is_slot_rescued(
    cancelled_starts_at: datetime,
    cancelled_ends_at: datetime,
    replacement_starts_at: datetime,
) -> bool:
    """Check if replacement booking overlaps or refills the vacated appointment slot."""
    c_start = (
        cancelled_starts_at
        if cancelled_starts_at.tzinfo is not None
        else cancelled_starts_at.replace(tzinfo=UTC)
    )
    c_end = (
        cancelled_ends_at
        if cancelled_ends_at.tzinfo is not None
        else cancelled_ends_at.replace(tzinfo=UTC)
    )
    r_start = (
        replacement_starts_at
        if replacement_starts_at.tzinfo is not None
        else replacement_starts_at.replace(tzinfo=UTC)
    )

    # Valid if replacement falls on the same calendar block (from start up to end, with 60-min grace tolerance)
    return (c_start - timedelta(minutes=30)) <= r_start <= (c_end + timedelta(minutes=30))
