"""High-level context retrieval orchestration for SalonDesk RAG."""

from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embeddings import EmbeddingError, get_embedding
from app.ai.portal import entity_types_for_portal, is_support_portal, normalize_portal
from app.ai.rag.constants import RetrievedContext
from app.ai.rag.detection import detect_intent, detect_language
from app.ai.rag.discovery import collect_client_cards
from app.ai.rag.formatting import format_context_text
from app.ai.rag.recommendations import recommendation_limit_for
from app.ai.rag.search import search_chunks
from app.ai.rag.utils import build_search_query
from app.core.config import Settings, get_settings

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

    (
        context_recs,
        response_recs,
        response_orgs,
        response_stylists,
        context_orgs,
    ) = await collect_client_cards(
        session,
        merged=merged,
        query=query,
        intent=intent,
        org_id=org_id,
        user_lat=user_lat,
        user_lng=user_lng,
        rec_limit=rec_limit,
    )
    context_text = format_context_text(
        merged, context_recs, stylists=response_stylists, organizations=context_orgs
    )
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
