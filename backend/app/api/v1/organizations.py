from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, OrgMember, OrgOwner
from app.core.exceptions import ForbiddenError
from app.core.security import hash_password
from app.models.enums import (
    ServiceStatus,
    UserRole,
    UserStatus,
)
from app.models.organization import (
    OrgAccount,
    Organization,
    OrgCancellationPolicy,
    OrgEmployeeShift,
    OrgSettings,
    OrgShift,
)
from app.models.service import Service, ServiceGiving
from app.models.user import Profile, User
from app.schemas.booking import BookingOut
from app.schemas.common import MessageOut
from app.schemas.organization import (
    CancellationPolicyOut,
    ChangeRequestCreate,
    ChangeRequestOut,
    OrgAccountOut,
    OrganizationOut,
    OrganizationUpdate,
    OrgEmployeeShiftCreate,
    OrgEmployeeShiftOut,
    OrgSettingsOut,
    OrgSettingsUpdate,
    OrgShiftCreate,
    OrgShiftOut,
    OrgShiftUpdate,
)
from app.schemas.service import (
    ServiceCreate,
    ServiceGivingCreate,
    ServiceGivingOut,
    ServiceOut,
    ServiceUpdate,
)
from app.schemas.user import EmployeeCreate, UserOut
from app.services import booking_service, change_request_service

router = APIRouter(prefix="/organizations", tags=["organizations"])


async def _get_my_org(db, user: User) -> Organization:
    assert user.org_id is not None
    org = await db.get(Organization, user.org_id)
    if org is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return org


@router.get("/me", response_model=OrganizationOut)
async def get_my_organization(user: OrgMember, db: DbSession) -> OrganizationOut:
    org = await _get_my_org(db, user)
    return OrganizationOut.model_validate(org)


@router.patch("/me", response_model=OrganizationOut)
async def update_my_organization(
    body: OrganizationUpdate, user: OrgOwner, db: DbSession
) -> OrganizationOut:
    org = await _get_my_org(db, user)
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(org, key, value)
    await db.flush()
    return OrganizationOut.model_validate(org)


@router.get("/me/settings", response_model=OrgSettingsOut)
async def get_settings(user: OrgMember, db: DbSession) -> OrgSettingsOut:
    result = await db.execute(select(OrgSettings).where(OrgSettings.org_id == user.org_id))
    settings = result.scalar_one_or_none()
    if settings is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Settings not found")
    return OrgSettingsOut.model_validate(settings)


@router.put("/me/settings", response_model=OrgSettingsOut)
async def put_settings(body: OrgSettingsUpdate, user: OrgOwner, db: DbSession) -> OrgSettingsOut:
    result = await db.execute(select(OrgSettings).where(OrgSettings.org_id == user.org_id))
    settings = result.scalar_one_or_none()
    if settings is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Settings not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(settings, key, value)
    await db.flush()
    return OrgSettingsOut.model_validate(settings)


# --- Employees ---


@router.get("/me/employees", response_model=list[UserOut])
async def list_employees(user: OrgMember, db: DbSession) -> list[UserOut]:
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(
            User.org_id == user.org_id,
            User.role.in_([UserRole.RECEPTION, UserRole.STYLIST, UserRole.ORG_OWNER]),
        )
        .order_by(User.created_at)
    )
    return [UserOut.model_validate(u) for u in result.scalars().all()]


@router.post(
    "/me/employees",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_employee(body: EmployeeCreate, user: OrgOwner, db: DbSession) -> UserOut:
    if body.role not in {UserRole.RECEPTION.value, UserRole.STYLIST.value}:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="role must be reception or stylist",
        )
    existing = await db.execute(select(User).where(User.email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Email already registered")

    employee = User(
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        role=UserRole(body.role),
        status=UserStatus.ACTIVE,
        org_id=user.org_id,
    )
    db.add(employee)
    await db.flush()
    db.add(
        Profile(
            user_id=employee.id,
            first_name=body.first_name,
            last_name=body.last_name,
            middle_name=body.middle_name,
            phone=body.phone,
        )
    )
    await db.flush()
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == employee.id)
    )
    return UserOut.model_validate(result.scalar_one())


@router.delete("/me/employees/{employee_id}", response_model=MessageOut)
async def remove_employee(employee_id: UUID, user: OrgOwner, db: DbSession) -> MessageOut:
    result = await db.execute(
        select(User).where(User.id == employee_id, User.org_id == user.org_id)
    )
    employee = result.scalar_one_or_none()
    if employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Employee not found")
    if employee.role == UserRole.ORG_OWNER:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Cannot remove organization owner")
    employee.status = UserStatus.INACTIVE
    await db.flush()
    return MessageOut(detail="Employee deactivated")


# --- Shifts ---


@router.get("/me/shifts", response_model=list[OrgShiftOut])
async def list_shifts(user: OrgMember, db: DbSession) -> list[OrgShiftOut]:
    result = await db.execute(
        select(OrgShift).where(OrgShift.org_id == user.org_id).order_by(OrgShift.name)
    )
    return [OrgShiftOut.model_validate(s) for s in result.scalars().all()]


@router.post("/me/shifts", response_model=OrgShiftOut, status_code=status.HTTP_201_CREATED)
async def create_shift(body: OrgShiftCreate, user: OrgOwner, db: DbSession) -> OrgShiftOut:
    shift = OrgShift(org_id=user.org_id, name=body.name, data=body.data)
    db.add(shift)
    await db.flush()
    return OrgShiftOut.model_validate(shift)


@router.patch("/me/shifts/{shift_id}", response_model=OrgShiftOut)
async def update_shift(
    shift_id: UUID, body: OrgShiftUpdate, user: OrgOwner, db: DbSession
) -> OrgShiftOut:
    result = await db.execute(
        select(OrgShift).where(OrgShift.id == shift_id, OrgShift.org_id == user.org_id)
    )
    shift = result.scalar_one_or_none()
    if shift is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Shift not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(shift, key, value)
    await db.flush()
    return OrgShiftOut.model_validate(shift)


@router.delete("/me/shifts/{shift_id}", response_model=MessageOut)
async def delete_shift(shift_id: UUID, user: OrgOwner, db: DbSession) -> MessageOut:
    result = await db.execute(
        select(OrgShift).where(OrgShift.id == shift_id, OrgShift.org_id == user.org_id)
    )
    shift = result.scalar_one_or_none()
    if shift is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Shift not found")
    await db.delete(shift)
    await db.flush()
    return MessageOut(detail="Shift deleted")


@router.post(
    "/me/employee-shifts",
    response_model=OrgEmployeeShiftOut,
    status_code=status.HTTP_201_CREATED,
)
async def assign_employee_shift(
    body: OrgEmployeeShiftCreate, user: OrgOwner, db: DbSession
) -> OrgEmployeeShiftOut:
    emp = await db.get(User, body.user_id)
    shift = await db.get(OrgShift, body.org_shift_id)
    if emp is None or emp.org_id != user.org_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Employee not found")
    if shift is None or shift.org_id != user.org_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Shift not found")
    row = OrgEmployeeShift(user_id=body.user_id, org_shift_id=body.org_shift_id)
    db.add(row)
    await db.flush()
    return OrgEmployeeShiftOut.model_validate(row)


# --- Services ---


@router.get("/me/services", response_model=list[ServiceOut])
async def list_org_services(user: OrgMember, db: DbSession) -> list[ServiceOut]:
    result = await db.execute(
        select(Service).where(Service.organization_id == user.org_id).order_by(Service.name)
    )
    return [ServiceOut.model_validate(s) for s in result.scalars().all()]


@router.post(
    "/me/services",
    response_model=ServiceOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_org_service(body: ServiceCreate, user: OrgOwner, db: DbSession) -> ServiceOut:
    service = Service(
        service_category_id=body.service_category_id,
        organization_id=user.org_id,
        name=body.name,
        description=body.description,
        images=body.images,
        base_price=body.base_price,
        duration_minutes=body.duration_minutes,
        status=ServiceStatus.ACTIVE,
        cancellation_policy_id=body.cancellation_policy_id,
        simultaneous_capacity=body.simultaneous_capacity,
    )
    db.add(service)
    await db.flush()
    return ServiceOut.model_validate(service)


@router.patch("/me/services/{service_id}", response_model=ServiceOut)
async def update_org_service(
    service_id: UUID, body: ServiceUpdate, user: OrgOwner, db: DbSession
) -> ServiceOut:
    result = await db.execute(
        select(Service).where(Service.id == service_id, Service.organization_id == user.org_id)
    )
    service = result.scalar_one_or_none()
    if service is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Service not found")
    data = body.model_dump(exclude_unset=True)
    if "status" in data and data["status"] is not None:
        try:
            data["status"] = ServiceStatus(data["status"])
        except ValueError as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid status") from exc
    for key, value in data.items():
        setattr(service, key, value)
    await db.flush()
    return ServiceOut.model_validate(service)


@router.post(
    "/me/services/{service_id}/givers",
    response_model=ServiceGivingOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_service_giver(
    service_id: UUID,
    body: ServiceGivingCreate,
    user: OrgOwner,
    db: DbSession,
) -> ServiceGivingOut:
    result = await db.execute(
        select(Service).where(Service.id == service_id, Service.organization_id == user.org_id)
    )
    service = result.scalar_one_or_none()
    if service is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Service not found")
    emp = await db.get(User, body.user_id)
    if emp is None or emp.org_id != user.org_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Employee not found")
    row = ServiceGiving(service_id=service_id, user_id=body.user_id)
    db.add(row)
    await db.flush()
    return ServiceGivingOut.model_validate(row)


# --- Policies / account / change requests ---


@router.get("/me/cancellation-policies", response_model=list[CancellationPolicyOut])
async def list_policies(user: OrgMember, db: DbSession) -> list[CancellationPolicyOut]:
    result = await db.execute(
        select(OrgCancellationPolicy)
        .where(OrgCancellationPolicy.org_id == user.org_id)
        .order_by(OrgCancellationPolicy.created_at.desc())
    )
    return [CancellationPolicyOut.model_validate(p) for p in result.scalars().all()]


@router.get("/me/account", response_model=OrgAccountOut | None)
async def get_account(user: OrgMember, db: DbSession) -> OrgAccountOut | None:
    result = await db.execute(
        select(OrgAccount)
        .where(OrgAccount.org_id == user.org_id)
        .order_by(OrgAccount.created_at.desc())
        .limit(1)
    )
    account = result.scalar_one_or_none()
    return OrgAccountOut.model_validate(account) if account else None


@router.get("/me/change-requests", response_model=list[ChangeRequestOut])
async def list_change_requests(user: OrgMember, db: DbSession) -> list[ChangeRequestOut]:
    assert user.org_id is not None
    rows = await change_request_service.list_org_change_requests(db, user.org_id)
    return [ChangeRequestOut.model_validate(r) for r in rows]


@router.post(
    "/me/change-requests",
    response_model=ChangeRequestOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_change_request(
    body: ChangeRequestCreate, user: OrgOwner, db: DbSession
) -> ChangeRequestOut:
    assert user.org_id is not None
    try:
        row = await change_request_service.submit_change_request(
            db,
            org_id=user.org_id,
            submitted_by=user.id,
            request_type=body.request_type,
            payload_json=body.payload_json,
            current_snapshot_json=body.current_snapshot_json,
        )
    except ForbiddenError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=exc.message) from exc
    return ChangeRequestOut.model_validate(row)


@router.get("/me/bookings", response_model=list[BookingOut])
async def org_bookings(
    user: OrgMember,
    db: DbSession,
    starts_at: datetime | None = None,
    ends_at: datetime | None = None,
) -> list[BookingOut]:
    assert user.org_id is not None
    rows = await booking_service.list_org_bookings(
        db, user.org_id, starts_at=starts_at, ends_at=ends_at
    )
    return [BookingOut.model_validate(b) for b in rows]
