from uuid import UUID

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, OrgMember, OrgOwner
from app.core.pagination import paginate_query
from app.core.security import hash_password
from app.models.enums import (
    UserRole,
    UserStatus,
)
from app.models.user import Profile, User
from app.schemas.common import MessageOut, PageOut
from app.schemas.user import EmployeeCreate, EmployeeUpdate, UserOut
from app.services.storage_service import StorageUnavailableError, storage_service

router = APIRouter(prefix="/organizations", tags=["org"])

# --- Employees ---


@router.get("/me/employees", response_model=PageOut[UserOut])
async def list_employees(
    user: OrgMember,
    db: DbSession,
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    q: str | None = Query(default=None, description="Search query"),
    status_filter: str | None = Query(default=None, description="Filter by status"),
    role: str | None = Query(default=None, description="Filter by role"),
) -> PageOut[UserOut]:
    stmt = (
        select(User)
        .options(selectinload(User.profile))
        .where(
            User.org_id == user.org_id,
            User.role.in_([UserRole.RECEPTION, UserRole.STYLIST, UserRole.ORG_OWNER]),
        )
    )
    if status_filter:
        try:
            target_status = UserStatus(status_filter.lower())
            stmt = stmt.where(User.status == target_status)
        except ValueError:
            pass

    if role:
        try:
            target_role = UserRole(role.lower())
            stmt = stmt.where(User.role == target_role)
        except ValueError:
            pass

    if q and q.strip():
        term = f"%{q.strip()}%"
        stmt = stmt.outerjoin(Profile, Profile.user_id == User.id).where(
            User.email.ilike(term)
            | Profile.first_name.ilike(term)
            | Profile.last_name.ilike(term)
            | Profile.phone.ilike(term)
        )

    stmt = stmt.order_by(User.created_at)
    return await paginate_query(db, stmt, page=page, page_size=page_size, schema=UserOut)


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


@router.patch("/me/employees/{employee_id}", response_model=UserOut)
async def update_employee(
    employee_id: UUID,
    body: EmployeeUpdate,
    user: OrgOwner,
    db: DbSession,
) -> UserOut:
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(User.id == employee_id, User.org_id == user.org_id)
    )
    employee = result.scalar_one_or_none()
    if employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Employee not found")

    if body.role is not None:
        if body.role not in {UserRole.RECEPTION.value, UserRole.STYLIST.value}:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="role must be reception or stylist",
            )
        if employee.role == UserRole.ORG_OWNER:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="Cannot change role of organization owner",
            )
        employee.role = UserRole(body.role)

    if employee.profile is None:
        profile = Profile(
            user_id=employee.id,
            first_name=body.first_name or "",
            last_name=body.last_name or "",
            middle_name=body.middle_name,
            phone=body.phone,
            picture=body.picture,
        )
        db.add(profile)
    else:
        if body.first_name is not None:
            employee.profile.first_name = body.first_name
        if body.last_name is not None:
            employee.profile.last_name = body.last_name
        if body.middle_name is not None:
            employee.profile.middle_name = body.middle_name
        if body.phone is not None:
            employee.profile.phone = body.phone
        if body.picture is not None:
            employee.profile.picture = body.picture

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


@router.post("/me/employees/{employee_id}/avatar", response_model=UserOut)
async def upload_employee_avatar(
    employee_id: UUID,
    file: UploadFile = File(...),
    user: OrgOwner = None,
    db: DbSession = None,
) -> UserOut:
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(User.id == employee_id, User.org_id == user.org_id)
    )
    employee = result.scalar_one_or_none()
    if employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Employee not found")
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Uploaded file must be an image")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Image exceeds 10MB limit")
    try:
        _key, url = await storage_service.async_upload_bytes(
            data=data,
            filename=file.filename or "avatar.jpg",
            content_type=file.content_type,
            folder="employee-avatars",
        )
    except StorageUnavailableError as exc:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, detail="File storage is unavailable"
        ) from exc

    if employee.profile is None:
        profile = Profile(
            user_id=employee.id,
            first_name="",
            last_name="",
            picture=url,
        )
        db.add(profile)
    else:
        employee.profile.picture = url

    await db.flush()
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == employee_id)
    )
    return UserOut.model_validate(result.scalar_one())
