from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DbSession, OrgMember, OrgOwner
from app.models.enums import (
    ServiceStatus,
)
from app.models.service import Service, ServiceGiving
from app.models.user import User
from app.schemas.service import (
    ServiceCreate,
    ServiceGivingCreate,
    ServiceGivingOut,
    ServiceOut,
    ServiceUpdate,
)

router = APIRouter(prefix="/organizations", tags=["org"])

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
