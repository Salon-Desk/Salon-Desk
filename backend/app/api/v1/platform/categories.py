from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import distinct, func, select

from app.api.deps import DbSession, PlatformAdmin
from app.core.pagination import paginate_query
from app.models.enums import OrganizationStatus, ServiceStatus
from app.models.organization import Organization
from app.models.service import Service, ServiceCategory
from app.schemas.common import PageOut
from app.schemas.service import (
    ServiceCategoryCreate,
    ServiceCategoryOut,
    ServiceCategoryUpdate,
    TaxonomyMetricsOut,
)

router = APIRouter(prefix="/admin", tags=["platform"])

# --- Service categories ---


@router.get("/service-categories/metrics", response_model=TaxonomyMetricsOut)
async def get_taxonomy_metrics(
    user: PlatformAdmin,
    db: DbSession,
) -> TaxonomyMetricsOut:
    _ = user
    total_cats = await db.scalar(select(func.count(ServiceCategory.id))) or 0
    active_cats = (
        await db.scalar(
            select(func.count(ServiceCategory.id)).where(
                func.upper(ServiceCategory.status) == "ACTIVE"
            )
        )
        or 0
    )
    total_active_orgs = (
        await db.scalar(
            select(func.count(distinct(Service.organization_id)))
            .join(Organization, Organization.id == Service.organization_id)
            .where(
                Organization.status == OrganizationStatus.APPROVED,
                Service.status == ServiceStatus.ACTIVE,
            )
        )
        or 0
    )
    total_active_services = (
        await db.scalar(
            select(func.count(Service.id)).where(Service.status == ServiceStatus.ACTIVE)
        )
        or 0
    )
    return TaxonomyMetricsOut(
        total_categories=total_cats,
        active_categories=active_cats,
        total_active_organizations=total_active_orgs,
        total_active_services=total_active_services,
    )


@router.get("/service-categories", response_model=PageOut[ServiceCategoryOut])
async def list_categories(
    user: PlatformAdmin,
    db: DbSession,
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    q: str | None = Query(default=None, description="Search query"),
) -> PageOut[ServiceCategoryOut]:
    _ = user
    stmt = select(ServiceCategory)
    if q and q.strip():
        term = f"%{q.strip()}%"
        stmt = stmt.where(
            ServiceCategory.name.ilike(term) | ServiceCategory.description.ilike(term)
        )
    stmt = stmt.order_by(ServiceCategory.name)
    raw_page = await paginate_query(db, stmt, page=page, page_size=page_size)

    # Compute live counts for current page items
    category_ids = [c.id for c in raw_page.items]
    counts_map: dict[UUID, tuple[int, int]] = {}
    if category_ids:
        counts_stmt = (
            select(
                Service.service_category_id,
                func.count(distinct(Service.organization_id)).filter(
                    Organization.status == OrganizationStatus.APPROVED,
                    Service.status == ServiceStatus.ACTIVE,
                ),
                func.count(Service.id).filter(
                    Service.status == ServiceStatus.ACTIVE,
                ),
            )
            .join(Organization, Organization.id == Service.organization_id)
            .where(Service.service_category_id.in_(category_ids))
            .group_by(Service.service_category_id)
        )
        counts_res = await db.execute(counts_stmt)
        for row in counts_res.all():
            counts_map[row[0]] = (int(row[1] or 0), int(row[2] or 0))

    enriched_items = [
        ServiceCategoryOut(
            id=c.id,
            name=c.name,
            description=c.description,
            status=getattr(c, "status", "ACTIVE") or "ACTIVE",
            active_organizations_count=counts_map.get(c.id, (0, 0))[0],
            active_services_count=counts_map.get(c.id, (0, 0))[1],
            created_at=c.created_at,
        )
        for c in raw_page.items
    ]

    return PageOut[ServiceCategoryOut](
        items=enriched_items,
        total=raw_page.total,
        page=raw_page.page,
        page_size=raw_page.page_size,
        has_more=raw_page.has_more,
    )


@router.post(
    "/service-categories",
    response_model=ServiceCategoryOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_category(
    body: ServiceCategoryCreate, user: PlatformAdmin, db: DbSession
) -> ServiceCategoryOut:
    _ = user
    status_val = (body.status or "ACTIVE").upper()
    cat = ServiceCategory(name=body.name, description=body.description, status=status_val)
    db.add(cat)
    await db.flush()
    return ServiceCategoryOut.model_validate(cat)


@router.patch("/service-categories/{category_id}", response_model=ServiceCategoryOut)
async def update_category(
    category_id: UUID,
    body: ServiceCategoryUpdate,
    user: PlatformAdmin,
    db: DbSession,
) -> ServiceCategoryOut:
    _ = user
    cat = await db.get(ServiceCategory, category_id)
    if cat is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Category not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        if key == "status" and value:
            value = str(value).upper()
        setattr(cat, key, value)
    await db.flush()
    return ServiceCategoryOut.model_validate(cat)
