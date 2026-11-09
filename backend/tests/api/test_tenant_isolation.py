import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.deps import get_current_user
from app.api.deps.database import get_db
from app.core.exceptions import NotFoundError
from app.main import create_app
from app.models.booking import Booking
from app.models.enums import UserRole, UserStatus
from app.models.user import User


@pytest.fixture
def org_a_owner():
    org_a_id = uuid.uuid4()
    user = MagicMock(spec=User)
    user.id = uuid.uuid4()
    user.email = "owner_a@salondesk.local"
    user.role = UserRole.ORG_OWNER
    user.status = UserStatus.ACTIVE
    user.org_id = org_a_id
    return user


@pytest.fixture
def org_b_booking():
    booking = MagicMock(spec=Booking)
    booking.id = uuid.uuid4()
    booking.org_id = uuid.uuid4()  # different from org_a
    return booking


@pytest.mark.asyncio
async def test_dispute_booking_idor_different_org_forbidden(org_a_owner, org_b_booking):
    """Org A owner cannot access dispute dossier for a booking owned by Org B."""
    app = create_app()
    mock_db = AsyncMock()
    mock_db.get = AsyncMock(return_value=org_b_booking)

    app.dependency_overrides[get_current_user] = lambda: org_a_owner
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(f"/api/v1/disputes/booking/{org_b_booking.id}")
        assert resp.status_code == 403
        body = resp.json()
        assert "You do not have access to this booking's dispute" in body["error"]["message"]


@pytest.mark.asyncio
async def test_dispute_booking_not_found(org_a_owner):
    """Requesting dispute for a non-existent booking returns 404."""
    app = create_app()
    mock_db = AsyncMock()
    mock_db.get = AsyncMock(return_value=None)

    app.dependency_overrides[get_current_user] = lambda: org_a_owner
    app.dependency_overrides[get_db] = lambda: mock_db

    non_existent_id = uuid.uuid4()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(f"/api/v1/disputes/booking/{non_existent_id}")
        assert resp.status_code == 404
        body = resp.json()
        assert f"Booking {non_existent_id} not found" in body["error"]["message"]


@pytest.mark.asyncio
async def test_dispute_simulate_idor_different_org_forbidden(org_a_owner, org_b_booking):
    """Org A owner cannot trigger simulated dispute chargeback on a booking owned by Org B."""
    app = create_app()
    mock_db = AsyncMock()
    mock_db.get = AsyncMock(return_value=org_b_booking)

    app.dependency_overrides[get_current_user] = lambda: org_a_owner
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            f"/api/v1/disputes/booking/{org_b_booking.id}/simulate",
            json={"reason": "UNRECOGNISED", "dispute_amount": 30.0},
        )
        assert resp.status_code == 403
        body = resp.json()
        assert (
            "You do not have access to simulate a dispute for this booking"
            in body["error"]["message"]
        )


@pytest.mark.asyncio
async def test_waitlist_idor_different_org_forbidden(org_a_owner, org_b_booking):
    """Org A owner cannot view waitlist candidates for a booking owned by Org B."""
    app = create_app()
    mock_db = AsyncMock()

    app.dependency_overrides[get_current_user] = lambda: org_a_owner
    app.dependency_overrides[get_db] = lambda: mock_db

    with patch(
        "app.services.booking_service.get_booking", new=AsyncMock(return_value=org_b_booking)
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(f"/api/v1/settlements/{org_b_booking.id}/waitlist")
            assert resp.status_code == 403
            body = resp.json()
            assert "Booking belongs to another organization" in body["error"]["message"]


@pytest.mark.asyncio
async def test_waitlist_booking_not_found(org_a_owner):
    """Requesting waitlist for non-existent booking returns 404."""
    app = create_app()
    mock_db = AsyncMock()

    app.dependency_overrides[get_current_user] = lambda: org_a_owner
    app.dependency_overrides[get_db] = lambda: mock_db

    non_existent_id = uuid.uuid4()
    with patch(
        "app.services.booking_service.get_booking",
        new=AsyncMock(side_effect=NotFoundError("Booking not found")),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(f"/api/v1/settlements/{non_existent_id}/waitlist")
            assert resp.status_code == 404
            body = resp.json()
            assert "Booking not found" in body["error"]["message"]


@pytest.mark.asyncio
async def test_waitlist_same_org_allowed(org_a_owner):
    """Org A owner can view waitlist candidates for their own salon's booking."""
    app = create_app()
    mock_db = AsyncMock()

    own_booking = MagicMock(spec=Booking)
    own_booking.id = uuid.uuid4()
    own_booking.org_id = org_a_owner.org_id

    app.dependency_overrides[get_current_user] = lambda: org_a_owner
    app.dependency_overrides[get_db] = lambda: mock_db

    with (
        patch("app.services.booking_service.get_booking", new=AsyncMock(return_value=own_booking)),
        patch(
            "app.services.slot_rescue_service.SlotRescueService.list_waitlist_candidates",
            new=AsyncMock(return_value=[]),
        ),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(f"/api/v1/settlements/{own_booking.id}/waitlist")
            assert resp.status_code == 200
            body = resp.json()
            assert body["success"] is True
            assert body["data"] == []
