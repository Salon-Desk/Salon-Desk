import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.deps import get_current_user
from app.api.deps.database import get_db
from app.main import create_app
from app.models.enums import UserRole, UserStatus
from app.models.organization import Organization
from app.models.user import Profile, User


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
        first_name="Jane",
        last_name="Doe",
        handle="jane_owner",
        picture="https://example.com/avatar.jpg",
    )
    user.organization = Organization(
        id=org_id,
        name="Luxe Salon",
        owner_id=user_id,
        picture="https://example.com/salon_logo.jpg",
    )
    return user


@pytest.mark.asyncio
async def test_update_profile_handle_success(mock_owner):
    mock_db = AsyncMock()

    # Query for duplicate handle returns None (synchronous scalar_one_or_none on Result)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_result

    test_app = create_app()
    test_app.dependency_overrides[get_current_user] = lambda: mock_owner
    test_app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.patch(
            "/api/v1/auth/me/profile",
            json={"handle": "@Jane_Stylist", "first_name": "Jane", "last_name": "Doe"},
        )
        assert resp.status_code == 200
        data = resp.json().get("data", resp.json())
        assert data["handle"] == "jane_stylist"
        assert mock_owner.profile.handle == "jane_stylist"


@pytest.mark.asyncio
async def test_update_profile_handle_conflict(mock_owner):
    mock_db = AsyncMock()

    # Query for duplicate handle returns an existing profile
    other_profile = Profile(id=uuid.uuid4(), user_id=uuid.uuid4(), handle="taken_handle")
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = other_profile
    mock_db.execute.return_value = mock_result

    test_app = create_app()
    test_app.dependency_overrides[get_current_user] = lambda: mock_owner
    test_app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.patch(
            "/api/v1/auth/me/profile",
            json={"handle": "@taken_handle"},
        )
        assert resp.status_code == 409
        body = resp.json()
        error_msg = body.get("error", {}).get("message", "") or body.get("detail", "")
        assert "already in use" in error_msg
