from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import Float, Select, cast, func, select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession
from app.models.enums import OrganizationStatus, ServiceStatus
from app.models.organization import Organization, OrgSettings
from app.models.service import Service, ServiceCategory
from app.schemas.organization import CatalogHeroOut, CatalogOrganizationOut, OrganizationOut
from app.schemas.service import CatalogServiceOut, CatalogServicesPage, ServiceCategoryOut
from app.services.cache_service import cache_service

router = APIRouter(prefix="/catalog", tags=["catalog"])

POPULAR_MIN_PRICE = 80


def _haversine_km_expr(lat: float, lng: float):
    """Great-circle distance in km between (lat,lng) and org settings coords."""
    org_lat = cast(OrgSettings.lat, Float)
    org_lng = cast(OrgSettings.lng, Float)
    return 6371.0 * func.acos(
        func.least(
            1.0,
            func.cos(func.radians(lat))
            * func.cos(func.radians(org_lat))
            * func.cos(func.radians(org_lng) - func.radians(lng))
            + func.sin(func.radians(lat)) * func.sin(func.radians(org_lat)),
        )
    )


def _service_to_out(service: Service, distance_km: float | None = None) -> CatalogServiceOut:
    return CatalogServiceOut(
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
        distance_km=distance_km,
    )


@router.get("/hero", response_model=CatalogHeroOut)
async def get_catalog_hero(db: DbSession) -> CatalogHeroOut:
    """Landing hero content derived from approved salons and active services."""
    cache_key = "catalog:hero"
    cached = await cache_service.get_json(cache_key)
    if cached is not None:
        try:
            return CatalogHeroOut.model_validate(cached)
        except Exception:
            pass

    org_result = await db.execute(
        select(Organization, OrgSettings)
        .outerjoin(OrgSettings, OrgSettings.org_id == Organization.id)
        .where(Organization.status == OrganizationStatus.APPROVED)
        .order_by(Organization.name)
        .limit(1)
    )
    row = org_result.first()
    featured_org: Organization | None = row[0] if row else None
    featured_settings: OrgSettings | None = row[1] if row else None

    salon_count = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Organization)
                .where(Organization.status == OrganizationStatus.APPROVED)
            )
        ).scalar_one()
    )
    service_count = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Service)
                .join(Organization, Organization.id == Service.organization_id)
                .where(
                    Service.status == ServiceStatus.ACTIVE,
                    Organization.status == OrganizationStatus.APPROVED,
                )
            )
        ).scalar_one()
    )

    name = featured_org.name if featured_org else "SalonDesk"
    description = (
        featured_org.description if featured_org and featured_org.description else None
    ) or "Reserve salon appointments with PayPal authorization holds. $0 is debited today."
    address = featured_settings.physical_address if featured_settings else None
    picture = featured_org.picture if featured_org else None

    hero = CatalogHeroOut(
        eyebrow=name if featured_org else "SalonDesk marketplace",
        headline="Book salon services with",
        highlight="zero upfront charge.",
        subtitle=description,
        image_url=picture,
        image_alt=name,
        organization_id=featured_org.id if featured_org else None,
        organization_name=name if featured_org else None,
        physical_address=address,
        salon_count=salon_count,
        service_count=service_count,
    )
    await cache_service.set_json(cache_key, hero.model_dump(mode="json"), ttl_seconds=120)
    return hero


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
    cache_key = "catalog:categories"
    cached = await cache_service.get_json(cache_key)
    if cached is not None:
        try:
            return [ServiceCategoryOut.model_validate(c) for c in cached]
        except Exception:
            pass

    result = await db.execute(select(ServiceCategory).order_by(ServiceCategory.name))
    categories = [ServiceCategoryOut.model_validate(c) for c in result.scalars().all()]
    await cache_service.set_json(
        cache_key,
        [c.model_dump(mode="json") for c in categories],
        ttl_seconds=300,
    )
    return categories


@router.get("/services", response_model=CatalogServicesPage)
async def list_services(
    db: DbSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=6, ge=1, le=50),
    org_id: UUID | None = None,
    category_id: UUID | None = None,
    q: str | None = Query(default=None, max_length=100),
    sort: str = Query(
        default="name",
        pattern="^(name|popular|price_asc|price_desc|duration|distance)$",
    ),
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
    max_distance_km: float | None = Query(default=None, gt=0, le=500),
) -> CatalogServicesPage:
    wants_distance = sort == "distance" or max_distance_km is not None
    if wants_distance and (lat is None or lng is None):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="lat and lng are required for nearby / distance sorting",
        )

    distance_expr = _haversine_km_expr(lat, lng) if wants_distance else None

    base: Select = (
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

    if wants_distance:
        base = base.join(OrgSettings, OrgSettings.org_id == Organization.id).where(
            OrgSettings.lat.is_not(None),
            OrgSettings.lng.is_not(None),
        )
        if max_distance_km is not None and distance_expr is not None:
            base = base.where(distance_expr <= max_distance_km)

    if org_id:
        base = base.where(Service.organization_id == org_id)
    if category_id:
        base = base.where(Service.service_category_id == category_id)
    if q:
        base = base.where(Service.name.ilike(f"%{q}%"))
    if sort == "popular":
        base = base.where(Service.base_price >= POPULAR_MIN_PRICE)

    count_stmt = select(func.count()).select_from(base.order_by(None).subquery())
    total = int((await db.execute(count_stmt)).scalar_one())

    if sort == "price_asc":
        base = base.order_by(Service.base_price.asc(), Service.name.asc())
    elif sort == "price_desc":
        base = base.order_by(Service.base_price.desc(), Service.name.asc())
    elif sort == "duration":
        base = base.order_by(Service.duration_minutes.asc(), Service.name.asc())
    elif sort == "popular":
        base = base.order_by(Service.base_price.desc(), Service.name.asc())
    elif sort == "distance" and distance_expr is not None:
        base = base.order_by(distance_expr.asc(), Service.name.asc())
    else:
        base = base.order_by(Service.name.asc())

    offset = (page - 1) * page_size
    result = await db.execute(base.offset(offset).limit(page_size))
    services = list(result.scalars().unique().all())

    items: list[CatalogServiceOut] = []
    if wants_distance and distance_expr is not None and services:
        # Recompute distances for the page (small) via a keyed query.
        ids = [s.id for s in services]
        dist_rows = await db.execute(
            select(Service.id, distance_expr.label("distance_km"))
            .join(Organization, Organization.id == Service.organization_id)
            .join(OrgSettings, OrgSettings.org_id == Organization.id)
            .where(Service.id.in_(ids))
        )
        dist_by_id = {row.id: float(row.distance_km) for row in dist_rows.all()}
        for service in services:
            items.append(_service_to_out(service, dist_by_id.get(service.id)))
    else:
        items = [_service_to_out(service) for service in services]

    return CatalogServicesPage(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        has_more=page * page_size < total,
    )


@router.get("/services/{service_id}", response_model=CatalogServiceOut)
async def get_service(service_id: UUID, db: DbSession) -> CatalogServiceOut:
    result = await db.execute(
        select(Service)
        .options(
            selectinload(Service.organization),
            selectinload(Service.category),
        )
        .where(Service.id == service_id, Service.status == ServiceStatus.ACTIVE)
    )
    service = result.scalar_one_or_none()
    if service is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Service not found")
    return _service_to_out(service)
