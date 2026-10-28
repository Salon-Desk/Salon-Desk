import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.deps import get_current_user
from app.api.deps.database import get_db
from app.main import create_app
from app.models.enums import UserRole, UserStatus
from app.models.user import Profile, User


@pytest.fixture
def admin_user():
    user = User(
        id=uuid.uuid4(),
        email="admin@salondesk.local",
        password_hash="hashed_secret",
        role=UserRole.PLATFORM_ADMIN,
        status=UserStatus.ACTIVE,
        created_at=datetime.now(UTC),
    )
    user.profile = Profile(
        id=uuid.uuid4(),
        user_id=user.id,
        first_name="Admin",
        last_name="Super",
        phone="+15551234567",
    )
    return user


@pytest.fixture
def other_staff_user():
    staff = User(
        id=uuid.uuid4(),
        email="support@salondesk.local",
        password_hash="hashed_support",
        role=UserRole.PLATFORM_STAFF,
        status=UserStatus.ACTIVE,
        created_at=datetime.now(UTC),
    )
    staff.profile = Profile(
        id=uuid.uuid4(),
        user_id=staff.id,
        first_name="Support",
        last_name="Agent",
        phone="+15559876543",
    )
    return staff


@pytest.mark.asyncio
async def test_admin_cannot_delete_self(admin_user):
    mock_db = AsyncMock()
    app = create_app()
    app.dependency_overrides[get_current_user] = lambda: admin_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.delete(f"/api/v1/admin/staff/{admin_user.id}")

    assert resp.status_code == 400
    body = resp.json()
    error_msg = body.get("error", {}).get("message", "") or body.get("detail", "")
    assert "You cannot delete your own account" in error_msg


@pytest.mark.asyncio
async def test_admin_can_delete_other_staff(admin_user, other_staff_user):
    mock_db = AsyncMock()
    mock_db.get.return_value = other_staff_user
    mock_db.flush = AsyncMock()

    app = create_app()
    app.dependency_overrides[get_current_user] = lambda: admin_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.delete(f"/api/v1/admin/staff/{other_staff_user.id}")

    assert resp.status_code == 200
    body = resp.json()
    data = body.get("data", body)
    assert data["detail"] == "Platform staff deactivated"
    assert other_staff_user.status == UserStatus.INACTIVE


@pytest.mark.asyncio
async def test_register_staff_auto_generates_password_and_sends_email(admin_user):
    mock_db = AsyncMock()

    # Query for existing email check
    mock_existing_res = MagicMock()
    mock_existing_res.scalar_one_or_none.return_value = None

    # Query after insert for full user
    created_user = User(
        id=uuid.uuid4(),
        email="newhire@salondesk.local",
        password_hash="temp_hash",
        role=UserRole.PLATFORM_STAFF,
        status=UserStatus.ACTIVE,
        created_at=datetime.now(UTC),
    )
    created_user.profile = Profile(
        id=uuid.uuid4(),
        user_id=created_user.id,
        first_name="New",
        last_name="Hire",
    )

    mock_load_res = MagicMock()
    mock_load_res.scalar_one.return_value = created_user

    mock_db.execute.side_effect = [mock_existing_res, mock_load_res]
    mock_db.add = MagicMock()
    mock_db.flush = AsyncMock()

    app = create_app()
    app.dependency_overrides[get_current_user] = lambda: admin_user
    app.dependency_overrides[get_db] = lambda: mock_db

    with patch(
        "app.api.v1.platform.users.send_staff_invite_email", new_callable=AsyncMock
    ) as mock_send_email:
        mock_send_email.return_value = True

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/v1/admin/staff",
                json={
                    "email": "newhire@salondesk.local",
                    "first_name": "New",
                    "last_name": "Hire",
                },
            )

        assert resp.status_code == 201
        body = resp.json()
        data = body.get("data", body)
        assert data["email"] == "newhire@salondesk.local"
        mock_send_email.assert_awaited_once()
        call_kwargs = mock_send_email.call_args.kwargs
        assert call_kwargs["to_address"] == "newhire@salondesk.local"
        assert len(call_kwargs["temp_password"]) == 8


@pytest.mark.asyncio
async def test_resend_staff_invite(admin_user, other_staff_user):
    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = other_staff_user
    mock_db.execute.return_value = mock_res
    mock_db.flush = AsyncMock()

    app = create_app()
    app.dependency_overrides[get_current_user] = lambda: admin_user
    app.dependency_overrides[get_db] = lambda: mock_db

    with patch(
        "app.api.v1.platform.users.send_staff_invite_email", new_callable=AsyncMock
    ) as mock_send_email:
        mock_send_email.return_value = True

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(f"/api/v1/admin/staff/{other_staff_user.id}/resend-invite")

        assert resp.status_code == 200
        body = resp.json()
        data = body.get("data", body)
        assert data["detail"] == "Invitation resent successfully"
        mock_send_email.assert_awaited_once()
        assert len(mock_send_email.call_args.kwargs["temp_password"]) == 8


@pytest.mark.asyncio
async def test_reset_staff_password(admin_user, other_staff_user):
    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = other_staff_user
    mock_db.execute.return_value = mock_res
    mock_db.flush = AsyncMock()

    app = create_app()
    app.dependency_overrides[get_current_user] = lambda: admin_user
    app.dependency_overrides[get_db] = lambda: mock_db

    with patch(
        "app.api.v1.platform.users.send_staff_password_reset_email", new_callable=AsyncMock
    ) as mock_send_email:
        mock_send_email.return_value = True

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(f"/api/v1/admin/staff/{other_staff_user.id}/reset-password")

        assert resp.status_code == 200
        body = resp.json()
        data = body.get("data", body)
        assert data["detail"] == "Password reset and emailed to staff member"
        mock_send_email.assert_awaited_once()
        assert len(mock_send_email.call_args.kwargs["temp_password"]) == 8
