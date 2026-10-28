import uuid
from datetime import UTC, datetime
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.deps import get_current_user
from app.api.deps.database import get_db
from app.main import create_app
from app.models.enums import (
    OrganizationStatus,
    OrgCancellationPolicyStatus,
    ServiceStatus,
    UserRole,
    UserStatus,
)
from app.models.organization import Organization, OrgSettings
from app.models.payment import OrgAccount
from app.models.policy import OrgCancellationPolicy
from app.models.service import Service, ServiceCategory
from app.models.user import Profile, User
from app.schemas.organization import (
    AdminOrganizationDetailOut,
    AdminOrgOwnerOut,
    AdminOrgPaypalOut,
    AdminOrgServiceItem,
    AdminOrgStaffItem,
    CatalogCancellationPolicyOut,
)


def test_admin_organization_detail_schema():
    org_id = uuid.uuid4()
    owner_id = uuid.uuid4()
    now = datetime.now(UTC)

    detail = AdminOrganizationDetailOut(
        id=org_id,
        owner_id=owner_id,
        name="Luxe Salon",
        status="approved",
        description="A premier hair and styling studio.",
        picture="https://example.com/salon.jpg",
        created_at=now,
        owner=AdminOrgOwnerOut(
            id=owner_id,
            email="owner@example.com",
            first_name="Jane",
            last_name="Doe",
            phone="+1 555-0100",
            status="active",
            role="ORG_OWNER",
            created_at=now,
        ),
        paypal_account=AdminOrgPaypalOut(
            id=uuid.uuid4(),
            merchant_id="MERCHANT_123",
            merchant_email="paypal@example.com",
            display_name="Luxe Salon PayPal",
            currency="USD",
            status="approved",
            approved_at=now,
            created_at=now,
        ),
        physical_address="123 Broadway, New York, NY",
        timezone="America/New_York",
        lat=Decimal("40.7128"),
        lng=Decimal("-74.0060"),
        working_hours={"mon": [["09:00", "18:00"]]},
        cancellation_policy=CatalogCancellationPolicyOut(
            org_id=org_id,
            name="Flexible 24h",
            free_cancel_hours=24,
            no_show_fee_percent=50,
            late_cancel_fee_percent=25,
            data={"free_cancel_hours": 24},
        ),
        rating_avg=4.9,
        review_count=12,
        services_count=1,
        staff_count=1,
        services=[
            AdminOrgServiceItem(
                id=uuid.uuid4(),
                name="Signature Haircut",
                category_name="Haircuts",
                base_price=Decimal("85.00"),
                duration_minutes=45,
                status="active",
                simultaneous_capacity=2,
            )
        ],
        staff=[
            AdminOrgStaffItem(
                id=uuid.uuid4(),
                first_name="Alice",
                last_name="Stylist",
                email="alice@example.com",
                role="stylist",
                picture=None,
                phone="+1 555-0199",
            )
        ],
    )

    assert detail.name == "Luxe Salon"
    assert detail.owner is not None
    assert detail.owner.email == "owner@example.com"
    assert detail.paypal_account is not None
    assert detail.paypal_account.merchant_id == "MERCHANT_123"
    assert detail.services_count == 1
    assert detail.services[0].name == "Signature Haircut"
    assert detail.cancellation_policy is not None
    assert detail.cancellation_policy.free_cancel_hours == 24


@pytest.mark.asyncio
async def test_get_admin_organization_detail_endpoint():
    app = create_app()

    admin_user = MagicMock(spec=User)
    admin_user.id = uuid.uuid4()
    admin_user.role = UserRole.PLATFORM_ADMIN
    admin_user.status = UserStatus.ACTIVE

    org_id = uuid.uuid4()
    owner_id = uuid.uuid4()
    now = datetime.now(UTC)

    mock_org = MagicMock(spec=Organization)
    mock_org.id = org_id
    mock_org.owner_id = owner_id
    mock_org.name = "Test Salon"
    mock_org.status = OrganizationStatus.APPROVED
    mock_org.description = "Test Description"
    mock_org.picture = None
    mock_org.created_at = now

    mock_owner = MagicMock(spec=User)
    mock_owner.id = owner_id
    mock_owner.email = "owner@test.com"
    mock_owner.role = UserRole.ORG_OWNER
    mock_owner.status = UserStatus.ACTIVE
    mock_owner.created_at = now
    mock_profile = MagicMock(spec=Profile)
    mock_profile.first_name = "Jane"
    mock_profile.last_name = "Owner"
    mock_profile.phone = "+1 555-0123"
    mock_profile.picture = None
    mock_owner.profile = mock_profile

    mock_account = MagicMock(spec=OrgAccount)
    mock_account.id = uuid.uuid4()
    mock_account.merchant_id = "M_TEST_456"
    mock_account.merchant_email = "paypal@test.com"
    mock_account.display_name = "Test PayPal"
    mock_account.currency = "USD"
    mock_account.status = "approved"
    mock_account.approved_at = now
    mock_account.created_at = now

    mock_settings = MagicMock(spec=OrgSettings)
    mock_settings.physical_address = "456 Main St"
    mock_settings.timezone = "America/New_York"
    mock_settings.lat = Decimal("40.7")
    mock_settings.lng = Decimal("-74.0")
    mock_settings.working_hours = {"mon": [["09:00", "17:00"]]}

    mock_policy = MagicMock(spec=OrgCancellationPolicy)
    mock_policy.name = "Standard"
    mock_policy.status = OrgCancellationPolicyStatus.ACTIVE
    mock_policy.data = {"free_cancel_hours": 24, "no_show_fee_percent": 50}

    mock_category = MagicMock(spec=ServiceCategory)
    mock_category.name = "Hair"

    mock_service = MagicMock(spec=Service)
    mock_service.id = uuid.uuid4()
    mock_service.name = "Wash & Cut"
    mock_service.category = mock_category
    mock_service.base_price = Decimal("50.00")
    mock_service.duration_minutes = 30
    mock_service.status = ServiceStatus.ACTIVE
    mock_service.simultaneous_capacity = 1

    mock_db = AsyncMock()
    mock_db.get = AsyncMock(return_value=mock_org)

    # Sequence of db.execute calls:
    # 1. owner_stmt -> mock_owner
    # 2. pp_stmt -> mock_account
    # 3. settings_stmt -> mock_settings
    # 4. policy_stmt -> mock_policy
    # 5. svc_stmt -> [mock_service]
    # 6. staff_stmt -> [mock_owner]
    res_owner = MagicMock()
    res_owner.scalar_one_or_none.return_value = mock_owner

    res_pp = MagicMock()
    res_pp.scalars.return_value.first.return_value = mock_account

    res_settings = MagicMock()
    res_settings.scalar_one_or_none.return_value = mock_settings

    res_policy = MagicMock()
    res_policy.scalar_one_or_none.return_value = mock_policy

    res_svc = MagicMock()
    res_svc.scalars.return_value.all.return_value = [mock_service]

    res_staff = MagicMock()
    res_staff.scalars.return_value.all.return_value = [mock_owner]

    res_feedback = MagicMock()
    res_feedback.one.return_value = (4.8, 10)

    mock_db.execute = AsyncMock(
        side_effect=[res_owner, res_pp, res_settings, res_policy, res_svc, res_staff, res_feedback]
    )

    app.dependency_overrides[get_current_user] = lambda: admin_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(f"/api/v1/admin/organizations/{org_id}")
        assert resp.status_code == 200
        data = resp.json()
        payload = data["data"]
        assert payload["id"] == str(org_id)
        assert payload["name"] == "Test Salon"
        assert payload["owner"]["first_name"] == "Jane"
        assert payload["paypal_account"]["merchant_id"] == "M_TEST_456"
        assert payload["physical_address"] == "456 Main St"
        assert payload["services_count"] == 1
        assert payload["services"][0]["name"] == "Wash & Cut"


@pytest.mark.asyncio
async def test_get_admin_organization_detail_404():
    app = create_app()

    admin_user = MagicMock(spec=User)
    admin_user.id = uuid.uuid4()
    admin_user.role = UserRole.PLATFORM_ADMIN
    admin_user.status = UserStatus.ACTIVE

    mock_db = AsyncMock()
    mock_db.get = AsyncMock(return_value=None)

    app.dependency_overrides[get_current_user] = lambda: admin_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(f"/api/v1/admin/organizations/{uuid.uuid4()}")
        assert resp.status_code == 404
