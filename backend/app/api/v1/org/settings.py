from uuid import UUID

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from sqlalchemy import select

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
from app.services.storage_service import storage_service

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
    _key, url = await storage_service.async_upload_bytes(
        data=data,
        filename=file.filename or "logo.jpg",
        content_type=file.content_type,
        folder="logos",
    )
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
