"""SQL query builders for catalog service."""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy import Float, Select, cast, func, select
from sqlalchemy.orm import selectinload

from app.models.booking import BookingService
from app.models.curation import FeaturedItem
from app.models.enums import FeedbackModerationStatus, OrganizationStatus, ServiceStatus
from app.models.feedback import ClientFeedback
from app.models.organization import Organization, OrgSettings
from app.models.service import Service


def haversine_km_expr(lat: float, lng: float):
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


def build_feedback_subqueries():
    """Build organization and service feedback rating subqueries."""
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

    return org_fb_sub, svc_fb_sub


def build_service_list_query(
    org_id: str | None = None,
    category_id: str | None = None,
    q: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    min_rating: float | None = None,
    lat: float | None = None,
    lng: float | None = None,
    max_distance_km: float | None = None,
    wants_distance: bool = False,
):
    """Build the base service list query with all filters."""
    org_fb_sub, svc_fb_sub = build_feedback_subqueries()

    # Effective ratings
    service_rating_expr = func.coalesce(svc_fb_sub.c.svc_avg, org_fb_sub.c.org_avg, 4.8)
    service_review_count_expr = func.coalesce(svc_fb_sub.c.svc_count, org_fb_sub.c.org_count, 0)

    # Popular score combines service rating and org rating with booking activity
    blended_popular_expr = (
        func.coalesce(svc_fb_sub.c.svc_avg, org_fb_sub.c.org_avg, 4.8) * Decimal("0.60")
        + func.coalesce(org_fb_sub.c.org_avg, 4.8) * Decimal("0.40")
        + func.least(service_review_count_expr * Decimal("0.05"), Decimal("0.5"))
    )

    distance_expr = (
        haversine_km_expr(lat, lng)
        if (wants_distance and lat is not None and lng is not None)
        else None
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

    return base, distance_expr, blended_popular_expr, service_rating_expr


def apply_service_sorting(
    base: Select,
    sort: str,
    distance_expr,
    blended_popular_expr,
    service_rating_expr,
):
    """Apply sorting to the service query."""
    if sort == "price_asc":
        base = base.order_by(Service.base_price.asc(), Service.name.asc())
    elif sort == "price_desc":
        base = base.order_by(Service.base_price.desc(), Service.name.asc())
    elif sort == "duration":
        base = base.order_by(Service.duration_minutes.asc(), Service.name.asc())
    elif sort == "rating":
        base = base.order_by(
            service_rating_expr.desc(),
            service_rating_expr.desc(),
            Service.name.asc(),
        )
    elif sort == "popular":
        base = base.order_by(
            blended_popular_expr.desc(),
            service_rating_expr.desc(),
            Service.name.asc(),
        )
    elif sort == "distance" and distance_expr is not None:
        base = base.order_by(distance_expr.asc(), Service.name.asc())
    else:
        base = base.order_by(Service.name.asc())

    return base


async def load_featured_badges(db):
    """Load featured items and build badge maps."""
    featured_rows = await db.execute(select(FeaturedItem).where(FeaturedItem.is_active.is_(True)))
    featured_items = list(featured_rows.scalars().all())
    featured_service_badges = {f.service_id: f.badge_text for f in featured_items if f.service_id}
    featured_org_badges = {f.org_id: f.badge_text for f in featured_items if f.org_id}
    return featured_service_badges, featured_org_badges


def apply_featured_badges(service, featured_service_badges, featured_org_badges):
    """Apply featured badges to a service."""
    is_featured = False
    featured_badge = None
    if service.id in featured_service_badges:
        is_featured = True
        featured_badge = featured_service_badges[service.id]
    elif service.organization_id in featured_org_badges:
        is_featured = True
        featured_badge = featured_org_badges[service.organization_id]
    return is_featured, featured_badge


async def count_approved_organizations(db) -> int:
    """Count approved salons shown on the public catalog."""
    result = await db.execute(
        select(func.count())
        .select_from(Organization)
        .where(Organization.status == OrganizationStatus.APPROVED)
    )
    return int(result.scalar_one())


async def count_active_services(db) -> int:
    """Count active services belonging to approved salons."""
    result = await db.execute(
        select(func.count())
        .select_from(Service)
        .join(Organization, Organization.id == Service.organization_id)
        .where(
            Service.status == ServiceStatus.ACTIVE,
            Organization.status == OrganizationStatus.APPROVED,
        )
    )
    return int(result.scalar_one())
