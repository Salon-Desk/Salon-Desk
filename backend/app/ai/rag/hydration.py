"""Hydration of service and organization recommendations from database."""

import logging
import re
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import OrganizationStatus, ServiceStatus
from app.models.knowledge import KnowledgeEntityType
from app.models.organization import Organization, OrgSettings
from app.models.service import Service

from .constants import (
    OrganizationRecommendation,
    RetrievedChunk,
    ServiceRecommendation,
)
from .utils import haversine_km

logger = logging.getLogger(__name__)


def _extract_address_and_distance(
    settings: OrgSettings | None,
    user_lat: float | None,
    user_lng: float | None,
) -> tuple[str | None, float | None]:
    """Extract physical address and calculate distance if coordinates available."""
    if not settings:
        return None, None

    addr = settings.physical_address
    dist_km: float | None = None

    if (
        user_lat is not None
        and user_lng is not None
        and settings.lat is not None
        and settings.lng is not None
    ):
        dist_km = round(
            haversine_km(user_lat, user_lng, float(settings.lat), float(settings.lng)),
            1,
        )

    return addr, dist_km


def _extract_cover_image(images: dict | None) -> str | None:
    """Extract cover image URL from service images dict."""
    if isinstance(images, dict):
        return images.get("cover") or images.get("image")
    return None


def _sort_recommendations(
    cards: list[ServiceRecommendation],
    sort_by_distance: bool,
) -> None:
    """Sort recommendations in place by distance or score."""
    if sort_by_distance and any(c.distance_km is not None for c in cards):
        cards.sort(key=lambda c: (c.distance_km is None, c.distance_km or 0.0, -c.score))
    else:
        cards.sort(key=lambda c: c.score, reverse=True)


def _create_service_recommendation(
    service: Service,
    org_settings: OrgSettings | None,
    user_lat: float | None,
    user_lng: float | None,
    score: float = 0.9,
) -> ServiceRecommendation:
    """Create a ServiceRecommendation from a Service ORM object."""
    org = service.organization
    addr, dist_km = _extract_address_and_distance(org_settings, user_lat, user_lng)
    cover_img = _extract_cover_image(service.images)

    return ServiceRecommendation(
        service_id=service.id,
        organization_id=service.organization_id,
        name=service.name,
        organization_name=org.name if org else "Salon",
        organization_picture=org.picture if org else None,
        image_url=cover_img,
        base_price=service.base_price,
        duration_minutes=service.duration_minutes,
        category_name=service.category.name if service.category else None,
        description=service.description,
        physical_address=addr,
        distance_km=dist_km,
        score=score,
    )


async def hydrate_service_recommendations(
    session: AsyncSession,
    chunks: list[RetrievedChunk],
    *,
    user_lat: float | None = None,
    user_lng: float | None = None,
    sort_by_distance: bool = False,
) -> list[ServiceRecommendation]:
    """Turn SERVICE chunk hits into live ORM-backed recommendation cards."""
    service_ids = [
        c.entity_id
        for c in chunks
        if c.entity_type == KnowledgeEntityType.SERVICE.value and c.entity_id
    ]
    if not service_ids:
        return []

    score_by_id = {
        c.entity_id: c.score
        for c in chunks
        if c.entity_type == KnowledgeEntityType.SERVICE.value and c.entity_id
    }

    result = await session.execute(
        select(Service)
        .options(
            selectinload(Service.organization),
            selectinload(Service.category),
        )
        .where(
            Service.id.in_(service_ids),
            Service.status == ServiceStatus.ACTIVE,
        )
    )
    services = list(result.scalars().all())

    # Only recommend services under approved orgs
    org_ids = {s.organization_id for s in services}
    org_settings: dict[str, OrgSettings] = {}

    if org_ids:
        settings_result = await session.execute(
            select(OrgSettings).where(OrgSettings.org_id.in_(org_ids))
        )
        org_settings = {str(s.org_id): s for s in settings_result.scalars().all()}

    cards: list[ServiceRecommendation] = []
    for service in services:
        org = service.organization
        if org is None or org.status != OrganizationStatus.APPROVED:
            continue

        addr, dist_km = _extract_address_and_distance(
            org_settings.get(str(service.organization_id)),
            user_lat,
            user_lng,
        )
        cover_img = _extract_cover_image(service.images)

        cards.append(
            ServiceRecommendation(
                service_id=service.id,
                organization_id=service.organization_id,
                name=service.name,
                organization_name=org.name,
                organization_picture=org.picture,
                image_url=cover_img,
                base_price=service.base_price,
                duration_minutes=service.duration_minutes,
                category_name=service.category.name if service.category else None,
                description=service.description,
                physical_address=addr,
                distance_km=dist_km,
                score=float(score_by_id.get(service.id, 0.0)),
            )
        )

    _sort_recommendations(cards, sort_by_distance)
    return cards


async def search_nearby_services(
    session: AsyncSession,
    user_lat: float,
    user_lng: float,
    limit: int,
) -> list[ServiceRecommendation]:
    """Fallback: search for services near user location."""
    res = await session.execute(
        select(Service, OrgSettings)
        .join(Organization, Service.organization_id == Organization.id)
        .join(OrgSettings, Organization.id == OrgSettings.org_id)
        .options(
            selectinload(Service.organization),
            selectinload(Service.category),
        )
        .where(
            Organization.status == OrganizationStatus.APPROVED,
            Service.status == ServiceStatus.ACTIVE,
        )
        .limit(30)
    )

    scored_services = []
    for s, s_set in res.all():
        dist = None
        if s_set.lat is not None and s_set.lng is not None:
            dist = haversine_km(user_lat, user_lng, float(s_set.lat), float(s_set.lng))
        scored_services.append((dist if dist is not None else 999999.0, s, s_set))

    scored_services.sort(key=lambda x: x[0])

    recommendations = []
    for dist, s, s_set in scored_services[: max(limit * 3, 9)]:
        rec = _create_service_recommendation(s, s_set, user_lat, user_lng, score=1.0)
        rec.distance_km = round(dist, 1) if dist < 99999 else None
        recommendations.append(rec)

    return recommendations


_GENERIC_SERVICE_TOKENS = frozenset(
    {
        "service",
        "services",
        "show",
        "list",
        "what",
        "have",
        "available",
        "offer",
        "offers",
        "offering",
        "offerings",
        "treatment",
        "treatments",
        "menu",
        "see",
        "all",
        "the",
        "you",
        "can",
        "get",
        "any",
        "tell",
        "about",
        "give",
        "options",
        "for",
        "and",
        "with",
        "want",
        "need",
        "please",
        "some",
    }
)


async def search_services_by_keywords(
    session: AsyncSession,
    query: str,
    org_id: str | None,
    user_lat: float | None,
    user_lng: float | None,
    limit: int,
) -> list[ServiceRecommendation]:
    """Fallback: search services by keyword matching."""
    tokens = [
        t
        for t in re.split(r"\W+", (query or "").lower())
        if len(t) >= 3 and t not in _GENERIC_SERVICE_TOKENS
    ][:5]

    stmt = (
        select(Service, OrgSettings)
        .join(Organization, Service.organization_id == Organization.id)
        .outerjoin(OrgSettings, Organization.id == OrgSettings.org_id)
        .options(
            selectinload(Service.organization),
            selectinload(Service.category),
        )
        .where(
            Organization.status == OrganizationStatus.APPROVED,
            Service.status == ServiceStatus.ACTIVE,
        )
    )

    if org_id is not None:
        try:
            parsed_org = UUID(str(org_id))
            stmt = stmt.where(Service.organization_id == parsed_org)
        except (ValueError, AttributeError):
            stmt = stmt.where(Service.organization_id == org_id)

    if tokens:
        clauses = [Service.name.ilike(f"%{t}%") for t in tokens]
        clauses.extend(Organization.name.ilike(f"%{t}%") for t in tokens)
        stmt = stmt.where(or_(*clauses))

    stmt = stmt.limit(max(limit * 3, 9))
    res = await session.execute(stmt)

    recommendations = []
    for s, s_set in res.all():
        rec = _create_service_recommendation(s, s_set, user_lat, user_lng, score=0.9)
        recommendations.append(rec)

    return recommendations


async def hydrate_organization_recommendations(
    session: AsyncSession,
    org_ids: set[str],
    user_lat: float | None,
    user_lng: float | None,
    limit: int,
) -> list[OrganizationRecommendation]:
    """Create organization recommendation cards from org IDs."""
    if not org_ids:
        return []

    org_rows = await session.execute(
        select(Organization, OrgSettings)
        .outerjoin(OrgSettings, Organization.id == OrgSettings.org_id)
        .where(
            Organization.id.in_(list(org_ids)[: max(limit, 3)]),
            Organization.status == OrganizationStatus.APPROVED,
        )
    )

    organizations: list[OrganizationRecommendation] = []
    for org, o_settings in org_rows.all():
        srv_count_res = await session.execute(
            select(func.count(Service.id)).where(
                Service.organization_id == org.id,
                Service.status == ServiceStatus.ACTIVE,
            )
        )
        count = srv_count_res.scalar() or 0

        dist = None
        if (
            user_lat is not None
            and user_lng is not None
            and o_settings
            and o_settings.lat is not None
            and o_settings.lng is not None
        ):
            dist = round(
                haversine_km(user_lat, user_lng, float(o_settings.lat), float(o_settings.lng)),
                1,
            )

        organizations.append(
            OrganizationRecommendation(
                id=org.id,
                name=org.name,
                description=org.description,
                picture=org.picture,
                physical_address=o_settings.physical_address if o_settings else None,
                rating=4.9,
                service_count=count,
                distance_km=dist,
            )
        )

    if any(o.distance_km is not None for o in organizations):
        organizations.sort(key=lambda o: (o.distance_km is None, o.distance_km or 0.0))

    return organizations


async def fill_recommendations_from_organizations(
    session: AsyncSession,
    recommendations: list[ServiceRecommendation],
    organizations: list[OrganizationRecommendation],
    user_lat: float | None,
    user_lng: float | None,
    limit: int,
) -> list[ServiceRecommendation]:
    """Fill recommendation list with top services from organizations if needed."""
    if len(recommendations) >= limit or not organizations:
        return recommendations

    rec_srv_ids = {r.service_id for r in recommendations}
    top_org_ids = [o.id for o in organizations[:limit]]

    extra_srv_res = await session.execute(
        select(Service, OrgSettings)
        .join(Organization, Service.organization_id == Organization.id)
        .outerjoin(OrgSettings, Organization.id == OrgSettings.org_id)
        .options(
            selectinload(Service.organization),
            selectinload(Service.category),
        )
        .where(
            Service.organization_id.in_(top_org_ids),
            Service.status == ServiceStatus.ACTIVE,
        )
        .limit(max(limit * 2, 6))
    )

    for s, s_set in extra_srv_res.all():
        if s.id in rec_srv_ids:
            continue
        rec_srv_ids.add(s.id)
        rec = _create_service_recommendation(s, s_set, user_lat, user_lng, score=0.85)
        recommendations.append(rec)

    return recommendations
