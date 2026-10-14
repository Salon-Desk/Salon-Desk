from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, PlatformAdmin, PlatformAdminOnly
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.security import hash_password
from app.models.change_request import ChangeRequest
from app.models.enums import (
    ChangeRequestStatus,
    OrganizationStatus,
    UserRole,
    UserStatus,
)
from app.models.ledger import LedgerEntry
from app.models.organization import Organization
from app.models.platform import PlatformCommission
from app.models.service import ServiceCategory
from app.models.user import Profile, User
from app.schemas.common import MessageOut
from app.schemas.organization import (
    ChangeRequestOut,
    ChangeRequestReview,
    OrganizationOut,
)
from app.schemas.platform import (
    AdminDashboardOut,
    PlatformCommissionCreate,
    PlatformCommissionOut,
    PlatformCommissionUpdate,
)
from app.schemas.service import (
    ServiceCategoryCreate,
    ServiceCategoryOut,
    ServiceCategoryUpdate,
)
from app.schemas.user import StaffCreate, UserOut
from app.services import change_request_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=AdminDashboardOut)
async def dashboard(user: PlatformAdmin, db: DbSession) -> AdminDashboardOut:
    _ = user
    total = (await db.execute(select(func.count()).select_from(Organization))).scalar_one()
    pending = (
        await db.execute(
            select(func.count())
            .select_from(Organization)
            .where(Organization.status == OrganizationStatus.PENDING)
        )
    ).scalar_one()
    approved = (
        await db.execute(
            select(func.count())
            .select_from(Organization)
            .where(Organization.status == OrganizationStatus.APPROVED)
        )
    ).scalar_one()
    suspended = (
        await db.execute(
            select(func.count())
            .select_from(Organization)
            .where(Organization.status == OrganizationStatus.SUSPENDED)
        )
    ).scalar_one()
    pending_cr = (
        await db.execute(
            select(func.count())
            .select_from(ChangeRequest)
            .where(ChangeRequest.status == ChangeRequestStatus.PENDING)
        )
    ).scalar_one()
    ledger_count = (await db.execute(select(func.count()).select_from(LedgerEntry))).scalar_one()
    ledger_sum = (
        await db.execute(select(func.coalesce(func.sum(LedgerEntry.amount), 0)))
    ).scalar_one()
    return AdminDashboardOut(
        total_organizations=int(total),
        pending_organizations=int(pending),
        approved_organizations=int(approved),
        suspended_organizations=int(suspended),
        pending_change_requests=int(pending_cr),
        ledger_entry_count=int(ledger_count),
        ledger_amount_sum=Decimal(str(ledger_sum)),
    )


@router.get("/organizations", response_model=list[OrganizationOut])
async def list_organizations(
    user: PlatformAdmin,
    db: DbSession,
    status_filter: str | None = Query(default=None, alias="status"),
) -> list[OrganizationOut]:
    _ = user
    stmt = select(Organization).order_by(Organization.created_at.desc())
    if status_filter:
        try:
            stmt = stmt.where(Organization.status == OrganizationStatus(status_filter))
        except ValueError as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid status") from exc
    result = await db.execute(stmt)
    return [OrganizationOut.model_validate(o) for o in result.scalars().all()]


@router.get("/salons/pending", response_model=list[OrganizationOut])
async def list_pending_salons(user: PlatformAdmin, db: DbSession) -> list[OrganizationOut]:
    _ = user
    result = await db.execute(
        select(Organization)
        .where(Organization.status == OrganizationStatus.PENDING)
        .order_by(Organization.created_at)
    )
    return [OrganizationOut.model_validate(o) for o in result.scalars().all()]


@router.post("/organizations/{org_id}/approve", response_model=OrganizationOut)
async def approve_organization(org_id: UUID, user: PlatformAdmin, db: DbSession) -> OrganizationOut:
    _ = user
    org = await db.get(Organization, org_id)
    if org is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Organization not found")
    org.status = OrganizationStatus.APPROVED
    await db.flush()
    return OrganizationOut.model_validate(org)


@router.post("/organizations/{org_id}/suspend", response_model=OrganizationOut)
async def suspend_organization(org_id: UUID, user: PlatformAdmin, db: DbSession) -> OrganizationOut:
    _ = user
    org = await db.get(Organization, org_id)
    if org is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Organization not found")
    org.status = OrganizationStatus.SUSPENDED
    await db.flush()
    return OrganizationOut.model_validate(org)


# --- Platform staff ---


@router.post("/staff", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register_staff(body: StaffCreate, user: PlatformAdminOnly, db: DbSession) -> UserOut:
    _ = user
    existing = await db.execute(select(User).where(User.email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Email already registered")
    staff = User(
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        role=UserRole.PLATFORM_STAFF,
        status=UserStatus.ACTIVE,
    )
    db.add(staff)
    await db.flush()
    db.add(
        Profile(
            user_id=staff.id,
            first_name=body.first_name,
            last_name=body.last_name,
            middle_name=body.middle_name,
            phone=body.phone,
        )
    )
    await db.flush()
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == staff.id)
    )
    return UserOut.model_validate(result.scalar_one())


@router.delete("/staff/{staff_id}", response_model=MessageOut)
async def remove_staff(staff_id: UUID, user: PlatformAdminOnly, db: DbSession) -> MessageOut:
    _ = user
    staff = await db.get(User, staff_id)
    if staff is None or staff.role != UserRole.PLATFORM_STAFF:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Staff not found")
    staff.status = UserStatus.INACTIVE
    await db.flush()
    return MessageOut(detail="Platform staff deactivated")


# --- Service categories ---


@router.get("/service-categories", response_model=list[ServiceCategoryOut])
async def list_categories(user: PlatformAdmin, db: DbSession) -> list[ServiceCategoryOut]:
    _ = user
    result = await db.execute(select(ServiceCategory).order_by(ServiceCategory.name))
    return [ServiceCategoryOut.model_validate(c) for c in result.scalars().all()]


@router.post(
    "/service-categories",
    response_model=ServiceCategoryOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_category(
    body: ServiceCategoryCreate, user: PlatformAdmin, db: DbSession
) -> ServiceCategoryOut:
    _ = user
    cat = ServiceCategory(name=body.name, description=body.description)
    db.add(cat)
    await db.flush()
    return ServiceCategoryOut.model_validate(cat)


@router.patch("/service-categories/{category_id}", response_model=ServiceCategoryOut)
async def update_category(
    category_id: UUID,
    body: ServiceCategoryUpdate,
    user: PlatformAdmin,
    db: DbSession,
) -> ServiceCategoryOut:
    _ = user
    cat = await db.get(ServiceCategory, category_id)
    if cat is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Category not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(cat, key, value)
    await db.flush()
    return ServiceCategoryOut.model_validate(cat)


# --- Commissions ---


@router.get("/commissions", response_model=list[PlatformCommissionOut])
async def list_commissions(user: PlatformAdmin, db: DbSession) -> list[PlatformCommissionOut]:
    _ = user
    result = await db.execute(
        select(PlatformCommission).order_by(PlatformCommission.created_at.desc())
    )
    return [PlatformCommissionOut.model_validate(c) for c in result.scalars().all()]


@router.post(
    "/commissions",
    response_model=PlatformCommissionOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_commission(
    body: PlatformCommissionCreate, user: PlatformAdmin, db: DbSession
) -> PlatformCommissionOut:
    _ = user
    from app.models.enums import PlatformCommissionType

    try:
        ctype = PlatformCommissionType(body.type)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid type") from exc
    row = PlatformCommission(
        service_category_id=body.service_category_id,
        name=body.name,
        type=ctype,
        percentage=body.percentage,
        flat=body.flat,
    )
    db.add(row)
    await db.flush()
    return PlatformCommissionOut.model_validate(row)


@router.patch("/commissions/{commission_id}", response_model=PlatformCommissionOut)
async def update_commission(
    commission_id: UUID,
    body: PlatformCommissionUpdate,
    user: PlatformAdmin,
    db: DbSession,
) -> PlatformCommissionOut:
    _ = user
    from app.models.enums import PlatformCommissionType

    row = await db.get(PlatformCommission, commission_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Commission not found")
    data = body.model_dump(exclude_unset=True)
    if "type" in data and data["type"] is not None:
        try:
            data["type"] = PlatformCommissionType(data["type"])
        except ValueError as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid type") from exc
    for key, value in data.items():
        setattr(row, key, value)
    await db.flush()
    return PlatformCommissionOut.model_validate(row)


# --- Change requests ---


@router.get("/change-requests", response_model=list[ChangeRequestOut])
async def list_change_requests(
    user: PlatformAdmin,
    db: DbSession,
    status_filter: str | None = Query(default="PENDING", alias="status"),
) -> list[ChangeRequestOut]:
    _ = user
    status_enum: ChangeRequestStatus | None = None
    if status_filter:
        try:
            status_enum = ChangeRequestStatus(status_filter)
        except ValueError as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid status") from exc
    rows = await change_request_service.list_admin_change_requests(db, status_enum)
    return [ChangeRequestOut.model_validate(r) for r in rows]


@router.post("/change-requests/{request_id}/approve", response_model=ChangeRequestOut)
async def approve_change_request(
    request_id: UUID,
    body: ChangeRequestReview,
    user: PlatformAdmin,
    db: DbSession,
) -> ChangeRequestOut:
    try:
        row = await change_request_service.review_change_request(
            db,
            request_id=request_id,
            reviewer_id=user.id,
            approve=True,
            review_notes=body.review_notes,
        )
    except (ForbiddenError, NotFoundError) as exc:
        code = (
            status.HTTP_403_FORBIDDEN
            if isinstance(exc, ForbiddenError)
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(code, detail=exc.message) from exc
    return ChangeRequestOut.model_validate(row)


@router.post("/change-requests/{request_id}/reject", response_model=ChangeRequestOut)
async def reject_change_request(
    request_id: UUID,
    body: ChangeRequestReview,
    user: PlatformAdmin,
    db: DbSession,
) -> ChangeRequestOut:
    try:
        row = await change_request_service.review_change_request(
            db,
            request_id=request_id,
            reviewer_id=user.id,
            approve=False,
            review_notes=body.review_notes,
        )
    except (ForbiddenError, NotFoundError) as exc:
        code = (
            status.HTTP_403_FORBIDDEN
            if isinstance(exc, ForbiddenError)
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(code, detail=exc.message) from exc
    return ChangeRequestOut.model_validate(row)
