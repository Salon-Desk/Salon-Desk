from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession
from app.models.enums import OrganizationStatus, ServiceStatus
from app.models.organization import Organization, OrgSettings
from app.models.service import Service, ServiceCategory
from app.schemas.organization import CatalogOrganizationOut, OrganizationOut
from app.schemas.service import CatalogServiceOut, ServiceCategoryOut, ServiceOut

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/organizations", response_model=list[CatalogOrganizationOut])
async def list_organizations(db: DbSession) -> list[CatalogOrganizationOut]:
    result = await db.execute(
        select(Organization, OrgSettings)
        .outerjoin(OrgSettings, OrgSettings.org_id == Organization.id)
        .where(Organization.status == OrganizationStatus.APPROVED)
        .order_by(Organization.name)
    )
    items: list[CatalogOrganizationOut] = []
    for org, settings in result.all():
        items.append(
            CatalogOrganizationOut(
                id=org.id,
                name=org.name,
                description=org.description,
                picture=org.picture,
                physical_address=settings.physical_address if settings else None,
                lat=settings.lat if settings else None,
                lng=settings.lng if settings else None,
                timezone=settings.timezone if settings else None,
            )
        )
    return items


@router.get("/organizations/{org_id}", response_model=OrganizationOut)
async def get_organization(org_id: UUID, db: DbSession) -> OrganizationOut:
    org = await db.get(Organization, org_id)
    if org is None or org.status != OrganizationStatus.APPROVED:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return OrganizationOut.model_validate(org)


@router.get("/categories", response_model=list[ServiceCategoryOut])
async def list_categories(db: DbSession) -> list[ServiceCategoryOut]:
    result = await db.execute(select(ServiceCategory).order_by(ServiceCategory.name))
    return [ServiceCategoryOut.model_validate(c) for c in result.scalars().all()]


@router.get("/services", response_model=list[CatalogServiceOut])
async def list_services(
    db: DbSession,
    org_id: UUID | None = None,
    category_id: UUID | None = None,
    q: str | None = Query(default=None, max_length=100),
) -> list[CatalogServiceOut]:
    stmt = (
        select(Service)
        .options(
            selectinload(Service.organization),
            selectinload(Service.category),
        )
        .join(Organization, Organization.id == Service.organization_id)
        .where(
            Service.status == ServiceStatus.ACTIVE,
            Organization.status == OrganizationStatus.APPROVED,
        )
    )
    if org_id:
        stmt = stmt.where(Service.organization_id == org_id)
    if category_id:
        stmt = stmt.where(Service.service_category_id == category_id)
    if q:
        stmt = stmt.where(Service.name.ilike(f"%{q}%"))
    stmt = stmt.order_by(Service.name)
    result = await db.execute(stmt)
    out: list[CatalogServiceOut] = []
    for service in result.scalars().all():
        out.append(
            CatalogServiceOut(
                id=service.id,
                organization_id=service.organization_id,
                service_category_id=service.service_category_id,
                name=service.name,
                description=service.description,
                images=service.images,
                base_price=service.base_price,
                duration_minutes=service.duration_minutes,
                simultaneous_capacity=service.simultaneous_capacity,
                organization_name=service.organization.name if service.organization else None,
                category_name=service.category.name if service.category else None,
            )
        )
    return out


@router.get("/services/{service_id}", response_model=ServiceOut)
async def get_service(service_id: UUID, db: DbSession) -> ServiceOut:
    service = await db.get(Service, service_id)
    if service is None or service.status != ServiceStatus.ACTIVE:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Service not found")
    return ServiceOut.model_validate(service)
