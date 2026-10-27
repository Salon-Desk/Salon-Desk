from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.core.exceptions import ForbiddenError
from app.models.booking import Booking, BookingService
from app.models.enums import BookingStatus, ServiceStatus
from app.models.service import Service
from app.services import booking_service


@pytest.fixture
def mock_booking() -> Booking:
    booking = MagicMock(spec=Booking)
    booking.id = uuid4()
    booking.client_id = uuid4()
    booking.org_id = uuid4()
    booking.stylist_id = uuid4()
    booking.status = BookingStatus.CONFIRMED
    booking.starts_at = datetime(2026, 11, 1, 10, 0, tzinfo=UTC)
    booking.ends_at = datetime(2026, 11, 1, 11, 0, tzinfo=UTC)
    booking.policy_snapshot_json = {"free_cancel_hours": 24}
    booking.total_price = Decimal("100.00")

    bs = MagicMock(spec=BookingService)
    bs.service_id = uuid4()
    booking.booking_services = [bs]
    return booking


@pytest.mark.asyncio
async def test_reschedule_booking_success(mock_booking: Booking) -> None:
    db = AsyncMock()
    mock_service = MagicMock(spec=Service)
    mock_service.id = mock_booking.booking_services[0].service_id
    mock_service.status = ServiceStatus.ACTIVE
    db.get.return_value = mock_service

    new_starts = datetime(2026, 11, 2, 14, 0, tzinfo=UTC)

    with (
        patch(
            "app.services.booking_service.check_slot_available", new_callable=AsyncMock
        ) as mock_check,
        patch("app.services.booking_service.append_ledger", new_callable=AsyncMock) as mock_ledger,
    ):
        mock_check.return_value = True

        res = await booking_service.reschedule_booking(
            db,
            booking=mock_booking,
            starts_at=new_starts,
            actor_id=mock_booking.client_id,
        )

        assert res.starts_at == new_starts
        assert res.ends_at == new_starts + timedelta(hours=1)
        mock_check.assert_called_once()
        mock_ledger.assert_called_once()


@pytest.mark.asyncio
async def test_reschedule_forbidden_when_slot_occupied(mock_booking: Booking) -> None:
    db = AsyncMock()
    mock_service = MagicMock(spec=Service)
    mock_service.status = ServiceStatus.ACTIVE
    db.get.return_value = mock_service

    new_starts = datetime(2026, 11, 2, 14, 0, tzinfo=UTC)

    with patch(
        "app.services.booking_service.check_slot_available", new_callable=AsyncMock
    ) as mock_check:
        mock_check.return_value = False

        with pytest.raises(ForbiddenError, match="Selected time slot is not available"):
            await booking_service.reschedule_booking(
                db,
                booking=mock_booking,
                starts_at=new_starts,
                actor_id=mock_booking.client_id,
            )
