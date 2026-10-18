from uuid import UUID

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import select

from app.api.deps import DbSession, OrgMember, OrgOwner
from app.core.pagination import paginate_query
from app.models.enums import (
    ServiceStatus,
)
from app.models.service import Service, ServiceGiving
from app.models.user import User
from app.schemas.common import PageOut
from app.schemas.service import (
    ServiceGivingCreate,
    ServiceGivingOut,
    ServiceOut,
    ServiceUpdate,
)
from app.services.storage_service import StorageUnavailableError, storage_service

router = APIRouter(prefix="/organizations", tags=["org"])

# --- Services ---


@router.get("/me/services", response_model=PageOut[ServiceOut])
async def list_org_services(
    user: OrgMember,
    db: DbSession,
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    q: str | None = Query(default=None, description="Search query"),
    category_id: UUID | None = Query(default=None, description="Filter by category"),
    status: ServiceStatus | None = Query(default=None, description="Filter by status"),
) -> PageOut[ServiceOut]:
    stmt = select(Service).where(Service.organization_id == user.org_id)
    if category_id:
        stmt = stmt.where(Service.service_category_id == category_id)
    if status:
        stmt = stmt.where(Service.status == status)
    if q and q.strip():
        term = f"%{q.strip()}%"
        stmt = stmt.where(Service.name.ilike(term) | Service.description.ilike(term))
    stmt = stmt.order_by(Service.name)
    return await paginate_query(db, stmt, page=page, page_size=page_size, schema=ServiceOut)


@router.post(
    "/me/services",
    response_model=ServiceOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_org_service(
    service_category_id: str = Form(...),
    name: str = Form(...),
    description: str | None = Form(None),
    base_price: float = Form(...),
    duration_minutes: int = Form(...),
    simultaneous_capacity: int = Form(...),
    cancellation_policy_id: str | None = Form(None),
    file: UploadFile = File(None),
    user: OrgOwner = None,
    db: DbSession = None,
) -> ServiceOut:
    # Handle cover image upload if provided
    image_url = None
    if file and file.content_type and file.content_type.startswith("image/"):
        data = await file.read()
        if len(data) > 10 * 1024 * 1024:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Image exceeds 10MB limit")
        try:
            _key, image_url = await storage_service.async_upload_bytes(
                data=data,
                filename=file.filename or "service-cover.jpg",
                content_type=file.content_type,
                folder="services",
            )
        except StorageUnavailableError as exc:
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE, detail="File storage is unavailable"
            ) from exc

    images = {"cover": image_url} if image_url else {}

    service = Service(
        service_category_id=service_category_id,
        organization_id=user.org_id,
        name=name,
        description=description,
        images=images,
        base_price=base_price,
        duration_minutes=duration_minutes,
        status=ServiceStatus.ACTIVE,
        cancellation_policy_id=cancellation_policy_id,
        simultaneous_capacity=simultaneous_capacity,
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


@router.post("/me/services/{service_id}/images", response_model=ServiceOut)
async def upload_service_image(
    service_id: UUID,
    file: UploadFile = File(...),
    user: OrgOwner = None,
    db: DbSession = None,
) -> ServiceOut:
    """Upload a cover image for a service."""
    result = await db.execute(
        select(Service).where(Service.id == service_id, Service.organization_id == user.org_id)
    )
    service = result.scalar_one_or_none()
    if service is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Service not found")
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Uploaded file must be an image")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Image exceeds 10MB limit")
    try:
        _key, url = await storage_service.async_upload_bytes(
            data=data,
            filename=file.filename or "service-cover.jpg",
            content_type=file.content_type,
            folder="services",
        )
    except StorageUnavailableError as exc:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, detail="File storage is unavailable"
        ) from exc
    # Update the cover image in the images dict
    if not isinstance(service.images, dict):
        service.images = {}
    service.images["cover"] = url
    await db.flush()
    return ServiceOut.model_validate(service)
