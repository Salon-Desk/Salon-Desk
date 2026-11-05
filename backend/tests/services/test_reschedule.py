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
    booking.starts_at = datetime.now(UTC) + timedelta(days=5)
    booking.ends_at = booking.starts_at + timedelta(hours=1)
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

    new_starts = datetime.now(UTC) + timedelta(days=6)

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

    new_starts = datetime.now(UTC) + timedelta(days=6)

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


@pytest.mark.asyncio
async def test_create_booking_scales_price_with_party_size() -> None:
    from app.models.enums import OrganizationStatus, UserRole, UserStatus
    from app.models.organization import Organization
    from app.models.user import User

    db = AsyncMock()
    org_id = uuid4()
    client_id = uuid4()
    stylist_id = uuid4()
    service_id = uuid4()

    mock_org = MagicMock(spec=Organization)
    mock_org.id = org_id
    mock_org.status = OrganizationStatus.APPROVED

    mock_stylist = MagicMock(spec=User)
    mock_stylist.id = stylist_id
    mock_stylist.org_id = org_id
    mock_stylist.status = UserStatus.ACTIVE
    mock_stylist.role = UserRole.STYLIST

    def db_get(model, pk):
        if model is Organization:
            return mock_org
        if model is User:
            return mock_stylist
        return None

    db.get = AsyncMock(side_effect=db_get)

    mock_service = MagicMock(spec=Service)
    mock_service.id = service_id
    mock_service.organization_id = org_id
    mock_service.status = ServiceStatus.ACTIVE
    mock_service.duration_minutes = 45
    mock_service.base_price = Decimal("50.00")

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [mock_service]
    mock_exec_res = MagicMock()
    mock_exec_res.scalars.return_value = mock_scalars
    mock_exec_res.scalar_one_or_none.return_value = None

    db.execute = AsyncMock(return_value=mock_exec_res)

    future_starts = datetime.now(UTC) + timedelta(days=2)

    with (
        patch(
            "app.services.booking_service.check_slot_available", new_callable=AsyncMock
        ) as mock_slot,
        patch(
            "app.services.booking_service.total_platform_commission_for_services",
            new_callable=AsyncMock,
        ) as mock_comm,
        patch(
            "app.services.booking_service.commission_rule_for_service", new_callable=AsyncMock
        ) as mock_rule,
        patch("app.services.booking_service.get_booking", new_callable=AsyncMock) as mock_get_b,
    ):
        mock_slot.return_value = True
        mock_comm.return_value = Decimal("5.00")
        mock_rule.return_value = {"percent": 10}
        mock_get_b.side_effect = lambda _db, _id: db.add.call_args_list[0][0][0]

        created = await booking_service.create_booking(
            db,
            client_id=client_id,
            org_id=org_id,
            service_ids=[service_id],
            starts_at=future_starts,
            stylist_id=stylist_id,
            customer_notes="Celebrating birthday",
            party_size=3,
        )

        assert created.total_price == Decimal("150.00")  # 50 * 3
        assert created.agreed_hold_amount == Decimal("165.00")  # 150 + 5*3
        assert created.policy_snapshot_json["party_size"] == 3
        assert "Party size: 3 guests" in created.customer_notes


@pytest.mark.asyncio
async def test_create_booking_with_separate_service_stylists() -> None:
    from app.models.enums import OrganizationStatus, UserRole, UserStatus
    from app.models.organization import Organization
    from app.models.user import User

    db = AsyncMock()
    org_id = uuid4()
    client_id = uuid4()
    stylist1_id = uuid4()
    stylist2_id = uuid4()
    service1_id = uuid4()
    service2_id = uuid4()

    mock_org = MagicMock(spec=Organization)
    mock_org.id = org_id
    mock_org.status = OrganizationStatus.APPROVED

    mock_s1 = MagicMock(spec=User)
    mock_s1.id = stylist1_id
    mock_s1.org_id = org_id
    mock_s1.status = UserStatus.ACTIVE
    mock_s1.role = UserRole.STYLIST
    mock_s1.profile = None
    mock_s1.email = "alice@salon.com"

    mock_s2 = MagicMock(spec=User)
    mock_s2.id = stylist2_id
    mock_s2.org_id = org_id
    mock_s2.status = UserStatus.ACTIVE
    mock_s2.role = UserRole.STYLIST
    mock_s2.profile = None
    mock_s2.email = "bob@salon.com"

    def db_get(model, pk):
        if model is Organization:
            return mock_org
        if model is User:
            if pk == stylist1_id:
                return mock_s1
            if pk == stylist2_id:
                return mock_s2
        return None

    db.get = AsyncMock(side_effect=db_get)

    svc1 = MagicMock(spec=Service)
    svc1.id = service1_id
    svc1.organization_id = org_id
    svc1.status = ServiceStatus.ACTIVE
    svc1.duration_minutes = 30
    svc1.base_price = Decimal("40.00")
    svc1.name = "Haircut"

    svc2 = MagicMock(spec=Service)
    svc2.id = service2_id
    svc2.organization_id = org_id
    svc2.status = ServiceStatus.ACTIVE
    svc2.duration_minutes = 45
    svc2.base_price = Decimal("60.00")
    svc2.name = "Coloring"

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [svc1, svc2]
    mock_exec_res = MagicMock()
    mock_exec_res.scalars.return_value = mock_scalars
    mock_exec_res.scalar_one_or_none.return_value = None

    db.execute = AsyncMock(return_value=mock_exec_res)

    future_starts = datetime.now(UTC) + timedelta(days=2)

    with (
        patch(
            "app.services.booking_service.check_slot_available", new_callable=AsyncMock
        ) as mock_slot,
        patch(
            "app.services.booking_service.total_platform_commission_for_services",
            new_callable=AsyncMock,
        ) as mock_comm,
        patch(
            "app.services.booking_service.commission_rule_for_service", new_callable=AsyncMock
        ) as mock_rule,
        patch("app.services.booking_service.get_booking", new_callable=AsyncMock) as mock_get_b,
    ):
        mock_slot.return_value = True
        mock_comm.return_value = Decimal("10.00")
        mock_rule.return_value = {"percent": 10}
        mock_get_b.side_effect = lambda _db, _id: db.add.call_args_list[0][0][0]

        created = await booking_service.create_booking(
            db,
            client_id=client_id,
            org_id=org_id,
            service_ids=[service1_id, service2_id],
            starts_at=future_starts,
            stylist_id=None,
            service_stylists=[
                {"service_id": service1_id, "stylist_id": stylist1_id},
                {"service_id": service2_id, "stylist_id": stylist2_id},
            ],
            customer_notes=None,
            party_size=1,
        )

        assert created.total_price == Decimal("100.00")
        assert "Haircut: alice@salon.com" in created.customer_notes
        assert "Coloring: bob@salon.com" in created.customer_notes
        # check_slot_available was checked for both services
        assert mock_slot.call_count == 2
