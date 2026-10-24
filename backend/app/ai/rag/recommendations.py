"""Recommendation selection and ranking logic."""

from uuid import UUID

from .constants import (
    _MORE_RECOMMENDATIONS_RE,
    _QUERY_STOPWORDS,
    _SALON_HUNT_HINTS,
    _SERVICE_REQUEST_HINTS,
    _SPECIFIC_SERVICE_HINTS,
    DEFAULT_RECOMMENDATION_LIMIT,
    EXPANDED_RECOMMENDATION_LIMIT,
    ServiceRecommendation,
)


def wants_more_recommendations(message: str) -> bool:
    """True when the client asks to see more than the first three picks."""
    return bool(_MORE_RECOMMENDATIONS_RE.search(message or ""))


def recommendation_limit_for(message: str) -> int:
    """Determine recommendation limit based on user request."""
    if wants_more_recommendations(message):
        return EXPANDED_RECOMMENDATION_LIMIT
    return DEFAULT_RECOMMENDATION_LIMIT


def is_salon_hunt(query: str) -> bool:
    """Check if user is looking for salons/organizations in general (not specific services)."""
    lowered = (query or "").lower()
    looking_for_salon = any(hint in lowered for hint in _SALON_HUNT_HINTS)
    named_a_service = is_service_request(query) or any(
        hint in lowered for hint in _SPECIFIC_SERVICE_HINTS
    )
    return looking_for_salon and not named_a_service


def is_service_request(query: str) -> bool:
    """Check if user explicitly asked for services, treatments, booking, or pricing."""
    lowered = (query or "").lower()
    return any(hint in lowered for hint in _SERVICE_REQUEST_HINTS)


def _is_salon_hunt(query: str) -> bool:
    return is_salon_hunt(query)


def _meaningful_query_tokens(query: str) -> list[str]:
    """Extract meaningful tokens from query for relevance scoring."""
    import re

    return [
        token
        for token in re.split(r"\W+", (query or "").lower())
        if len(token) >= 3 and token not in _QUERY_STOPWORDS
    ]


def _card_relevance(card: ServiceRecommendation, tokens: list[str]) -> int:
    """Score card relevance based on query tokens."""
    if not tokens:
        return 0

    name_hay = f"{card.name} {card.category_name or ''} {card.description or ''}".lower()
    org_hay = (card.organization_name or "").lower()
    score = 0

    for token in tokens:
        if token in name_hay:
            score += 3
        elif token in org_hay:
            score += 1

    return score


def _is_salon_hunt(query: str) -> bool:
    """Check if user is looking for salons in general (not specific services)."""
    lowered = (query or "").lower()
    looking_for_salon = any(hint in lowered for hint in _SALON_HUNT_HINTS)
    named_a_service = any(hint in lowered for hint in _SPECIFIC_SERVICE_HINTS)
    return looking_for_salon and not named_a_service


def select_recommendations(
    cards: list[ServiceRecommendation],
    *,
    query: str,
    limit: int = DEFAULT_RECOMMENDATION_LIMIT,
) -> list[ServiceRecommendation]:
    """Rank live cards, prefer what they asked for, and keep the list short."""
    if not cards or limit <= 0:
        return []

    tokens = _meaningful_query_tokens(query)
    ranked = sorted(
        cards,
        key=lambda card: (
            -_card_relevance(card, tokens),
            card.distance_km is None,
            card.distance_km if card.distance_km is not None else 0.0,
            -card.score,
        ),
    )

    if _is_salon_hunt(query):
        return _select_diverse_organizations(ranked, limit)

    return ranked[:limit]


def _select_diverse_organizations(
    ranked: list[ServiceRecommendation],
    limit: int,
) -> list[ServiceRecommendation]:
    """Select recommendations showing diverse organizations when salon hunting."""
    picked: list[ServiceRecommendation] = []
    seen_orgs: set[UUID] = set()

    # First pass: one per organization
    for card in ranked:
        if card.organization_id in seen_orgs:
            continue
        picked.append(card)
        seen_orgs.add(card.organization_id)
        if len(picked) >= limit:
            return picked

    # Second pass: fill remaining slots
    for card in ranked:
        if card in picked:
            continue
        picked.append(card)
        if len(picked) >= limit:
            break

    return picked
