"""Tests for hold expiration supervisor and 29-day lifetime cap."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.models.booking import Booking
from app.models.enums import BookingStatus, PaymentHoldStatus
from app.models.payment import PaymentHold
from app.tasks.hold_expiration import tick


def _build_mock_db(hold: PaymentHold, booking: Booking) -> MagicMock:
    db = AsyncMock()
    db.commit = AsyncMock()
    db.rollback = AsyncMock()

    mock_scalars = MagicMock()
    mock_scalars.all = MagicMock(return_value=[hold])
    mock_res = MagicMock()
    mock_res.scalars = MagicMock(return_value=mock_scalars)

    db.execute = AsyncMock(return_value=mock_res)
    db.get = AsyncMock(return_value=booking)

    session_ctx = MagicMock()
    session_ctx.__aenter__ = AsyncMock(return_value=db)
    session_ctx.__aexit__ = AsyncMock(return_value=None)
    return session_ctx, db


@pytest.mark.asyncio
async def test_tick_expires_29_day_old_hold() -> None:
    now = datetime.now(UTC)
    hold = PaymentHold(
        id=uuid4(),
        booking_id=uuid4(),
        org_id=uuid4(),
        amount=50.0,
        currency="USD",
        status=PaymentHoldStatus.AUTHORIZED,
        reauthorization_count=1,
        honor_expires_at=now - timedelta(hours=1),
        created_at=now - timedelta(days=30),
    )
    booking = Booking(
        id=hold.booking_id,
        org_id=hold.org_id,
        status=BookingStatus.CONFIRMED,
        starts_at=now + timedelta(days=2),
    )

    session_ctx, db = _build_mock_db(hold, booking)

    with (
        patch("app.tasks.hold_expiration.AsyncSessionLocal", return_value=session_ctx),
        patch("app.tasks.hold_expiration.append_ledger", new=AsyncMock()) as mock_append,
    ):
        processed = await tick()
        assert processed == 1
        assert hold.status == PaymentHoldStatus.EXPIRED
        mock_append.assert_awaited_once()
        args, kwargs = mock_append.call_args
        assert kwargs["event_type"] == "PAYMENT_HOLD_EXPIRED"
        db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_tick_reauthorizes_eligible_future_hold() -> None:
    now = datetime.now(UTC)
    hold = PaymentHold(
        id=uuid4(),
        booking_id=uuid4(),
        org_id=uuid4(),
        amount=50.0,
        currency="USD",
        status=PaymentHoldStatus.AUTHORIZED,
        reauthorization_count=0,
        honor_expires_at=now + timedelta(hours=1),
        created_at=now - timedelta(days=3),
    )
    booking = Booking(
        id=hold.booking_id,
        org_id=hold.org_id,
        status=BookingStatus.CONFIRMED,
        starts_at=now + timedelta(days=2),
    )

    session_ctx, db = _build_mock_db(hold, booking)

    with (
        patch("app.tasks.hold_expiration.AsyncSessionLocal", return_value=session_ctx),
        patch("app.services.payment_service.reauthorize_hold", new=AsyncMock()) as mock_reauth,
    ):
        processed = await tick()
        assert processed == 1
        mock_reauth.assert_awaited_once_with(db, booking=booking)
        db.commit.assert_awaited_once()
