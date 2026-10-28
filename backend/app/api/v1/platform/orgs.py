from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, PlatformAdmin, PlatformAdminOnly
from app.core.pagination import paginate_query
from app.models.enums import (
    OrganizationStatus,
    OrgCancellationPolicyStatus,
)
from app.models.organization import Organization, OrgSettings
from app.models.payment import OrgAccount
from app.models.policy import OrgCancellationPolicy
from app.models.service import Service
from app.models.user import User
from app.schemas.common import PageOut
from app.schemas.organization import (
    AdminOrganizationDetailOut,
    AdminOrgOwnerOut,
    AdminOrgPaypalOut,
    AdminOrgServiceItem,
    AdminOrgStaffItem,
    CatalogCancellationPolicyOut,
    OrganizationOut,
)
from app.services import feedback_service

router = APIRouter(prefix="/admin", tags=["platform"])


@router.get("/organizations", response_model=PageOut[OrganizationOut])
async def list_organizations(
    user: PlatformAdmin,
    db: DbSession,
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    q: str | None = Query(default=None, description="Search query"),
    status_filter: str | None = Query(default=None, alias="status"),
) -> PageOut[OrganizationOut]:
    _ = user
    stmt = select(Organization)
    if status_filter:
        try:
            stmt = stmt.where(Organization.status == OrganizationStatus(status_filter))
        except ValueError as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid status") from exc
    if q and q.strip():
        term = f"%{q.strip()}%"
        stmt = stmt.where(Organization.name.ilike(term) | Organization.description.ilike(term))
    stmt = stmt.order_by(Organization.created_at.desc())
    return await paginate_query(db, stmt, page=page, page_size=page_size, schema=OrganizationOut)


@router.get("/salons/pending", response_model=PageOut[OrganizationOut])
async def list_pending_salons(
    user: PlatformAdmin,
    db: DbSession,
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    q: str | None = Query(default=None, description="Search query"),
) -> PageOut[OrganizationOut]:
    _ = user
    stmt = select(Organization).where(Organization.status == OrganizationStatus.PENDING)
    if q and q.strip():
        term = f"%{q.strip()}%"
        stmt = stmt.where(Organization.name.ilike(term) | Organization.description.ilike(term))
    stmt = stmt.order_by(Organization.created_at)
    return await paginate_query(db, stmt, page=page, page_size=page_size, schema=OrganizationOut)


@router.get("/organizations/{org_id}", response_model=AdminOrganizationDetailOut)
async def get_organization_detail(
    org_id: UUID,
    user: PlatformAdmin,
    db: DbSession,
) -> AdminOrganizationDetailOut:
    _ = user
    org = await db.get(Organization, org_id)
    if org is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Organization not found")

    # 1. Owner Profile
    owner_stmt = select(User).options(selectinload(User.profile)).where(User.id == org.owner_id)
    owner_user = (await db.execute(owner_stmt)).scalar_one_or_none()
    owner_out = None
    if owner_user:
        profile = owner_user.profile
        owner_out = AdminOrgOwnerOut(
            id=owner_user.id,
            email=str(owner_user.email),
            first_name=profile.first_name if profile else None,
            last_name=profile.last_name if profile else None,
            phone=profile.phone if profile else None,
            status=owner_user.status.value
            if hasattr(owner_user.status, "value")
            else str(owner_user.status),
            role=owner_user.role.value
            if hasattr(owner_user.role, "value")
            else str(owner_user.role),
            created_at=owner_user.created_at,
        )

    # 2. PayPal Account
    pp_stmt = (
        select(OrgAccount).where(OrgAccount.org_id == org_id).order_by(OrgAccount.created_at.desc())
    )
    pp_account = (await db.execute(pp_stmt)).scalars().first()
    paypal_out = None
    if pp_account:
        paypal_out = AdminOrgPaypalOut(
            id=pp_account.id,
            merchant_id=pp_account.merchant_id,
            merchant_email=pp_account.merchant_email,
            display_name=pp_account.display_name,
            currency=pp_account.currency,
            status=pp_account.status.value
            if hasattr(pp_account.status, "value")
            else str(pp_account.status),
            approved_at=pp_account.approved_at,
            created_at=pp_account.created_at,
        )

    # 3. Settings & Location
    settings_stmt = select(OrgSettings).where(OrgSettings.org_id == org_id)
    settings = (await db.execute(settings_stmt)).scalar_one_or_none()

    # 4. Cancellation Policy
    policy_stmt = select(OrgCancellationPolicy).where(
        OrgCancellationPolicy.org_id == org_id,
        OrgCancellationPolicy.status == OrgCancellationPolicyStatus.ACTIVE,
    )
    policy = (await db.execute(policy_stmt)).scalar_one_or_none()
    policy_data = dict(policy.data or {}) if policy is not None else {}
    cancellation_policy = CatalogCancellationPolicyOut(
        org_id=org_id,
        name=policy.name if policy is not None else "Standard Default Policy",
        free_cancel_hours=float(policy_data.get("free_cancel_hours", 24)),
        no_show_fee_percent=float(policy_data.get("no_show_fee_percent", 50)),
        late_cancel_fee_percent=(
            float(policy_data["late_cancel_fee_percent"])
            if policy_data.get("late_cancel_fee_percent") is not None
            else None
        ),
        data=policy_data,
    )

    # 5. Services List
    svc_stmt = (
        select(Service)
        .options(selectinload(Service.category))
        .where(Service.organization_id == org_id)
        .order_by(Service.name)
    )
    services_list = (await db.execute(svc_stmt)).scalars().all()
    services_out = [
        AdminOrgServiceItem(
            id=s.id,
            name=s.name,
            category_name=s.category.name if s.category else None,
            base_price=s.base_price,
            duration_minutes=s.duration_minutes,
            status=s.status.value if hasattr(s.status, "value") else str(s.status),
            simultaneous_capacity=s.simultaneous_capacity,
        )
        for s in services_list
    ]

    # 6. Staff List
    staff_stmt = (
        select(User)
        .options(selectinload(User.profile))
        .where(User.org_id == org_id)
        .order_by(User.created_at)
    )
    staff_list = (await db.execute(staff_stmt)).scalars().all()
    staff_out = [
        AdminOrgStaffItem(
            id=u.id,
            first_name=u.profile.first_name if u.profile else "",
            last_name=u.profile.last_name if u.profile else "",
            email=str(u.email),
            role=u.role.value if hasattr(u.role, "value") else str(u.role),
            picture=u.profile.picture if u.profile else None,
            phone=u.profile.phone if u.profile else None,
        )
        for u in staff_list
    ]

    # 7. Feedback summary
    rating_avg, review_count = await feedback_service.org_feedback_summary(db, org.id)

    return AdminOrganizationDetailOut(
        id=org.id,
        owner_id=org.owner_id,
        name=org.name,
        status=org.status.value if hasattr(org.status, "value") else str(org.status),
        description=org.description,
        picture=org.picture,
        created_at=org.created_at,
        owner=owner_out,
        paypal_account=paypal_out,
        physical_address=settings.physical_address if settings else None,
        timezone=settings.timezone if settings else None,
        lat=settings.lat if settings else None,
        lng=settings.lng if settings else None,
        working_hours=settings.working_hours if settings else None,
        cancellation_policy=cancellation_policy,
        rating_avg=rating_avg,
        review_count=review_count,
        services_count=len(services_out),
        staff_count=len(staff_out),
        services=services_out,
        staff=staff_out,
    )


@router.post("/organizations/{org_id}/approve", response_model=OrganizationOut)
async def approve_organization(
    org_id: UUID, user: PlatformAdminOnly, db: DbSession
) -> OrganizationOut:
    _ = user
    org = await db.get(Organization, org_id)
    if org is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Organization not found")
    org.status = OrganizationStatus.APPROVED
    await db.flush()
    return OrganizationOut.model_validate(org)


@router.post("/organizations/{org_id}/suspend", response_model=OrganizationOut)
async def suspend_organization(
    org_id: UUID, user: PlatformAdminOnly, db: DbSession
) -> OrganizationOut:
    _ = user
    org = await db.get(Organization, org_id)
    if org is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Organization not found")
    org.status = OrganizationStatus.SUSPENDED
    await db.flush()
    return OrganizationOut.model_validate(org)
