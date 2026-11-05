"""Tests for booking horizon and reschedule validation guards."""

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

from app.core.exceptions import PolicyViolationException
from app.models.booking import Booking, BookingService
from app.models.enums import BookingStatus, PaymentHoldStatus
from app.models.payment import PaymentHold
from app.models.service import Service
from app.services.booking_service import create_booking, create_booking_order, reschedule_booking


@pytest.mark.asyncio
async def test_booking_attempt_30_days_ahead_rejected() -> None:
    now = datetime.now(UTC)
    db = AsyncMock()
    starts_at_30d = now + timedelta(days=30)
    with pytest.raises(PolicyViolationException) as exc_info:
        await create_booking(
            db,
            client_id=uuid4(),
            org_id=uuid4(),
            service_ids=[uuid4()],
            starts_at=starts_at_30d,
            stylist_id=None,
            customer_notes=None,
        )
    assert exc_info.value.code == "BOOKING_HORIZON_EXCEEDED"
    assert "up to 28 days in advance" in exc_info.value.message
    assert getattr(exc_info.value, "status_code", None) == 422


@pytest.mark.asyncio
async def test_create_booking_order_alias_matches_create_booking() -> None:
    assert create_booking_order == create_booking


@pytest.mark.asyncio
async def test_reschedule_attempt_day_32_rejected() -> None:
    now = datetime.now(UTC)
    auth_date = now - timedelta(days=2)
    starts_at = now + timedelta(days=5)
    ends_at = starts_at + timedelta(hours=1)
    bid = uuid4()
    oid = uuid4()
    cid = uuid4()

    booking = Booking(
        id=bid,
        client_id=cid,
        org_id=oid,
        stylist_id=None,
        status=BookingStatus.CONFIRMED,
        starts_at=starts_at,
        ends_at=ends_at,
        total_price=Decimal("50.00"),
        agreed_hold_amount=Decimal("50.00"),
        policy_snapshot_json={"free_cancel_hours": 24, "reschedule_cutoff_hours": 4.0},
        free_cancel_deadline_at=starts_at - timedelta(hours=24),
    )
    srv = Service(
        id=uuid4(),
        organization_id=oid,
        service_category_id=uuid4(),
        name="Haircut",
        duration_minutes=60,
        base_price=Decimal("50.00"),
        images={},
    )
    booking.booking_services = [BookingService(booking_id=bid, service_id=srv.id, service=srv)]

    hold = PaymentHold(
        id=uuid4(),
        booking_id=bid,
        org_id=oid,
        amount=50.0,
        currency="USD",
        status=PaymentHoldStatus.AUTHORIZED,
    )
    hold.authorized_at = auth_date
    hold.created_at = auth_date
    booking.payment_hold = hold

    db = AsyncMock()
    new_start = auth_date + timedelta(days=32)
    new_end = new_start + timedelta(hours=1)

    with (
        patch("app.services.booking_service.check_slot_available", AsyncMock(return_value=True)),
        pytest.raises(PolicyViolationException) as exc_info,
    ):
        await reschedule_booking(
            db,
            booking=booking,
            actor_id=booking.client_id,
            starts_at=new_start,
            ends_at=new_end,
            is_org=False,
        )
    assert exc_info.value.code == "RESCHEDULE_LIMIT_EXCEEDED"
    assert "Cannot reschedule past" in exc_info.value.message
    assert "PayPal authorization holds expire 29 days" in exc_info.value.message
    assert getattr(exc_info.value, "status_code", None) == 422


@pytest.mark.asyncio
async def test_reschedule_attempt_day_15_passes_cleanly() -> None:
    now = datetime.now(UTC)
    auth_date = now - timedelta(days=1)
    starts_at = now + timedelta(days=3)
    ends_at = starts_at + timedelta(hours=1)
    bid = uuid4()
    oid = uuid4()
    cid = uuid4()

    booking = Booking(
        id=bid,
        client_id=cid,
        org_id=oid,
        stylist_id=None,
        status=BookingStatus.CONFIRMED,
        starts_at=starts_at,
        ends_at=ends_at,
        total_price=Decimal("50.00"),
        agreed_hold_amount=Decimal("50.00"),
        policy_snapshot_json={"free_cancel_hours": 24, "reschedule_cutoff_hours": 4.0},
        free_cancel_deadline_at=starts_at - timedelta(hours=24),
    )
    srv = Service(
        id=uuid4(),
        organization_id=oid,
        service_category_id=uuid4(),
        name="Haircut",
        duration_minutes=60,
        base_price=Decimal("50.00"),
        images={},
    )
    booking.booking_services = [BookingService(booking_id=bid, service_id=srv.id, service=srv)]

    hold = PaymentHold(
        id=uuid4(),
        booking_id=bid,
        org_id=oid,
        amount=50.0,
        currency="USD",
        status=PaymentHoldStatus.AUTHORIZED,
    )
    hold.authorized_at = auth_date
    hold.created_at = auth_date
    booking.payment_hold = hold

    db = AsyncMock()
    db.flush = AsyncMock()

    new_start = auth_date + timedelta(days=15)
    new_end = new_start + timedelta(hours=1)

    with (
        patch("app.services.booking_service.check_slot_available", AsyncMock(return_value=True)),
        patch("app.services.booking_service.append_ledger", AsyncMock()),
    ):
        updated = await reschedule_booking(
            db,
            booking=booking,
            actor_id=booking.client_id,
            starts_at=new_start,
            ends_at=new_end,
            is_org=False,
        )
        assert updated.starts_at == new_start
        assert updated.ends_at == new_end
