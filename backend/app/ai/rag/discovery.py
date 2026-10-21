"""Client-portal recommendation and organization cards for a retrieval turn."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.rag.hydration import (
    fill_recommendations_from_organizations,
    hydrate_organization_recommendations,
    hydrate_service_recommendations,
    search_nearby_services,
    search_services_by_keywords,
)
from app.ai.rag.recommendations import is_salon_hunt, is_service_request, select_recommendations

_NEARBY_HINTS = ("near", "closest", "nearby", "location", "close to", "around")
_ORG_HINTS = ("salon", "salons", "org", "place")


def _is_nearby_query(query: str) -> bool:
    lowered = query.lower()
    return any(hint in lowered for hint in _NEARBY_HINTS)


async def _organization_ids(
    session: AsyncSession,
    recommendations: list,
    query: str,
    org_id: str | None,
    rec_limit: int,
) -> set:
    from app.models.organization import Organization

    seen_org_ids = {card.organization_id for card in recommendations}
    if not seen_org_ids or any(word in query.lower() for word in _ORG_HINTS):
        org_query = (
            select(Organization.id).where(Organization.status == "approved").limit(rec_limit)
        )
        if org_id is not None:
            org_query = org_query.where(Organization.id == org_id)
        extra_orgs = await session.execute(org_query)
        for oid in extra_orgs.scalars().all():
            seen_org_ids.add(str(oid))
    return seen_org_ids


def _filter_organizations(organizations: list, recommendations: list, rec_limit: int) -> list:
    if recommendations:
        rec_org_ids = {card.organization_id for card in recommendations}
        matched = [org for org in organizations if org.id in rec_org_ids]
        return matched or organizations[:rec_limit]
    return organizations[:rec_limit]


async def collect_client_cards(
    session: AsyncSession,
    *,
    merged: list,
    query: str,
    intent: str,
    org_id: str | None,
    user_lat: float | None,
    user_lng: float | None,
    rec_limit: int,
) -> tuple[list, list, list]:
    """Return context recommendations, response cards, and organization cards.

    Context recommendations stay unfiltered so the prompt can still mention them.
    Response cards follow whether the user asked for salons or services.
    """
    is_nearby = _is_nearby_query(query)
    recommendations = await hydrate_service_recommendations(
        session,
        merged,
        user_lat=user_lat,
        user_lng=user_lng,
        sort_by_distance=(is_nearby and user_lat is not None),
    )
    if is_nearby and not recommendations and user_lat is not None and user_lng is not None:
        recommendations = await search_nearby_services(session, user_lat, user_lng, rec_limit)
    if not recommendations:
        recommendations = await search_services_by_keywords(
            session, query, org_id, user_lat, user_lng, rec_limit
        )

    seen_org_ids = await _organization_ids(session, recommendations, query, org_id, rec_limit)
    organizations = await hydrate_organization_recommendations(
        session, seen_org_ids, user_lat, user_lng, rec_limit
    )
    recommendations = await fill_recommendations_from_organizations(
        session, recommendations, organizations, user_lat, user_lng, rec_limit
    )
    recommendations = select_recommendations(recommendations, query=query, limit=rec_limit)
    organizations = _filter_organizations(organizations, recommendations, rec_limit)

    user_wants_salons = is_salon_hunt(query)
    user_wants_services = is_service_request(query) or intent == "booking"
    if user_wants_salons:
        return recommendations, [], organizations[:rec_limit]
    if user_wants_services:
        return recommendations, recommendations, []
    return recommendations, [], []
