"""Unit tests for booking reschedule, stylist reassignment, and policy guardrails."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

from app.core.exceptions import ForbiddenError, PolicyViolationException
from app.models.booking import Booking, BookingService
from app.models.enums import BookingStatus, PaymentHoldStatus, UserRole
from app.models.payment import PaymentHold
from app.models.service import Service
from app.models.user import User
from app.services.booking_service import reschedule_booking


def _create_mock_booking(
    *,
    starts_at: datetime,
    ends_at: datetime,
    total_price: Decimal = Decimal("50.00"),
    agreed_hold_amount: Decimal = Decimal("50.00"),
    status: BookingStatus = BookingStatus.CONFIRMED,
    client_id: uuid4 | None = None,
    org_id: uuid4 | None = None,
    stylist_id: uuid4 | None = None,
) -> Booking:
    cid = client_id or uuid4()
    oid = org_id or uuid4()
    sid = stylist_id or uuid4()
    bid = uuid4()

    booking = Booking(
        id=bid,
        client_id=cid,
        org_id=oid,
        stylist_id=sid,
        status=status,
        starts_at=starts_at,
        ends_at=ends_at,
        total_price=total_price,
        agreed_hold_amount=agreed_hold_amount,
        policy_snapshot_json={"free_cancel_hours": 24, "reschedule_cutoff_hours": 4.0},
        free_cancel_deadline_at=starts_at - timedelta(hours=24),
    )

    # Attach primary service
    srv = Service(
        id=uuid4(),
        organization_id=oid,
        service_category_id=uuid4(),
        name="Haircut",
        duration_minutes=60,
        base_price=Decimal("50.00"),
        images={},
    )
    bs = BookingService(booking_id=bid, service_id=srv.id, service=srv)
    booking.booking_services = [bs]

    # Attach hold
    hold = PaymentHold(
        id=uuid4(),
        booking_id=bid,
        org_id=oid,
        amount=50.0,
        currency="USD",
        status=PaymentHoldStatus.AUTHORIZED,
    )
    booking.payment_hold = hold
    return booking


@pytest.mark.asyncio
async def test_reschedule_client_within_cutoff_rejected() -> None:
    now = datetime.now(UTC)
    # Starts in 2 hours (within 4h cutoff)
    starts_at = now + timedelta(hours=2)
    ends_at = starts_at + timedelta(hours=1)
    booking = _create_mock_booking(starts_at=starts_at, ends_at=ends_at)

    db = AsyncMock()

    new_start = now + timedelta(days=2)
    with pytest.raises(PolicyViolationException, match="within 4 hours of appointment"):
        await reschedule_booking(
            db,
            booking=booking,
            actor_id=booking.client_id,
            starts_at=new_start,
            is_org=False,
        )


@pytest.mark.asyncio
async def test_reschedule_org_staff_bypasses_cutoff() -> None:
    now = datetime.now(UTC)
    # Starts in 1 hour (within 4h cutoff)
    starts_at = now + timedelta(hours=1)
    ends_at = starts_at + timedelta(hours=1)
    booking = _create_mock_booking(starts_at=starts_at, ends_at=ends_at)

    db = AsyncMock()
    db.flush = AsyncMock()

    new_start = now + timedelta(days=1)
    new_end = new_start + timedelta(hours=1)

    with (
        patch("app.services.booking_service.check_slot_available", AsyncMock(return_value=True)),
        patch("app.services.booking_service.append_ledger", AsyncMock()),
        patch("app.services.booking_service.get_booking", AsyncMock(return_value=booking)),
    ):
        updated = await reschedule_booking(
            db,
            booking=booking,
            actor_id=uuid4(),  # Org staff ID
            starts_at=new_start,
            ends_at=new_end,
            is_org=True,
        )

        assert updated.starts_at == new_start
        assert updated.ends_at == new_end
        assert updated.free_cancel_deadline_at == new_start - timedelta(hours=24)


@pytest.mark.asyncio
async def test_reschedule_stylist_reassignment_retains_hold() -> None:
    now = datetime.now(UTC)
    starts_at = now + timedelta(days=3)
    ends_at = starts_at + timedelta(hours=1)
    booking = _create_mock_booking(starts_at=starts_at, ends_at=ends_at)

    new_stylist_id = uuid4()
    mock_stylist_user = User(
        id=new_stylist_id,
        email="stylist@example.com",
        org_id=booking.org_id,
        role=UserRole.STYLIST,
    )

    db = AsyncMock()
    db.get = AsyncMock(return_value=mock_stylist_user)
    db.flush = AsyncMock()

    original_hold_id = booking.payment_hold.id
    original_hold_status = booking.payment_hold.status

    with (
        patch("app.services.booking_service.check_slot_available", AsyncMock(return_value=True)),
        patch("app.services.booking_service.append_ledger", AsyncMock()),
        patch("app.services.booking_service.get_booking", AsyncMock(return_value=booking)),
    ):
        updated = await reschedule_booking(
            db,
            booking=booking,
            actor_id=booking.client_id,
            stylist_id=new_stylist_id,
            is_org=False,
        )

        assert updated.stylist_id == new_stylist_id
        # Hold is completely preserved and unaltered
        assert updated.payment_hold.id == original_hold_id
        assert updated.payment_hold.status == original_hold_status


@pytest.mark.asyncio
async def test_reschedule_slot_unavailable_raises_forbidden() -> None:
    now = datetime.now(UTC)
    starts_at = now + timedelta(days=3)
    ends_at = starts_at + timedelta(hours=1)
    booking = _create_mock_booking(starts_at=starts_at, ends_at=ends_at)

    db = AsyncMock()

    with (
        patch("app.services.booking_service.check_slot_available", AsyncMock(return_value=False)),
        pytest.raises(ForbiddenError, match="Selected time slot is not available"),
    ):
        await reschedule_booking(
            db,
            booking=booking,
            actor_id=booking.client_id,
            starts_at=now + timedelta(days=4),
            is_org=False,
        )


@pytest.mark.asyncio
async def test_reschedule_exceeds_hold_ceiling_raises_policy_violation() -> None:
    now = datetime.now(UTC)
    starts_at = now + timedelta(days=3)
    ends_at = starts_at + timedelta(hours=1)
    # Price is $80 but agreed hold amount was $50
    booking = _create_mock_booking(
        starts_at=starts_at,
        ends_at=ends_at,
        total_price=Decimal("80.00"),
        agreed_hold_amount=Decimal("50.00"),
    )

    db = AsyncMock()

    with (
        patch("app.services.booking_service.check_slot_available", AsyncMock(return_value=True)),
        pytest.raises(PolicyViolationException, match="exceeds authorized deposit hold"),
    ):
        await reschedule_booking(
            db,
            booking=booking,
            actor_id=booking.client_id,
            starts_at=now + timedelta(days=4),
            is_org=False,
        )
