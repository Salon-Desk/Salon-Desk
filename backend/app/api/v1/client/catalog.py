import contextlib
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import Float, Select, cast, func, select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession
from app.core.exceptions import NotFoundError
from app.core.pagination import paginate_items
from app.models.booking import BookingService
from app.models.curation import FeaturedItem, PlatformCurationSetting
from app.models.enums import (
    FeedbackModerationStatus,
    OrganizationStatus,
    OrgCancellationPolicyStatus,
    ServiceStatus,
)
from app.models.feedback import ClientFeedback
from app.models.organization import Organization, OrgSettings
from app.models.policy import OrgCancellationPolicy
from app.models.service import Service, ServiceCategory
from app.schemas.common import PageOut
from app.schemas.curation import CatalogCurationOut, FeaturedOrganizationOut, FeaturedServiceOut
from app.schemas.feedback import CatalogStaffOut, ClientFeedbackOut, OrgFeedbackSummaryOut
from app.schemas.organization import CatalogHeroOut, CatalogOrganizationOut
from app.schemas.service import CatalogServiceOut, CatalogServicesPage, ServiceCategoryOut
from app.services import feedback_service
from app.services.cache_service import cache_service

router = APIRouter(prefix="/catalog", tags=["catalog"])


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


def _service_to_out(
    service: Service,
    distance_km: float | None = None,
    rating_avg: float = 4.8,
    review_count: int = 0,
    is_featured: bool = False,
    featured_badge: str | None = None,
) -> CatalogServiceOut:
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
        rating_avg=rating_avg,
        review_count=review_count,
        is_featured=is_featured,
        featured_badge=featured_badge,
    )


@router.get("/hero", response_model=CatalogHeroOut)
async def get_catalog_hero(db: DbSession) -> CatalogHeroOut:
    """Landing hero content derived from approved salons and active services, with admin curation overrides."""
    cache_key = "catalog:hero"
    cached = await cache_service.get_json(cache_key)
    if cached is not None:
        try:
            return CatalogHeroOut.model_validate(cached)
        except Exception:
            pass

    # Check for platform curation settings
    curation_result = await db.execute(
        select(PlatformCurationSetting).where(PlatformCurationSetting.key == "default").limit(1)
    )
    curation_setting = curation_result.scalar_one_or_none()

    featured_org: Organization | None = None
    featured_settings: OrgSettings | None = None

    if curation_setting and curation_setting.hero_featured_org_id:
        target_res = await db.execute(
            select(Organization, OrgSettings)
            .outerjoin(OrgSettings, OrgSettings.org_id == Organization.id)
            .where(
                Organization.id == curation_setting.hero_featured_org_id,
                Organization.status == OrganizationStatus.APPROVED,
            )
        )
        target_row = target_res.first()
        if target_row:
            featured_org = target_row[0]
            featured_settings = target_row[1]

    if featured_org is None:
        org_result = await db.execute(
            select(Organization, OrgSettings)
            .outerjoin(OrgSettings, OrgSettings.org_id == Organization.id)
            .where(Organization.status == OrganizationStatus.APPROVED)
            .order_by(Organization.name)
            .limit(1)
        )
        row = org_result.first()
        featured_org = row[0] if row else None
        featured_settings = row[1] if row else None

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

    fallback_name = featured_org.name if featured_org else "SalonDesk"
    fallback_desc = (
        featured_org.description if featured_org and featured_org.description else None
    ) or "Reserve salon appointments with PayPal authorization holds. $0 is debited today."
    fallback_pic = featured_org.picture if featured_org else None
    address = featured_settings.physical_address if featured_settings else None

    if curation_setting and curation_setting.is_active:
        eyebrow = curation_setting.hero_eyebrow or fallback_name
        headline = curation_setting.hero_headline or "Book salon services with"
        highlight = curation_setting.hero_highlight or "zero upfront charge."
        subtitle = curation_setting.hero_subtitle or fallback_desc
        image_url = curation_setting.hero_image_url or fallback_pic
        image_alt = curation_setting.hero_image_alt or fallback_name
    else:
        eyebrow = fallback_name if featured_org else "SalonDesk marketplace"
        headline = "Book salon services with"
        highlight = "zero upfront charge."
        subtitle = fallback_desc
        image_url = fallback_pic
        image_alt = fallback_name

    hero = CatalogHeroOut(
        eyebrow=eyebrow,
        headline=headline,
        highlight=highlight,
        subtitle=subtitle,
        image_url=image_url,
        image_alt=image_alt,
        organization_id=featured_org.id if featured_org else None,
        organization_name=featured_org.name if featured_org else None,
        physical_address=address,
        salon_count=salon_count,
        service_count=service_count,
    )
    await cache_service.set_json(cache_key, hero.model_dump(mode="json"), ttl_seconds=120)
    return hero


@router.get("/curation", response_model=CatalogCurationOut)
async def get_catalog_curation(db: DbSession) -> CatalogCurationOut:
    """Public discovery payload containing hero banner and featured salons and services."""
    hero = await get_catalog_hero(db)

    items_res = await db.execute(
        select(FeaturedItem)
        .options(
            selectinload(FeaturedItem.organization).selectinload(Organization.settings),
            selectinload(FeaturedItem.service).selectinload(Service.organization),
            selectinload(FeaturedItem.service).selectinload(Service.category),
        )
        .where(FeaturedItem.is_active.is_(True))
        .order_by(FeaturedItem.display_order.asc(), FeaturedItem.created_at.desc())
    )
    items = list(items_res.scalars().all())

    featured_orgs: list[FeaturedOrganizationOut] = []
    featured_services: list[FeaturedServiceOut] = []

    for item in items:
        if (
            item.target_type == "organization"
            and item.organization
            and item.organization.status == OrganizationStatus.APPROVED
        ):
            org = item.organization
            settings = org.settings
            rating_avg, review_count = await feedback_service.org_feedback_summary(db, org.id)
            featured_orgs.append(
                FeaturedOrganizationOut(
                    id=item.id,
                    item_id=org.id,
                    badge_text=item.badge_text,
                    display_order=item.display_order,
                    is_active=item.is_active,
                    organization=CatalogOrganizationOut(
                        id=org.id,
                        name=org.name,
                        description=org.description,
                        picture=org.picture,
                        physical_address=settings.physical_address if settings else None,
                        lat=settings.lat if settings else None,
                        lng=settings.lng if settings else None,
                        timezone=settings.timezone if settings else None,
                        rating_avg=rating_avg,
                        review_count=review_count,
                    ),
                )
            )
        elif (
            item.target_type == "service"
            and item.service
            and item.service.status == ServiceStatus.ACTIVE
        ):
            svc = item.service
            rating_avg, review_count = 4.8, 0
            if svc.organization_id:
                rating_avg, review_count = await feedback_service.org_feedback_summary(
                    db, svc.organization_id
                )
            featured_services.append(
                FeaturedServiceOut(
                    id=item.id,
                    item_id=svc.id,
                    badge_text=item.badge_text,
                    display_order=item.display_order,
                    is_active=item.is_active,
                    service=CatalogServiceOut(
                        id=svc.id,
                        organization_id=svc.organization_id,
                        service_category_id=svc.service_category_id,
                        name=svc.name,
                        description=svc.description,
                        images=svc.images,
                        base_price=svc.base_price,
                        duration_minutes=svc.duration_minutes,
                        simultaneous_capacity=svc.simultaneous_capacity,
                        organization_name=svc.organization.name if svc.organization else None,
                        category_name=svc.category.name if svc.category else None,
                        rating_avg=rating_avg,
                        review_count=review_count,
                        is_featured=True,
                        featured_badge=item.badge_text,
                    ),
                )
            )

    return CatalogCurationOut(
        hero=hero,
        featured_organizations=featured_orgs,
        featured_services=featured_services,
    )


@router.get("/organizations", response_model=PageOut[CatalogOrganizationOut])
async def list_organizations(
    db: DbSession,
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    q: str | None = Query(default=None, description="Search query"),
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
                rating_avg=rating_avg,
                review_count=review_count,
            )
        )
    has_more = (offset + len(items)) < total
    return PageOut(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        has_more=has_more,
    )


@router.get("/organizations/{org_id}", response_model=CatalogOrganizationOut)
async def get_organization(org_id: UUID, db: DbSession) -> CatalogOrganizationOut:
    result = await db.execute(
        select(Organization)
        .options(selectinload(Organization.settings))
        .where(Organization.id == org_id)
    )
    org = result.scalar_one_or_none()
    if org is None or org.status != OrganizationStatus.APPROVED:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Organization not found")
    settings = org.settings
    rating_avg, review_count = await feedback_service.org_feedback_summary(db, org.id)
    return CatalogOrganizationOut(
        id=org.id,
        name=org.name,
        description=org.description,
        picture=org.picture,
        physical_address=settings.physical_address if settings else None,
        lat=settings.lat if settings else None,
        lng=settings.lng if settings else None,
        timezone=settings.timezone if settings else None,
        rating_avg=rating_avg,
        review_count=review_count,
    )


@router.get("/organizations/{org_id}/staff", response_model=PageOut[CatalogStaffOut])
async def list_organization_staff(org_id: UUID, db: DbSession) -> PageOut[CatalogStaffOut]:
    try:
        rows = await feedback_service.list_catalog_staff(db, org_id)
    except NotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=exc.message) from exc
    items = [CatalogStaffOut.model_validate(row) for row in rows]
    total = len(items)
    return PageOut(items=items, page=1, page_size=max(total, 1), total=total, has_more=False)


@router.get("/organizations/{org_id}/feedback-summary", response_model=OrgFeedbackSummaryOut)
async def get_organization_feedback_summary(org_id: UUID, db: DbSession) -> OrgFeedbackSummaryOut:
    rating_avg, review_count = await feedback_service.org_feedback_summary(db, org_id)
    return OrgFeedbackSummaryOut(org_id=org_id, rating_avg=rating_avg, review_count=review_count)


@router.get("/organizations/{org_id}/feedback", response_model=PageOut[ClientFeedbackOut])
async def list_organization_feedback(
    org_id: UUID,
    db: DbSession,
    stylist_id: UUID | None = Query(default=None, description="Stylist-specific reviews"),
    page_size: int = Query(default=12, ge=1, le=50),
) -> PageOut[ClientFeedbackOut]:
    try:
        rows = await feedback_service.list_public_feedback(
            db, org_id=org_id, stylist_id=stylist_id, limit=page_size
        )
    except NotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=exc.message) from exc
    items: list[ClientFeedbackOut] = []
    for row in rows:
        service_name = None
        if row.booking and row.booking.booking_services:
            bs = row.booking.booking_services[0]
            if getattr(bs, "service", None):
                service_name = bs.service.name
        items.append(
            ClientFeedbackOut.model_validate(
                feedback_service.feedback_to_out(row, service_name=service_name)
            )
        )
    total = len(items)
    return PageOut(items=items, page=1, page_size=page_size, total=total, has_more=False)


class CatalogCancellationPolicyOut(BaseModel):
    """Public booking-time policy preview (same fields locked into booking snapshots)."""

    org_id: UUID
    name: str
    free_cancel_hours: float = 24
    no_show_fee_percent: float = 50
    late_cancel_fee_percent: float | None = None
    data: dict = {}


@router.get(
    "/organizations/{org_id}/cancellation-policy",
    response_model=CatalogCancellationPolicyOut,
)
async def get_organization_cancellation_policy(
    org_id: UUID, db: DbSession
) -> CatalogCancellationPolicyOut:
    org = await db.get(Organization, org_id)
    if org is None or org.status != OrganizationStatus.APPROVED:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Organization not found")

    result = await db.execute(
        select(OrgCancellationPolicy).where(
            OrgCancellationPolicy.org_id == org_id,
            OrgCancellationPolicy.status == OrgCancellationPolicyStatus.ACTIVE,
        )
    )
    policy = result.scalar_one_or_none()
    data = dict(policy.data or {}) if policy is not None else {}
    return CatalogCancellationPolicyOut(
        org_id=org_id,
        name=policy.name if policy is not None else "Default",
        free_cancel_hours=float(data.get("free_cancel_hours", 24)),
        no_show_fee_percent=float(data.get("no_show_fee_percent", 50)),
        late_cancel_fee_percent=(
            float(data["late_cancel_fee_percent"])
            if data.get("late_cancel_fee_percent") is not None
            else None
        ),
        data=data,
    )


@router.get("/categories", response_model=PageOut[ServiceCategoryOut])
async def list_categories(
    db: DbSession,
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    q: str | None = Query(default=None, description="Search query"),
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
        pattern="^(name|popular|rating|price_asc|price_desc|duration|distance)$",
    ),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    min_rating: float | None = Query(default=None, ge=1.0, le=5.0),
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

    # Organization feedback subquery
    org_fb_sub = (
        select(
            ClientFeedback.org_id.label("f_org_id"),
            func.avg(ClientFeedback.rating).label("org_avg"),
            func.count(ClientFeedback.id).label("org_count"),
        )
        .where(
            ClientFeedback.status == FeedbackModerationStatus.APPROVED,
            ClientFeedback.stylist_id.is_(None),
        )
        .group_by(ClientFeedback.org_id)
        .subquery()
    )

    # Service feedback subquery (via BookingService)
    svc_fb_sub = (
        select(
            BookingService.service_id.label("f_service_id"),
            func.avg(ClientFeedback.rating).label("svc_avg"),
            func.count(ClientFeedback.id).label("svc_count"),
        )
        .join(ClientFeedback, ClientFeedback.booking_id == BookingService.booking_id)
        .where(ClientFeedback.status == FeedbackModerationStatus.APPROVED)
        .group_by(BookingService.service_id)
        .subquery()
    )

    # Effective ratings:
    # 1. service rating if available, else org rating, else standard 4.8
    service_rating_expr = func.coalesce(svc_fb_sub.c.svc_avg, org_fb_sub.c.org_avg, 4.8)
    service_review_count_expr = func.coalesce(svc_fb_sub.c.svc_count, org_fb_sub.c.org_count, 0)

    # Popular score combines service rating and org rating with booking activity:
    blended_popular_expr = (
        func.coalesce(svc_fb_sub.c.svc_avg, org_fb_sub.c.org_avg, 4.8) * 0.60
        + func.coalesce(org_fb_sub.c.org_avg, 4.8) * 0.40
        + func.least(service_review_count_expr * 0.05, 0.5)
    )

    base: Select = (
        select(
            Service,
            service_rating_expr.label("calc_rating"),
            service_review_count_expr.label("calc_reviews"),
        )
        .options(
            selectinload(Service.organization),
            selectinload(Service.category),
        )
        .join(Organization, Organization.id == Service.organization_id)
        .outerjoin(org_fb_sub, org_fb_sub.c.f_org_id == Service.organization_id)
        .outerjoin(svc_fb_sub, svc_fb_sub.c.f_service_id == Service.id)
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
    if min_price is not None:
        base = base.where(Service.base_price >= min_price)
    if max_price is not None:
        base = base.where(Service.base_price <= max_price)
    if min_rating is not None:
        base = base.where(service_rating_expr >= min_rating)

    count_stmt = select(func.count()).select_from(base.order_by(None).subquery())
    total = int((await db.execute(count_stmt)).scalar_one())

    if sort == "price_asc":
        base = base.order_by(Service.base_price.asc(), Service.name.asc())
    elif sort == "price_desc":
        base = base.order_by(Service.base_price.desc(), Service.name.asc())
    elif sort == "duration":
        base = base.order_by(Service.duration_minutes.asc(), Service.name.asc())
    elif sort == "rating":
        base = base.order_by(
            service_rating_expr.desc(),
            service_review_count_expr.desc(),
            Service.name.asc(),
        )
    elif sort == "popular":
        base = base.order_by(
            blended_popular_expr.desc(),
            service_review_count_expr.desc(),
            Service.name.asc(),
        )
    elif sort == "distance" and distance_expr is not None:
        base = base.order_by(distance_expr.asc(), Service.name.asc())
    else:
        base = base.order_by(Service.name.asc())

    offset = (page - 1) * page_size
    result = await db.execute(base.offset(offset).limit(page_size))
    rows = result.all()

    # Load featured items map to mark featured badges on services
    featured_rows = await db.execute(select(FeaturedItem).where(FeaturedItem.is_active.is_(True)))
    featured_items = list(featured_rows.scalars().all())
    featured_service_badges = {f.service_id: f.badge_text for f in featured_items if f.service_id}
    featured_org_badges = {f.org_id: f.badge_text for f in featured_items if f.org_id}

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
            is_feat = False
            feat_badge = None
            if service.id in featured_service_badges:
                is_feat = True
                feat_badge = featured_service_badges[service.id]
            elif service.organization_id in featured_org_badges:
                is_feat = True
                feat_badge = featured_org_badges[service.organization_id]

            items.append(
                _service_to_out(
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
            is_feat = False
            feat_badge = None
            if service.id in featured_service_badges:
                is_feat = True
                feat_badge = featured_service_badges[service.id]
            elif service.organization_id in featured_org_badges:
                is_feat = True
                feat_badge = featured_org_badges[service.organization_id]

            items.append(
                _service_to_out(
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


@router.get("/services/{service_id}", response_model=CatalogServiceOut)
async def get_service(service_id: UUID, db: DbSession) -> CatalogServiceOut:
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
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Service not found")

    rating_avg, review_count = 4.8, 0
    if service.organization_id:
        rating_avg, review_count = await feedback_service.org_feedback_summary(
            db, service.organization_id
        )

    rule = await commission_rule_for_service(db, service)
    platform_fee = commission_amount(rule, service.base_price)
    hold_total = (service.base_price + platform_fee).quantize(Decimal("0.01"))
    out = _service_to_out(service, rating_avg=rating_avg, review_count=review_count)
    return out.model_copy(
        update={
            "platform_commission_amount": platform_fee,
            "authorization_hold_amount": hold_total,
        }
    )
