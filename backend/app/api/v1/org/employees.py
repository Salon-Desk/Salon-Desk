from uuid import UUID

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile, status

from app.api.deps import DbSession, OrgMember, OrgOwner
from app.core.exceptions import ConflictError, NotFoundError, PolicyViolationException
from app.core.pagination import paginate_query
from app.schemas.common import MessageOut, PageOut
from app.schemas.user import EmployeeUpdate, UserOut
from app.services import org_service
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
    password: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    middle_name: str | None = Form(None),
    phone: str | None = Form(None),
    role: str = Form(...),
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

    try:
        employee = await org_service.create_employee(
            db,
            org_id=user.org_id,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role,
            middle_name=middle_name,
            phone=phone,
            picture_url=picture_url,
        )
    except ConflictError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=exc.message) from exc
    except PolicyViolationException as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=exc.message) from exc

    return UserOut.model_validate(employee)


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
