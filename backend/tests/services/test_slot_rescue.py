"""Unit tests for Slot Rescue: deterministic referee and automated fee waiver."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.models.booking import Booking, WaitlistEntry
from app.models.enums import (
    BookingStatus,
    PaymentCaptureType,
    PaymentHoldStatus,
    UserRole,
    WaitlistStatus,
)
from app.models.payment import PaymentCapture, PaymentHold
from app.models.user import User
from app.services.policy_engine import evaluate_slot_rescue, is_slot_rescued
from app.services.slot_rescue_service import SlotRescueService


def test_evaluate_slot_rescue_void_hold() -> None:
    decision = evaluate_slot_rescue(
        original_booking_status=BookingStatus.CANCELLED,
        hold_status=PaymentHoldStatus.AUTHORIZED,
        agreed_no_show_fee=Decimal("30.00"),
        captured_amount=Decimal("0.00"),
    )
    assert decision["action"] == "VOID_HOLD"
    assert decision["waived_amount"] == Decimal("30.00")
    assert decision["refund_amount"] == Decimal("0.00")


def test_evaluate_slot_rescue_refund_capture() -> None:
    decision = evaluate_slot_rescue(
        original_booking_status=BookingStatus.NO_SHOW,
        hold_status=PaymentHoldStatus.CAPTURED,
        agreed_no_show_fee=Decimal("30.00"),
        captured_amount=Decimal("30.00"),
    )
    assert decision["action"] == "REFUND_CAPTURE"
    assert decision["waived_amount"] == Decimal("30.00")
    assert decision["refund_amount"] == Decimal("30.00")


def test_is_slot_rescued_window() -> None:
    now = datetime.now(UTC)
    c_start = now
    c_end = now + timedelta(hours=1)

    # Within same slot
    assert is_slot_rescued(c_start, c_end, now + timedelta(minutes=15)) is True
    # At start
    assert is_slot_rescued(c_start, c_end, now) is True
    # Within 30 min tolerance
    assert is_slot_rescued(c_start, c_end, now - timedelta(minutes=20)) is True
    # Outside tolerance
    assert is_slot_rescued(c_start, c_end, now + timedelta(hours=3)) is False


@pytest.mark.asyncio
async def test_execute_slot_rescue_void_hold_flow() -> None:
    org_id = uuid4()
    booking_id = uuid4()
    service_id = uuid4()
    stylist_id = uuid4()
    client_id = uuid4()

    booking = Booking(
        id=booking_id,
        org_id=org_id,
        stylist_id=stylist_id,
        client_id=client_id,
        status=BookingStatus.CANCELLED,
        total_price=Decimal("60.00"),
        agreed_hold_amount=Decimal("30.00"),
        agreed_no_show_fee=Decimal("30.00"),
        agreed_late_cancel_fee=Decimal("30.00"),
        free_cancel_deadline_at=datetime.now(UTC) - timedelta(hours=24),
        policy_snapshot_json={},
        commission_snapshot={},
        starts_at=datetime.now(UTC),
        ends_at=datetime.now(UTC) + timedelta(hours=1),
    )

    hold = PaymentHold(
        id=uuid4(),
        booking_id=booking_id,
        org_id=org_id,
        amount=Decimal("30.00"),
        captured_amount=Decimal("0.00"),
        status=PaymentHoldStatus.AUTHORIZED,
        parent_authorization_id="AUTH-12345",
    )

    waitlist_candidate = WaitlistEntry(
        id=uuid4(),
        org_id=org_id,
        service_id=service_id,
        client_name="Hana Tesfaye",
        client_email="hana@example.et",
        preferred_starts_at=booking.starts_at,
        status=WaitlistStatus.WAITING,
    )

    db = AsyncMock()
    db.bind = MagicMock()
    db.bind.dialect.name = "sqlite"

    async def mock_get(model, pk):
        if model is Booking and pk == booking_id:
            return booking
        if model is WaitlistEntry and pk == waitlist_candidate.id:
            return waitlist_candidate
        return None

    db.get = AsyncMock(side_effect=mock_get)

    async def mock_execute(stmt):
        stmt_str = str(stmt)
        mock_result = MagicMock()
        if "FROM payment_hold" in stmt_str:
            mock_result.scalar_one_or_none.return_value = hold
            mock_result.scalars.return_value.first.return_value = hold
        elif "FROM payment_capture" in stmt_str:
            mock_result.scalars.return_value.all.return_value = []
        elif "FROM waitlist_entry" in stmt_str:
            mock_result.scalars.return_value.all.return_value = [waitlist_candidate]
        elif "FROM ledger_entry" in stmt_str:
            mock_result.scalar_one_or_none.return_value = None
            mock_result.scalars.return_value.all.return_value = []
        else:
            mock_result.scalar_one_or_none.return_value = None
            mock_result.scalars.return_value.all.return_value = []
        return mock_result

    db.execute = AsyncMock(side_effect=mock_execute)
    db.flush = AsyncMock()
    db.add = MagicMock()

    service = SlotRescueService()
    res = await service.execute_slot_rescue(
        db,
        booking_id=booking_id,
        waitlist_entry_id=waitlist_candidate.id,
    )

    assert res["status"] == "success"
    assert res["action"] == "VOID_HOLD"
    assert res["waived_amount"] == Decimal("30.00")
    assert waitlist_candidate.status == WaitlistStatus.RESCUED_FILLED
    assert waitlist_candidate.rescued_booking_id == res["replacement_booking_id"]
    assert len(res["negotiation_rounds"]) == 3


@pytest.mark.asyncio
async def test_execute_slot_rescue_refund_capture_flow() -> None:
    org_id = uuid4()
    booking_id = uuid4()
    service_id = uuid4()
    stylist_id = uuid4()
    client_id = uuid4()

    booking = Booking(
        id=booking_id,
        org_id=org_id,
        stylist_id=stylist_id,
        client_id=client_id,
        status=BookingStatus.NO_SHOW,
        total_price=Decimal("60.00"),
        agreed_hold_amount=Decimal("30.00"),
        agreed_no_show_fee=Decimal("30.00"),
        agreed_late_cancel_fee=Decimal("30.00"),
        free_cancel_deadline_at=datetime.now(UTC) - timedelta(hours=24),
        policy_snapshot_json={},
        commission_snapshot={},
        starts_at=datetime.now(UTC),
        ends_at=datetime.now(UTC) + timedelta(hours=1),
    )

    hold_id = uuid4()
    capture = PaymentCapture(
        id=uuid4(),
        booking_id=booking_id,
        hold_id=hold_id,
        amount=Decimal("30.00"),
        currency="USD",
        capture_type=PaymentCaptureType.NO_SHOW_FEE,
        status="COMPLETED",
        paypal_capture_id="CAP-998877",
    )

    waitlist_candidate = WaitlistEntry(
        id=uuid4(),
        org_id=org_id,
        service_id=service_id,
        client_name="Meron Alemu",
        client_email="meron@example.et",
        preferred_starts_at=booking.starts_at,
        status=WaitlistStatus.WAITING,
    )

    db = AsyncMock()
    db.bind = MagicMock()
    db.bind.dialect.name = "sqlite"

    async def mock_get(model, pk):
        if model is Booking and pk == booking_id:
            return booking
        if model is WaitlistEntry and pk == waitlist_candidate.id:
            return waitlist_candidate
        return None

    db.get = AsyncMock(side_effect=mock_get)

    async def mock_execute(stmt):
        stmt_str = str(stmt)
        mock_result = MagicMock()
        if "FROM payment_hold" in stmt_str:
            mock_result.scalar_one_or_none.return_value = None
        elif "FROM payment_capture" in stmt_str:
            mock_result.scalars.return_value.all.return_value = [capture]
        elif "FROM waitlist_entry" in stmt_str:
            mock_result.scalars.return_value.all.return_value = [waitlist_candidate]
        elif "FROM ledger_entry" in stmt_str:
            mock_result.scalar_one_or_none.return_value = None
            mock_result.scalars.return_value.all.return_value = []
        else:
            mock_result.scalar_one_or_none.return_value = None
            mock_result.scalars.return_value.all.return_value = []
        return mock_result

    db.execute = AsyncMock(side_effect=mock_execute)
    db.flush = AsyncMock()
    db.add = MagicMock()

    mock_toolkit = AsyncMock()
    mock_toolkit.create_refund.return_value = {
        "status": "COMPLETED",
        "refund_id": "REF-554433",
    }

    actor_user = User(
        id=uuid4(),
        email="owner@selam.et",
        role=UserRole.ORG_OWNER,
        org_id=org_id,
    )

    service = SlotRescueService(toolkit_runner=mock_toolkit)
    res = await service.execute_slot_rescue(
        db,
        booking_id=booking_id,
        waitlist_entry_id=waitlist_candidate.id,
        actor_user=actor_user,
    )

    assert res["status"] == "success"
    assert res["action"] == "REFUND_CAPTURE"
    assert res["refund_amount"] == Decimal("30.00")
    assert waitlist_candidate.status == WaitlistStatus.RESCUED_FILLED
    mock_toolkit.create_refund.assert_awaited_once_with(
        capture_id="CAP-998877",
        amount=Decimal("30.00"),
        reason="Slot Rescue: chair refilled by waitlist client",
        staff_id=actor_user.id,
        db=db,
    )
