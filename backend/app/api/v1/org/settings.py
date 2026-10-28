from datetime import UTC, datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, OrgMember, OrgOwner
from app.models.organization import (
    OrgEmployeeShift,
    OrgEmployeeTimeOff,
    OrgSettings,
    OrgShift,
)
from app.models.user import User
from app.schemas.common import MessageOut
from app.schemas.organization import (
    OrganizationOut,
    OrganizationUpdate,
    OrgEmployeeShiftCreate,
    OrgEmployeeShiftOut,
    OrgEmployeeShiftUpdate,
    OrgEmployeeTimeOffCreate,
    OrgEmployeeTimeOffOut,
    OrgSettingsOut,
    OrgSettingsUpdate,
    OrgShiftCreate,
    OrgShiftOut,
    OrgShiftUpdate,
)
from app.services.org_service import get_org_for_member as _get_my_org
from app.services.storage_service import StorageUnavailableError, storage_service

router = APIRouter(prefix="/organizations", tags=["org"])


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


@router.post("/me/logo", response_model=OrganizationOut)
async def upload_my_organization_logo(
    file: UploadFile = File(...),
    user: OrgOwner = None,
    db: DbSession = None,
) -> OrganizationOut:
    org = await _get_my_org(db, user)
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Uploaded file must be an image")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Image exceeds 10MB limit")
    try:
        _key, url = await storage_service.async_upload_bytes(
            data=data,
            filename=file.filename or "logo.jpg",
            content_type=file.content_type,
            folder="logos",
        )
    except StorageUnavailableError as exc:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, detail="File storage is unavailable"
        ) from exc
    org.picture = url
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


@router.get("/me/employee-shifts", response_model=list[OrgEmployeeShiftOut])
async def list_employee_shifts(user: OrgMember, db: DbSession) -> list[OrgEmployeeShiftOut]:
    stmt = (
        select(OrgEmployeeShift, User, OrgShift)
        .join(User, User.id == OrgEmployeeShift.user_id)
        .join(OrgShift, OrgShift.id == OrgEmployeeShift.org_shift_id)
        .options(selectinload(User.profile))
        .where(OrgShift.org_id == user.org_id)
        .order_by(OrgEmployeeShift.created_at.desc())
    )
    result = await db.execute(stmt)
    items: list[OrgEmployeeShiftOut] = []
    for es, emp, shift in result.all():
        name = None
        if hasattr(emp, "profile") and emp.profile:
            name = f"{emp.profile.first_name} {emp.profile.last_name}".strip()
        items.append(
            OrgEmployeeShiftOut(
                id=es.id,
                user_id=es.user_id,
                org_shift_id=es.org_shift_id,
                days=es.days or ["monday", "tuesday", "wednesday", "thursday", "friday"],
                created_at=es.created_at,
                employee_name=name or emp.email,
                employee_email=emp.email,
                shift_name=shift.name,
                shift_data=shift.data,
            )
        )
    return items


@router.post(
    "/me/employee-shifts",
    response_model=OrgEmployeeShiftOut,
    status_code=status.HTTP_201_CREATED,
)
async def assign_employee_shift(
    body: OrgEmployeeShiftCreate, user: OrgOwner, db: DbSession
) -> OrgEmployeeShiftOut:
    stmt = select(User).options(selectinload(User.profile)).where(User.id == body.user_id)
    emp = (await db.execute(stmt)).scalar_one_or_none()
    shift = await db.get(OrgShift, body.org_shift_id)
    if emp is None or emp.org_id != user.org_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Employee not found")
    if shift is None or shift.org_id != user.org_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Shift not found")

    assigned_days = body.days or ["monday", "tuesday", "wednesday", "thursday", "friday"]

    existing_stmt = select(OrgEmployeeShift).where(
        OrgEmployeeShift.user_id == body.user_id,
        OrgEmployeeShift.org_shift_id == body.org_shift_id,
    )
    existing = (await db.execute(existing_stmt)).scalar_one_or_none()
    emp_name = (
        f"{emp.profile.first_name} {emp.profile.last_name}".strip()
        if hasattr(emp, "profile") and emp.profile
        else emp.email
    )

    if existing:
        existing.days = assigned_days
        await db.flush()
        return OrgEmployeeShiftOut(
            id=existing.id,
            user_id=existing.user_id,
            org_shift_id=existing.org_shift_id,
            days=existing.days,
            created_at=existing.created_at,
            employee_name=emp_name,
            employee_email=emp.email,
            shift_name=shift.name,
            shift_data=shift.data,
        )

    row = OrgEmployeeShift(
        user_id=body.user_id,
        org_shift_id=body.org_shift_id,
        days=assigned_days,
    )
    db.add(row)
    await db.flush()
    return OrgEmployeeShiftOut(
        id=row.id,
        user_id=row.user_id,
        org_shift_id=row.org_shift_id,
        days=row.days,
        created_at=row.created_at,
        employee_name=emp_name,
        employee_email=emp.email,
        shift_name=shift.name,
        shift_data=shift.data,
    )


@router.patch("/me/employee-shifts/{assignment_id}", response_model=OrgEmployeeShiftOut)
async def update_employee_shift(
    assignment_id: UUID,
    body: OrgEmployeeShiftUpdate,
    user: OrgOwner,
    db: DbSession,
) -> OrgEmployeeShiftOut:
    stmt = (
        select(OrgEmployeeShift, User, OrgShift)
        .join(User, User.id == OrgEmployeeShift.user_id)
        .join(OrgShift, OrgShift.id == OrgEmployeeShift.org_shift_id)
        .options(selectinload(User.profile))
        .where(OrgEmployeeShift.id == assignment_id, OrgShift.org_id == user.org_id)
    )
    result = await db.execute(stmt)
    row = result.first()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Shift assignment not found")
    assignment, emp, shift = row

    if body.org_shift_id is not None:
        new_shift = await db.get(OrgShift, body.org_shift_id)
        if new_shift is None or new_shift.org_id != user.org_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Shift not found")
        assignment.org_shift_id = body.org_shift_id
        shift = new_shift

    if body.days is not None:
        assignment.days = body.days

    await db.flush()
    emp_name = (
        f"{emp.profile.first_name} {emp.profile.last_name}".strip()
        if hasattr(emp, "profile") and emp.profile
        else emp.email
    )
    return OrgEmployeeShiftOut(
        id=assignment.id,
        user_id=assignment.user_id,
        org_shift_id=assignment.org_shift_id,
        days=assignment.days or ["monday", "tuesday", "wednesday", "thursday", "friday"],
        created_at=assignment.created_at,
        employee_name=emp_name,
        employee_email=emp.email,
        shift_name=shift.name,
        shift_data=shift.data,
    )


@router.delete("/me/employee-shifts/{assignment_id}", response_model=MessageOut)
async def delete_employee_shift(assignment_id: UUID, user: OrgOwner, db: DbSession) -> MessageOut:
    stmt = (
        select(OrgEmployeeShift)
        .join(OrgShift, OrgShift.id == OrgEmployeeShift.org_shift_id)
        .where(OrgEmployeeShift.id == assignment_id, OrgShift.org_id == user.org_id)
    )
    result = await db.execute(stmt)
    assignment = result.scalar_one_or_none()
    if assignment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Shift assignment not found")
    await db.delete(assignment)
    await db.flush()
    return MessageOut(detail="Shift assignment removed")


# --- Time Off & Day-Off Logic ---


@router.get("/me/time-off", response_model=list[OrgEmployeeTimeOffOut])
async def list_employee_time_off(
    user: OrgMember,
    db: DbSession,
    user_id: UUID | None = Query(default=None),
) -> list[OrgEmployeeTimeOffOut]:
    stmt = (
        select(OrgEmployeeTimeOff, User)
        .join(User, User.id == OrgEmployeeTimeOff.user_id)
        .options(selectinload(User.profile))
        .where(OrgEmployeeTimeOff.org_id == user.org_id)
        .order_by(OrgEmployeeTimeOff.start_date.desc())
    )
    if user_id:
        stmt = stmt.where(OrgEmployeeTimeOff.user_id == user_id)
    result = await db.execute(stmt)
    items = []
    for to, emp in result.all():
        emp_name = (
            f"{emp.profile.first_name} {emp.profile.last_name}".strip()
            if emp.profile
            else emp.email
        )
        items.append(
            OrgEmployeeTimeOffOut(
                id=to.id,
                org_id=to.org_id,
                user_id=to.user_id,
                start_date=to.start_date,
                end_date=to.end_date,
                reason=to.reason,
                created_at=to.created_at,
                employee_name=emp_name,
                employee_email=emp.email,
            )
        )
    return items


@router.post(
    "/me/time-off",
    response_model=OrgEmployeeTimeOffOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_employee_time_off(
    body: OrgEmployeeTimeOffCreate,
    user: OrgMember,
    db: DbSession,
) -> OrgEmployeeTimeOffOut:
    emp = await db.get(User, body.user_id)
    if emp is None or emp.org_id != user.org_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Employee not found")
    if body.start_date > body.end_date:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="start_date must be on or before end_date"
        )
    to = OrgEmployeeTimeOff(
        id=uuid4(),
        org_id=user.org_id,
        user_id=body.user_id,
        start_date=body.start_date,
        end_date=body.end_date,
        reason=body.reason,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    db.add(to)
    await db.flush()
    stmt = select(User).options(selectinload(User.profile)).where(User.id == body.user_id)
    emp = (await db.execute(stmt)).scalar_one()
    emp_name = (
        f"{emp.profile.first_name} {emp.profile.last_name}".strip() if emp.profile else emp.email
    )
    return OrgEmployeeTimeOffOut(
        id=to.id,
        org_id=to.org_id,
        user_id=to.user_id,
        start_date=to.start_date,
        end_date=to.end_date,
        reason=to.reason,
        created_at=to.created_at,
        employee_name=emp_name,
        employee_email=emp.email,
    )


@router.delete("/me/time-off/{time_off_id}", response_model=MessageOut)
async def delete_employee_time_off(
    time_off_id: UUID,
    user: OrgMember,
    db: DbSession,
) -> MessageOut:
    to = await db.get(OrgEmployeeTimeOff, time_off_id)
    if to is None or to.org_id != user.org_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Time off record not found")
    await db.delete(to)
    await db.flush()
    return MessageOut(detail="Time off removed")
