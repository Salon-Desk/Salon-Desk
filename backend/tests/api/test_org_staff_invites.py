import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.deps import get_current_user
from app.api.deps.database import get_db
from app.main import create_app
from app.models.enums import UserRole, UserStatus
from app.models.organization import Organization
from app.models.user import Profile, User


@pytest.fixture
def org_id():
    return uuid.uuid4()


@pytest.fixture
def org_owner_user(org_id):
    user = User(
        id=uuid.uuid4(),
        email="owner@salondesk.local",
        password_hash="hashed_secret",
        role=UserRole.ORG_OWNER,
        status=UserStatus.ACTIVE,
        org_id=org_id,
        created_at=datetime.now(UTC),
    )
    user.profile = Profile(
        id=uuid.uuid4(),
        user_id=user.id,
        first_name="Alice",
        last_name="Owner",
        phone="+15551234567",
    )
    return user


@pytest.fixture
def employee_user(org_id):
    staff = User(
        id=uuid.uuid4(),
        email="stylist@salondesk.local",
        password_hash="hashed_old_pw",
        role=UserRole.STYLIST,
        status=UserStatus.ACTIVE,
        org_id=org_id,
        created_at=datetime.now(UTC),
    )
    staff.profile = Profile(
        id=uuid.uuid4(),
        user_id=staff.id,
        first_name="Bob",
        last_name="Stylist",
        phone="+15559876543",
    )
    return staff


@pytest.fixture
def organization(org_id, org_owner_user):
    return Organization(
        id=org_id,
        name="Crown & Blade Atelier",
        owner_id=org_owner_user.id,
        status="ACTIVE",
    )


@pytest.mark.asyncio
async def test_create_employee_auto_generates_password_and_emails(
    org_owner_user, organization, org_id
):
    mock_db = AsyncMock()

    # check existing email returns None
    existing_result = MagicMock()
    existing_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = existing_result
    mock_db.get.return_value = organization

    created_employee = User(
        id=uuid.uuid4(),
        email="newstylist@salondesk.local",
        password_hash="some_hash",
        role=UserRole.STYLIST,
        status=UserStatus.ACTIVE,
        org_id=org_id,
        created_at=datetime.now(UTC),
    )
    created_employee.profile = Profile(
        id=uuid.uuid4(),
        user_id=created_employee.id,
        first_name="Charlie",
        last_name="Hair",
    )

    app = create_app()
    app.dependency_overrides[get_current_user] = lambda: org_owner_user
    app.dependency_overrides[get_db] = lambda: mock_db

    with (
        patch("app.services.org_service.create_employee", new_callable=AsyncMock) as mock_create,
        patch(
            "app.api.v1.org.employees.send_staff_invite_email", new_callable=AsyncMock
        ) as mock_send_email,
    ):
        mock_create.return_value = created_employee
        mock_send_email.return_value = True

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/v1/organizations/me/employees",
                data={
                    "email": "newstylist@salondesk.local",
                    "first_name": "Charlie",
                    "last_name": "Hair",
                    "role": "stylist",
                },
            )

        assert resp.status_code == 201
        body = resp.json()
        data = body.get("data", body)
        assert data["email"] == "newstylist@salondesk.local"

        mock_create.assert_called_once()
        call_kwargs = mock_create.call_args.kwargs
        # Auto-generated password must be 8 characters long
        assert len(call_kwargs["password"]) == 8

        mock_send_email.assert_called_once()
        email_kwargs = mock_send_email.call_args.kwargs
        assert email_kwargs["to_address"] == "newstylist@salondesk.local"
        assert len(email_kwargs["temp_password"]) == 8
        assert email_kwargs["salon_name"] == "Crown & Blade Atelier"


@pytest.mark.asyncio
async def test_resend_employee_invite(org_owner_user, employee_user, organization):
    mock_db = AsyncMock()

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = employee_user
    mock_db.execute.return_value = mock_result
    mock_db.get.return_value = organization

    app = create_app()
    app.dependency_overrides[get_current_user] = lambda: org_owner_user
    app.dependency_overrides[get_db] = lambda: mock_db

    with patch(
        "app.api.v1.org.employees.send_staff_invite_email", new_callable=AsyncMock
    ) as mock_send_email:
        mock_send_email.return_value = True

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                f"/api/v1/organizations/me/employees/{employee_user.id}/resend-invite"
            )

        assert resp.status_code == 200
        body = resp.json()
        data = body.get("data", body)
        assert data["detail"] == "Invitation resent successfully"

        mock_send_email.assert_called_once()
        email_kwargs = mock_send_email.call_args.kwargs
        assert email_kwargs["to_address"] == employee_user.email
        assert len(email_kwargs["temp_password"]) == 8
        assert email_kwargs["salon_name"] == "Crown & Blade Atelier"


@pytest.mark.asyncio
async def test_reset_employee_password(org_owner_user, employee_user, organization):
    mock_db = AsyncMock()

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = employee_user
    mock_db.execute.return_value = mock_result
    mock_db.get.return_value = organization

    app = create_app()
    app.dependency_overrides[get_current_user] = lambda: org_owner_user
    app.dependency_overrides[get_db] = lambda: mock_db

    with patch(
        "app.api.v1.org.employees.send_staff_password_reset_email", new_callable=AsyncMock
    ) as mock_send_email:
        mock_send_email.return_value = True

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                f"/api/v1/organizations/me/employees/{employee_user.id}/reset-password"
            )

        assert resp.status_code == 200
        body = resp.json()
        data = body.get("data", body)
        assert data["detail"] == "Password reset and emailed to employee"

        mock_send_email.assert_called_once()
        email_kwargs = mock_send_email.call_args.kwargs
        assert email_kwargs["to_address"] == employee_user.email
        assert len(email_kwargs["temp_password"]) == 8
        assert email_kwargs["salon_name"] == "Crown & Blade Atelier"


@pytest.mark.asyncio
async def test_cannot_resend_or_reset_self(org_owner_user):
    mock_db = AsyncMock()
    mock_result = MagicMock()
    # If the user tries to target themselves
    mock_result.scalar_one_or_none.return_value = org_owner_user
    mock_db.execute.return_value = mock_result

    app = create_app()
    app.dependency_overrides[get_current_user] = lambda: org_owner_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            f"/api/v1/organizations/me/employees/{org_owner_user.id}/resend-invite"
        )
    assert resp.status_code == 404
