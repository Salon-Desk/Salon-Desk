import secrets
import string
from uuid import UUID

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, OrgMember, OrgOwner
from app.core.exceptions import ConflictError, NotFoundError, PolicyViolationException
from app.core.pagination import paginate_query
from app.core.security import hash_password
from app.models.organization import Organization
from app.models.user import User
from app.schemas.common import MessageOut, PageOut
from app.schemas.user import EmployeeCategoriesUpdate, EmployeeCategoryOut, EmployeeUpdate, UserOut
from app.services import org_service
from app.services.email_service import (
    send_staff_invite_email,
    send_staff_password_reset_email,
)
from app.services.storage_service import StorageUnavailableError, storage_service

router = APIRouter(prefix="/organizations", tags=["org"])


def _generate_temp_password(length: int = 8) -> str:
    """Generate a clean 8-character temporary password with letters and digits."""
    alphabet = string.ascii_letters + string.digits
    while True:
        pwd = "".join(secrets.choice(alphabet) for _ in range(length))
        if any(c.isalpha() for c in pwd) and any(c.isdigit() for c in pwd):
            return pwd


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
    stmt = org_service.build_employees_query(
        org_id=user.org_id,
        status_filter=status_filter,
        role=role,
        q=q,
    )
    return await paginate_query(db, stmt, page=page, page_size=page_size, schema=UserOut)


@router.post(
    "/me/employees",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_employee(
    email: str = Form(...),
    password: str | None = Form(None),
    first_name: str = Form(...),
    last_name: str = Form(...),
    middle_name: str | None = Form(None),
    phone: str | None = Form(None),
    role: str = Form(...),
    handle: str | None = Form(None),
    category_ids: str | None = Form(None),
    file: UploadFile = File(None),
    user: OrgOwner = None,
    db: DbSession = None,
) -> UserOut:
    picture_url = None
    if file and file.content_type and file.content_type.startswith("image/"):
        data = await file.read()
        if len(data) > 10 * 1024 * 1024:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Image exceeds 10MB limit")
        try:
            _key, picture_url = await storage_service.async_upload_bytes(
                data=data,
                filename=file.filename or "avatar.jpg",
                content_type=file.content_type,
                folder="avatars",
            )
        except StorageUnavailableError as exc:
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE, detail="File storage is unavailable"
            ) from exc

    raw_password = (password or "").strip() or _generate_temp_password(8)

    parsed_category_ids: list[UUID] | None = None
    if category_ids:
        try:
            import json

            raw = json.loads(category_ids)
            if isinstance(raw, list):
                parsed_category_ids = [UUID(str(x)) for x in raw]
            else:
                parsed_category_ids = [UUID(str(category_ids).strip())]
        except Exception:
            parsed_category_ids = [UUID(c.strip()) for c in category_ids.split(",") if c.strip()]

    try:
        employee = await org_service.create_employee(
            db,
            org_id=user.org_id,
            email=email,
            password=raw_password,
            first_name=first_name,
            last_name=last_name,
            role=role,
            middle_name=middle_name,
            phone=phone,
            picture_url=picture_url,
            handle=handle,
            category_ids=parsed_category_ids,
        )
    except ConflictError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=exc.message) from exc
    except PolicyViolationException as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=exc.message) from exc

    org = await db.get(Organization, user.org_id)
    salon_name = org.name if org else None

    await send_staff_invite_email(
        to_address=employee.email,
        first_name=first_name,
        temp_password=raw_password,
        salon_name=salon_name,
        role_name=role,
    )

    return UserOut.model_validate(employee)


@router.get("/me/employees/{employee_id}/categories", response_model=list[EmployeeCategoryOut])
async def get_employee_categories(
    employee_id: UUID,
    user: OrgMember,
    db: DbSession,
) -> list[EmployeeCategoryOut]:
    try:
        categories = await org_service.get_employee_categories(
            db, org_id=user.org_id, employee_id=employee_id
        )
    except NotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=exc.message) from exc
    return [EmployeeCategoryOut.model_validate(c) for c in categories]


@router.put("/me/employees/{employee_id}/categories", response_model=list[EmployeeCategoryOut])
async def update_employee_categories(
    employee_id: UUID,
    body: EmployeeCategoriesUpdate,
    user: OrgOwner,
    db: DbSession,
) -> list[EmployeeCategoryOut]:
    try:
        categories = await org_service.set_employee_categories(
            db, org_id=user.org_id, employee_id=employee_id, category_ids=body.category_ids
        )
    except NotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=exc.message) from exc
    return [EmployeeCategoryOut.model_validate(c) for c in categories]


@router.post("/me/employees/{employee_id}/resend-invite", response_model=MessageOut)
async def resend_employee_invite(
    employee_id: UUID,
    user: OrgOwner,
    db: DbSession,
) -> MessageOut:
    stmt = (
        select(User)
        .options(selectinload(User.profile))
        .where(User.id == employee_id, User.org_id == user.org_id)
    )
    result = await db.execute(stmt)
    employee = result.scalar_one_or_none()
    if employee is None or employee.id == user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Employee not found")

    new_password = _generate_temp_password(8)
    employee.password_hash = hash_password(new_password)
    await db.flush()

    org = await db.get(Organization, user.org_id)
    salon_name = org.name if org else None
    first_name = employee.profile.first_name if employee.profile else "there"

    await send_staff_invite_email(
        to_address=employee.email,
        first_name=first_name,
        temp_password=new_password,
        salon_name=salon_name,
        role_name=employee.role.value if hasattr(employee.role, "value") else str(employee.role),
    )
    return MessageOut(detail="Invitation resent successfully")


@router.post("/me/employees/{employee_id}/reset-password", response_model=MessageOut)
async def reset_employee_password(
    employee_id: UUID,
    user: OrgOwner,
    db: DbSession,
) -> MessageOut:
    stmt = (
        select(User)
        .options(selectinload(User.profile))
        .where(User.id == employee_id, User.org_id == user.org_id)
    )
    result = await db.execute(stmt)
    employee = result.scalar_one_or_none()
    if employee is None or employee.id == user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Employee not found")

    new_password = _generate_temp_password(8)
    employee.password_hash = hash_password(new_password)
    await db.flush()

    org = await db.get(Organization, user.org_id)
    salon_name = org.name if org else None
    first_name = employee.profile.first_name if employee.profile else "there"

    await send_staff_password_reset_email(
        to_address=employee.email,
        first_name=first_name,
        temp_password=new_password,
        salon_name=salon_name,
    )
    return MessageOut(detail="Password reset and emailed to employee")


@router.patch("/me/employees/{employee_id}", response_model=UserOut)
async def update_employee(
    employee_id: UUID,
    body: EmployeeUpdate,
    user: OrgOwner,
    db: DbSession,
) -> UserOut:
    try:
        employee = await org_service.update_employee(
            db,
            org_id=user.org_id,
            employee_id=employee_id,
            body=body,
        )
    except NotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=exc.message) from exc
    except PolicyViolationException as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=exc.message) from exc

    return UserOut.model_validate(employee)


@router.delete("/me/employees/{employee_id}", response_model=MessageOut)
async def remove_employee(employee_id: UUID, user: OrgOwner, db: DbSession) -> MessageOut:
    try:
        await org_service.deactivate_employee(
            db,
            org_id=user.org_id,
            employee_id=employee_id,
        )
    except NotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=exc.message) from exc
    except PolicyViolationException as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=exc.message) from exc

    return MessageOut(detail="Employee deactivated")


@router.post("/me/employees/{employee_id}/avatar", response_model=UserOut)
async def upload_employee_avatar(
    employee_id: UUID,
    file: UploadFile = File(...),
    user: OrgOwner = None,
    db: DbSession = None,
) -> UserOut:
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

    try:
        employee = await org_service.update_employee_avatar(
            db,
            org_id=user.org_id,
            employee_id=employee_id,
            picture_url=url,
        )
    except NotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=exc.message) from exc

    return UserOut.model_validate(employee)
