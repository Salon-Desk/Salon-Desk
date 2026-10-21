"""Public catalog list and detail reads for organizations, categories, and services."""

import contextlib
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.core.pagination import paginate_items
from app.models.enums import OrganizationStatus, ServiceStatus
from app.models.organization import Organization, OrgSettings
from app.models.service import Service, ServiceCategory
from app.schemas.common import PageOut
from app.schemas.organization import CatalogOrganizationOut
from app.schemas.service import CatalogServiceOut, CatalogServicesPage, ServiceCategoryOut
from app.services import feedback_service
from app.services.cache_service import cache_service
from app.services.catalog_mapping import organization_to_out, service_to_out
from app.services.catalog_queries import (
    apply_featured_badges,
    apply_service_sorting,
    build_service_list_query,
    load_featured_badges,
)


async def list_organizations(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    q: str | None = None,
) -> PageOut[CatalogOrganizationOut]:
    stmt = (
        select(Organization, OrgSettings)
        .outerjoin(OrgSettings, OrgSettings.org_id == Organization.id)
        .where(Organization.status == OrganizationStatus.APPROVED)
    )
    if q and q.strip():
        term = f"%{q.strip()}%"
        stmt = stmt.where(Organization.name.ilike(term) | Organization.description.ilike(term))
    stmt = stmt.order_by(Organization.name)

    count_subquery = stmt.order_by(None).subquery()
    count_stmt = select(func.count()).select_from(count_subquery)
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one() or 0

    offset = max(0, (page - 1) * page_size)
    paged_stmt = stmt.offset(offset).limit(page_size)
    result = await db.execute(paged_stmt)
    items: list[CatalogOrganizationOut] = []
    for org, settings in result.all():
        rating_avg, review_count = await feedback_service.org_feedback_summary(db, org.id)
        items.append(organization_to_out(org, settings, rating_avg, review_count))
    has_more = (offset + len(items)) < total
    return PageOut(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        has_more=has_more,
    )


async def list_categories(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    q: str | None = None,
) -> PageOut[ServiceCategoryOut]:
    cache_key = "catalog:categories"
    cached = await cache_service.get_json(cache_key)
    all_categories: list[ServiceCategoryOut] = []
    if cached is not None:
        with contextlib.suppress(Exception):
            all_categories = [ServiceCategoryOut.model_validate(c) for c in cached]

    if not all_categories:
        result = await db.execute(select(ServiceCategory).order_by(ServiceCategory.name))
        all_categories = [ServiceCategoryOut.model_validate(c) for c in result.scalars().all()]
        await cache_service.set_json(
            cache_key,
            [c.model_dump(mode="json") for c in all_categories],
            ttl_seconds=300,
        )

    filtered = all_categories
    if q and q.strip():
        term = q.strip().lower()
        filtered = [
            c
            for c in all_categories
            if term in c.name.lower() or (c.description and term in c.description.lower())
        ]

    return paginate_items(filtered, page=page, page_size=page_size)


async def list_services(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 6,
    org_id: UUID | None = None,
    category_id: UUID | None = None,
    q: str | None = None,
    sort: str = "name",
    min_price: float | None = None,
    max_price: float | None = None,
    min_rating: float | None = None,
    lat: float | None = None,
    lng: float | None = None,
    max_distance_km: float | None = None,
) -> CatalogServicesPage:
    wants_distance = sort == "distance" or max_distance_km is not None

    base, distance_expr, blended_popular_expr, service_rating_expr = build_service_list_query(
        org_id=str(org_id) if org_id else None,
        category_id=str(category_id) if category_id else None,
        q=q,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        lat=lat,
        lng=lng,
        max_distance_km=max_distance_km,
        wants_distance=wants_distance,
    )

    base = apply_service_sorting(
        base, sort, distance_expr, blended_popular_expr, service_rating_expr
    )

    count_stmt = select(func.count()).select_from(base.order_by(None).subquery())
    total = int((await db.execute(count_stmt)).scalar_one())

    offset = (page - 1) * page_size
    result = await db.execute(base.offset(offset).limit(page_size))
    rows = result.all()

    featured_service_badges, featured_org_badges = await load_featured_badges(db)

    items: list[CatalogServiceOut] = []
    if wants_distance and distance_expr is not None and rows:
        services = [r[0] for r in rows]
        ids = [s.id for s in services]
        dist_rows = await db.execute(
            select(Service.id, distance_expr.label("distance_km"))
            .join(Organization, Organization.id == Service.organization_id)
            .join(OrgSettings, OrgSettings.org_id == Organization.id)
            .where(Service.id.in_(ids))
        )
        dist_by_id = {row.id: float(row.distance_km) for row in dist_rows.all()}
        for service, calc_rating, calc_reviews in rows:
            is_feat, feat_badge = apply_featured_badges(
                service, featured_service_badges, featured_org_badges
            )
            items.append(
                service_to_out(
                    service,
                    dist_by_id.get(service.id),
                    rating_avg=round(float(calc_rating or 4.8), 1),
                    review_count=int(calc_reviews or 0),
                    is_featured=is_feat,
                    featured_badge=feat_badge,
                )
            )
    else:
        for service, calc_rating, calc_reviews in rows:
            is_feat, feat_badge = apply_featured_badges(
                service, featured_service_badges, featured_org_badges
            )
            items.append(
                service_to_out(
                    service,
                    rating_avg=round(float(calc_rating or 4.8), 1),
                    review_count=int(calc_reviews or 0),
                    is_featured=is_feat,
                    featured_badge=feat_badge,
                )
            )

    return CatalogServicesPage(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        has_more=page * page_size < total,
    )


async def get_service(db: AsyncSession, service_id: UUID) -> CatalogServiceOut:
    from app.services.commission_service import commission_amount, commission_rule_for_service

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
        raise NotFoundError("Service not found")

    rating_avg, review_count = 4.8, 0
    if service.organization_id:
        rating_avg, review_count = await feedback_service.org_feedback_summary(
            db, service.organization_id
        )

    rule = await commission_rule_for_service(db, service)
    platform_fee = commission_amount(rule, service.base_price)
    hold_total = (service.base_price + platform_fee).quantize(Decimal("0.01"))
    out = service_to_out(service, rating_avg=rating_avg, review_count=review_count)
    return out.model_copy(
        update={
            "platform_commission_amount": platform_fee,
            "authorization_hold_amount": hold_total,
        }
    )
