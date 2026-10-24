"""Semantic search + grounded recommendations for SalonDesk AI (chat + voice).

PRD alignment:
- Database-driven discovery (orgs, services, prices)
- AI grounding — no invented salons/prices/slots
- Shared pipeline for text and voice
"""

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embeddings import EmbeddingError, get_embedding
from app.ai.portal import entity_types_for_portal, is_support_portal, normalize_portal
from app.ai.rag import (
    ADMIN_GREETING_REPLY,
    ADMIN_PERSONA,
    CHAT_GREETING_REPLY,
    CHAT_PERSONA,
    DEFAULT_RECOMMENDATION_LIMIT,
    EXPANDED_RECOMMENDATION_LIMIT,
    MERCHANT_GREETING_REPLY,
    MERCHANT_PERSONA,
    OrganizationRecommendation,
    RetrievedChunk,
    RetrievedContext,
    ServiceRecommendation,
    build_chat_system_prompt,
    build_search_query,
    build_voice_rag_instruction,
    detect_intent,
    detect_language,
    fill_recommendations_from_organizations,
    format_context_text,
    greeting_reply_for_portal,
    haversine_km,
    hydrate_organization_recommendations,
    hydrate_service_recommendations,
    is_salon_hunt,
    is_service_request,
    persona_for_portal,
    recommendation_limit_for,
    search_chunks,
    search_nearby_services,
    search_services_by_keywords,
    select_recommendations,
    wants_more_recommendations,
)
from app.ai.rag.discovery import collect_client_cards
from app.core.config import Settings, get_settings

__all__ = [
    "ADMIN_GREETING_REPLY",
    "ADMIN_PERSONA",
    "CHAT_GREETING_REPLY",
    "CHAT_PERSONA",
    "DEFAULT_RECOMMENDATION_LIMIT",
    "EXPANDED_RECOMMENDATION_LIMIT",
    "MERCHANT_GREETING_REPLY",
    "MERCHANT_PERSONA",
    "OrganizationRecommendation",
    "RetrievedChunk",
    "RetrievedContext",
    "ServiceRecommendation",
    "build_chat_system_prompt",
    "build_search_query",
    "build_voice_rag_instruction",
    "detect_intent",
    "detect_language",
    "fill_recommendations_from_organizations",
    "format_context_text",
    "greeting_reply_for_portal",
    "haversine_km",
    "hydrate_organization_recommendations",
    "hydrate_service_recommendations",
    "is_salon_hunt",
    "is_service_request",
    "persona_for_portal",
    "recommendation_limit_for",
    "retrieve_context",
    "search_chunks",
    "search_nearby_services",
    "search_services_by_keywords",
    "select_recommendations",
    "wants_more_recommendations",
]

logger = logging.getLogger(__name__)


def _deduplicate_languages(
    detected: str,
    room_language: str | None,
) -> list[str]:
    """Deduplicate and prioritize languages for search."""
    languages: list[str] = []
    for lang in (detected, room_language, "en"):
        if lang and lang not in languages:
            languages.append(lang)
    return languages


async def _get_embedding_safely(
    query: str,
    settings: Settings,
) -> list[float] | None:
    """Get embedding with error handling."""
    try:
        return await get_embedding(query, settings=settings)
    except EmbeddingError as exc:
        logger.warning("RAG embedding failed: %s", exc)
        return None


async def retrieve_context(
    session: AsyncSession,
    message: str,
    *,
    room_language: str | None = None,
    chunk_limit: int | None = None,
    prior_turns: list[str] | None = None,
    org_id: str | None = None,
    settings: Settings | None = None,
    user_lat: float | None = None,
    user_lng: float | None = None,
    portal: str | None = "client",
) -> RetrievedContext:
    """Main entry point: retrieve context for AI response generation."""
    cfg = settings or get_settings()
    mode = normalize_portal(portal)
    limit = chunk_limit or cfg.rag_chunk_limit
    rec_limit = recommendation_limit_for(message)

    detected = detect_language(message)
    intent = detect_intent(message)
    greeting = intent == "greeting"

    if greeting:
        return RetrievedContext(
            chunks=[],
            recommendations=[],
            context_text="",
            detected_language=detected,
            is_greeting=True,
            intent=intent,
        )

    query = build_search_query(message, prior_turns)
    languages = _deduplicate_languages(detected, room_language)
    prefer_types = entity_types_for_portal(mode)

    embedding = await _get_embedding_safely(query, cfg)
    merged = await search_chunks(session, embedding, query, languages, limit, org_id, prefer_types)

    # Merchant / admin: help docs only — no salon recommendation cards
    if is_support_portal(mode):
        context_text = format_context_text(merged, [])
        return RetrievedContext(
            chunks=merged,
            recommendations=[],
            organizations=[],
            context_text=context_text,
            detected_language=detected,
            is_greeting=False,
            intent="support" if intent == "booking" else intent,
        )

    context_recs, response_recs, response_orgs, response_stylists = await collect_client_cards(
        session,
        merged=merged,
        query=query,
        intent=intent,
        org_id=org_id,
        user_lat=user_lat,
        user_lng=user_lng,
        rec_limit=rec_limit,
    )
    context_text = format_context_text(merged, context_recs, stylists=response_stylists)
    return RetrievedContext(
        chunks=merged,
        recommendations=response_recs,
        organizations=response_orgs,
        stylists=response_stylists,
        context_text=context_text,
        detected_language=detected,
        is_greeting=False,
        intent=intent,
    )
