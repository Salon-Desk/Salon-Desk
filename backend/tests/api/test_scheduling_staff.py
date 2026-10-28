import uuid
from datetime import UTC, date, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.deps import get_current_user
from app.api.deps.database import get_db
from app.main import create_app
from app.models.enums import UserRole, UserStatus
from app.models.organization import (
    Organization,
    OrgEmployeeTimeOff,
)
from app.models.service import OrgEmployeeCategory, ServiceCategory
from app.models.user import Profile, User
from app.schemas.organization import (
    OrgEmployeeShiftCreate,
    OrgEmployeeShiftOut,
    OrgEmployeeShiftUpdate,
    OrgEmployeeTimeOffCreate,
    OrgEmployeeTimeOffOut,
)
from app.schemas.user import UserOut
from app.services.availability_service import (
    _day_matches_shift_days,
)


def test_day_matches_shift_days_logic():
    # 2026-10-28 is a Wednesday
    wed = date(2026, 10, 28)
    assert _day_matches_shift_days(wed, ["wednesday"]) is True
    assert _day_matches_shift_days(wed, ["wed", "thu"]) is True
    assert _day_matches_shift_days(wed, ["monday", "tuesday"]) is False
    # None defaults to Mon-Fri (Wed is included)
    assert _day_matches_shift_days(wed, None) is True
    # Sunday
    sun = date(2026, 11, 1)
    assert _day_matches_shift_days(sun, None) is False
    assert _day_matches_shift_days(sun, ["sunday"]) is True
    assert _day_matches_shift_days(sun, ["sun"]) is True


def test_scheduling_schemas():
    assignment_id = uuid.uuid4()
    user_id = uuid.uuid4()
    shift_id = uuid.uuid4()
    now = datetime.now(UTC)

    create = OrgEmployeeShiftCreate(
        user_id=user_id,
        org_shift_id=shift_id,
        days=["monday", "wednesday", "friday"],
    )
    assert create.days == ["monday", "wednesday", "friday"]

    update = OrgEmployeeShiftUpdate(
        org_shift_id=shift_id,
        days=["tuesday", "thursday"],
    )
    assert update.days == ["tuesday", "thursday"]

    out = OrgEmployeeShiftOut(
        id=assignment_id,
        user_id=user_id,
        org_shift_id=shift_id,
        days=["monday", "wednesday", "friday"],
        created_at=now,
        employee_name="Jane Stylist",
        employee_email="jane@example.com",
        shift_name="Morning Shift",
        shift_data={"windows": [["09:00", "15:00"]]},
    )
    assert out.days == ["monday", "wednesday", "friday"]

    time_off_create = OrgEmployeeTimeOffCreate(
        user_id=user_id,
        start_date=date(2026, 11, 1),
        end_date=date(2026, 11, 5),
        reason="Vacation",
    )
    assert time_off_create.reason == "Vacation"

    time_off_out = OrgEmployeeTimeOffOut(
        id=uuid.uuid4(),
        org_id=uuid.uuid4(),
        user_id=user_id,
        start_date=date(2026, 11, 1),
        end_date=date(2026, 11, 5),
        reason="Vacation",
        created_at=now,
        employee_name="Jane Stylist",
    )
    assert time_off_out.reason == "Vacation"


def test_user_out_category_ids_property():
    cat_id1 = uuid.uuid4()
    cat_id2 = uuid.uuid4()
    u = User(
        id=uuid.uuid4(),
        email="test@example.com",
        status=UserStatus.ACTIVE,
        role=UserRole.STYLIST,
        created_at=datetime.now(UTC),
    )
    # With no employee_categories loaded
    assert u.category_ids == []

    # With employee_categories attached
    ec1 = OrgEmployeeCategory(id=uuid.uuid4(), user_id=u.id, service_category_id=cat_id1)
    ec2 = OrgEmployeeCategory(id=uuid.uuid4(), user_id=u.id, service_category_id=cat_id2)
    u.employee_categories = [ec1, ec2]
    assert u.category_ids == [cat_id1, cat_id2]

    # Validate UserOut serialization
    out = UserOut.model_validate(u)
    assert out.category_ids == [cat_id1, cat_id2]


@pytest.fixture
def mock_owner():
    org_id = uuid.uuid4()
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email="owner@example.com",
        role=UserRole.ORG_OWNER,
        status=UserStatus.ACTIVE,
        org_id=org_id,
        created_at=datetime.now(UTC),
    )
    user.profile = Profile(
        id=uuid.uuid4(),
        user_id=user_id,
        first_name="Alice",
        last_name="Owner",
        handle="alice_owner",
    )
    user.organization = Organization(
        id=org_id,
        name="Luxe Salon",
        owner_id=user_id,
    )
    return user


@pytest.mark.asyncio
async def test_time_off_api_endpoints(mock_owner):
    mock_db = AsyncMock()
    time_off_id = uuid.uuid4()
    staff_id = uuid.uuid4()

    time_off_obj = OrgEmployeeTimeOff(
        id=time_off_id,
        org_id=mock_owner.org_id,
        user_id=staff_id,
        start_date=date(2026, 11, 10),
        end_date=date(2026, 11, 15),
        reason="Medical leave",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    staff_user = User(id=staff_id, email="jane@example.com", org_id=mock_owner.org_id)
    staff_user.profile = Profile(user_id=staff_id, first_name="Jane", last_name="Stylist")

    mock_exec = MagicMock()
    mock_exec.all.return_value = [(time_off_obj, staff_user)]
    mock_exec.scalar_one.return_value = staff_user
    mock_db.execute.return_value = mock_exec
    mock_db.get.return_value = staff_user

    test_app = create_app()
    test_app.dependency_overrides[get_current_user] = lambda: mock_owner
    test_app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # GET /time-off
        resp = await client.get("/api/v1/organizations/me/time-off")
        assert resp.status_code == 200
        items = resp.json().get("data", resp.json())
        assert len(items) == 1
        assert items[0]["reason"] == "Medical leave"

        # POST /time-off
        post_resp = await client.post(
            "/api/v1/organizations/me/time-off",
            json={
                "user_id": str(staff_id),
                "start_date": "2026-11-10",
                "end_date": "2026-11-15",
                "reason": "Medical leave",
            },
        )
        assert post_resp.status_code == 201
        created = post_resp.json().get("data", post_resp.json())
        assert created["reason"] == "Medical leave"
        assert created["employee_name"] == "Jane Stylist"


@pytest.mark.asyncio
async def test_employee_categories_api(mock_owner):
    mock_db = AsyncMock()
    staff_id = uuid.uuid4()
    cat_id = uuid.uuid4()

    staff_user = User(id=staff_id, email="jane@example.com", org_id=mock_owner.org_id)
    cat = ServiceCategory(id=cat_id, name="Hair Styling", description="Hair treatments")

    # Mock DB calls
    mock_user_res = MagicMock()
    mock_user_res.scalar_one_or_none.return_value = staff_user

    mock_cat_res = MagicMock()
    mock_cat_res.scalars.return_value.all.return_value = [cat]

    mock_db.execute.side_effect = [mock_user_res, mock_cat_res, mock_user_res, mock_cat_res]

    test_app = create_app()
    test_app.dependency_overrides[get_current_user] = lambda: mock_owner
    test_app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # GET categories
        resp = await client.get(f"/api/v1/organizations/me/employees/{staff_id}/categories")
        assert resp.status_code == 200
        cats = resp.json().get("data", resp.json())
        assert len(cats) == 1
        assert cats[0]["name"] == "Hair Styling"
