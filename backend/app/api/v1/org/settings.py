from uuid import UUID

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, OrgMember, OrgOwner
from app.models.organization import (
    OrgEmployeeShift,
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
        return OrgEmployeeShiftOut(
            id=existing.id,
            user_id=existing.user_id,
            org_shift_id=existing.org_shift_id,
            created_at=existing.created_at,
            employee_name=emp_name,
            employee_email=emp.email,
            shift_name=shift.name,
            shift_data=shift.data,
        )

    row = OrgEmployeeShift(user_id=body.user_id, org_shift_id=body.org_shift_id)
    db.add(row)
    await db.flush()
    return OrgEmployeeShiftOut(
        id=row.id,
        user_id=row.user_id,
        org_shift_id=row.org_shift_id,
        created_at=row.created_at,
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
