"""Semantic search + grounded recommendations for SalonDesk AI (chat + voice).

PRD alignment:
- Database-driven discovery (orgs, services, prices)
- AI grounding — no invented salons/prices/slots
- Shared pipeline for text and voice
"""

from __future__ import annotations

import logging
import math
import re
from dataclasses import dataclass, field
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.ai.embeddings import EmbeddingError, get_embedding
from app.core.config import Settings, get_settings
from app.models.enums import KnowledgeEntityType, OrganizationStatus, ServiceStatus
from app.models.knowledge import KnowledgeChunk
from app.models.organization import Organization, OrgSettings
from app.models.service import Service

logger = logging.getLogger(__name__)

_AMHARIC_RE = re.compile(r"[\u1200-\u137F]")
_GREETING_RE = re.compile(
    r"^\s*(hi|hello|hey|good\s+(morning|afternoon|evening)|selam)\b",
    re.I,
)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two points on Earth in kilometers."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


@dataclass
class RetrievedChunk:
    entity_type: str
    entity_id: UUID | None
    org_id: UUID | None
    title: str
    content: str
    score: float = 0.0
    metadata: dict = field(default_factory=dict)


@dataclass
class ServiceRecommendation:
    """Interactive service card payload for chat UI / voice summary."""

    service_id: UUID
    organization_id: UUID
    name: str
    organization_name: str
    base_price: Decimal
    duration_minutes: int
    category_name: str | None = None
    description: str | None = None
    physical_address: str | None = None
    distance_km: float | None = None
    score: float = 0.0


@dataclass
class RetrievedContext:
    chunks: list[RetrievedChunk] = field(default_factory=list)
    recommendations: list[ServiceRecommendation] = field(default_factory=list)
    context_text: str = ""
    detected_language: str = "en"
    is_greeting: bool = False
    intent: str = "discover"  # discover | booking | farewell | greeting


def detect_language(message: str) -> str:
    if _AMHARIC_RE.search(message or ""):
        return "am"
    return "en"


def _is_greeting(message: str) -> bool:
    return bool(_GREETING_RE.match(message or ""))


def detect_intent(message: str) -> str:
    lowered = (message or "").lower()
    if any(h in lowered for h in ("bye", "goodbye", "good bye", "see you", "hang up", "end call")):
        return "farewell"
    if _is_greeting(message) and len(lowered.split()) <= 3:
        return "greeting"
    if any(
        h in lowered
        for h in (
            "book",
            "booking",
            "appointment",
            "schedule",
            "available",
            "availability",
            "reserve",
            "slot",
            "when can",
        )
    ):
        return "booking"
    return "discover"


def build_search_query(message: str, prior_turns: list[str] | None = None) -> str:
    parts = [*(prior_turns or [])[-3:], message]
    return " ".join(p.strip() for p in parts if p and p.strip())


async def _vector_search(
    session: AsyncSession,
    *,
    embedding: list[float],
    language: str,
    limit: int,
    org_id: UUID | None = None,
    entity_types: list[KnowledgeEntityType] | None = None,
) -> list[RetrievedChunk]:
    # Exact scan — reliable on small/medium corpora (no IVFFlat required).
    await session.execute(text("SET LOCAL enable_indexscan = off"))
    distance = KnowledgeChunk.embedding.cosine_distance(embedding)
    stmt = (
        select(KnowledgeChunk, distance.label("distance"))
        .where(
            KnowledgeChunk.language == language,
            KnowledgeChunk.is_active.is_(True),
            KnowledgeChunk.embedding.is_not(None),
        )
        .order_by(distance)
        .limit(limit)
    )
    if org_id is not None:
        stmt = stmt.where((KnowledgeChunk.org_id == org_id) | (KnowledgeChunk.org_id.is_(None)))
    if entity_types:
        stmt = stmt.where(KnowledgeChunk.entity_type.in_(entity_types))

    result = await session.execute(stmt)
    chunks: list[RetrievedChunk] = []
    for row, dist in result.all():
        d = float(dist) if dist is not None else 1.0
        chunks.append(
            RetrievedChunk(
                entity_type=row.entity_type.value,
                entity_id=row.entity_id,
                org_id=row.org_id,
                title=row.title,
                content=row.content,
                score=1.0 / (1.0 + d),
                metadata=dict(row.metadata_json or {}),
            )
        )
    return chunks


async def _keyword_search(
    session: AsyncSession,
    *,
    query: str,
    language: str,
    limit: int,
    org_id: UUID | None = None,
) -> list[RetrievedChunk]:
    tokens = [t for t in re.split(r"\W+", query.lower()) if len(t) >= 3][:8]
    if not tokens:
        return []

    stmt = select(KnowledgeChunk).where(
        KnowledgeChunk.language == language,
        KnowledgeChunk.is_active.is_(True),
    )
    if org_id is not None:
        stmt = stmt.where((KnowledgeChunk.org_id == org_id) | (KnowledgeChunk.org_id.is_(None)))
    stmt = stmt.limit(limit * 5)
    result = await session.execute(stmt)
    scored: list[RetrievedChunk] = []
    for row in result.scalars().all():
        hay = f"{row.title} {row.content} {row.metadata_json}".lower()
        hits = sum(1 for t in tokens if t in hay)
        if hits:
            scored.append(
                RetrievedChunk(
                    entity_type=row.entity_type.value,
                    entity_id=row.entity_id,
                    org_id=row.org_id,
                    title=row.title,
                    content=row.content,
                    score=float(hits) + 0.5,
                    metadata=dict(row.metadata_json or {}),
                )
            )
    scored.sort(key=lambda c: c.score, reverse=True)
    return scored[:limit]


def _merge_chunks(
    vector_chunks: list[RetrievedChunk],
    keyword_chunks: list[RetrievedChunk],
    limit: int,
) -> list[RetrievedChunk]:
    seen: set[str] = set()
    merged: list[RetrievedChunk] = []
    for chunk in [*keyword_chunks, *vector_chunks]:
        key = f"{chunk.entity_type}:{chunk.entity_id}:{chunk.title}"
        if key in seen:
            continue
        seen.add(key)
        merged.append(chunk)
        if len(merged) >= limit:
            break
    return merged


async def _hydrate_service_recommendations(
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

    # Only recommend services under approved orgs (PRD org status rule).
    org_ids = {s.organization_id for s in services}
    org_settings: dict[UUID, OrgSettings] = {}
    if org_ids:
        settings_result = await session.execute(
            select(OrgSettings).where(OrgSettings.org_id.in_(org_ids))
        )
        org_settings = {s.org_id: s for s in settings_result.scalars().all()}

    cards: list[ServiceRecommendation] = []
    for service in services:
        org = service.organization
        if org is None or org.status != OrganizationStatus.APPROVED:
            continue
        addr = None
        dist_km: float | None = None
        settings_row = org_settings.get(service.organization_id)
        if settings_row:
            addr = settings_row.physical_address
            if (
                user_lat is not None
                and user_lng is not None
                and settings_row.lat is not None
                and settings_row.lng is not None
            ):
                dist_km = round(
                    haversine_km(
                        user_lat, user_lng, float(settings_row.lat), float(settings_row.lng)
                    ),
                    1,
                )
        cards.append(
            ServiceRecommendation(
                service_id=service.id,
                organization_id=service.organization_id,
                name=service.name,
                organization_name=org.name,
                base_price=service.base_price,
                duration_minutes=service.duration_minutes,
                category_name=service.category.name if service.category else None,
                description=service.description,
                physical_address=addr,
                distance_km=dist_km,
                score=float(score_by_id.get(service.id, 0.0)),
            )
        )
    if sort_by_distance and any(c.distance_km is not None for c in cards):
        cards.sort(key=lambda c: (c.distance_km is None, c.distance_km or 0.0, -c.score))
    else:
        cards.sort(key=lambda c: c.score, reverse=True)
    return cards


def format_context_text(
    chunks: list[RetrievedChunk],
    recommendations: list[ServiceRecommendation],
) -> str:
    lines: list[str] = []
    if recommendations:
        lines.append("Recommended services (from live platform data):")
        for card in recommendations:
            dist_part = f" ({card.distance_km} km away)" if card.distance_km is not None else ""
            lines.append(
                f"- {card.name} at {card.organization_name}{dist_part}: "
                f"${card.base_price} / {card.duration_minutes} min"
                + (f" ({card.category_name})" if card.category_name else "")
                + (f" @ {card.physical_address}" if card.physical_address else "")
                + f" [service_id={card.service_id}]"
            )
    for chunk in chunks:
        lines.append(f"From {chunk.entity_type}/{chunk.title}: {chunk.content}")
    return "\n".join(lines)


def build_voice_rag_instruction(retrieved: RetrievedContext) -> str:
    if retrieved.intent == "greeting" or retrieved.is_greeting:
        return (
            "The user greeted you. Reply briefly and warmly as SalonDesk's "
            "voice assistant. Offer to help find a salon service or book."
        )
    if retrieved.intent == "booking":
        base = (
            "User is booking. Stay on scheduling: clarify service, salon, and time. "
            "Use only verified services below. Do not invent availability. "
            "Ask one clarifying question if needed. Speak in 1–2 short sentences."
        )
        if retrieved.context_text:
            return f"{base}\n\n{retrieved.context_text}"
        return base
    if not retrieved.chunks and not retrieved.recommendations:
        return (
            "No verified salon data matched this turn. "
            "Do not invent salons, prices, or slots. "
            "Ask what service or area they want, or suggest browsing the app catalog."
        )
    return (
        "Use ONLY the verified platform context below. "
        "Help the client discover suitable services (name, salon, price). "
        "Speak conversationally in 1–2 short sentences. No markdown or lists.\n\n"
        f"{retrieved.context_text}"
    )


def build_chat_system_prompt(retrieved: RetrievedContext) -> str:
    base = (
        "You are SalonDesk's client assistant for service discovery and booking. "
        "Ground every recommendation in verified platform data. "
        "Never invent salons, prices, or appointment availability. "
        "When recommending services, mention name, salon, and price. "
        "Guide the client toward selecting a service and time for booking. "
        "If authentication is required to book, say they should sign in while "
        "keeping their selected service context."
    )
    if retrieved.intent == "booking":
        base += (
            " The user is in a booking flow — clarify service/time and next steps; "
            "do not digress into unrelated FAQ."
        )
    if not retrieved.context_text:
        return base
    return f"{base}\n\nVerified knowledge:\n{retrieved.context_text}"


async def retrieve_context(
    session: AsyncSession,
    message: str,
    *,
    room_language: str | None = None,
    chunk_limit: int | None = None,
    prior_turns: list[str] | None = None,
    org_id: UUID | None = None,
    settings: Settings | None = None,
    user_lat: float | None = None,
    user_lng: float | None = None,
) -> RetrievedContext:
    cfg = settings or get_settings()
    limit = chunk_limit or cfg.rag_chunk_limit
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
    languages: list[str] = []
    for lang in (detected, room_language, "en"):
        if lang and lang not in languages:
            languages.append(lang)

    # Prefer service/org chunks for discovery; include platform help as fallback.
    prefer_types = [
        KnowledgeEntityType.SERVICE,
        KnowledgeEntityType.ORGANIZATION,
        KnowledgeEntityType.CATEGORY,
        KnowledgeEntityType.POLICY,
        KnowledgeEntityType.PLATFORM,
    ]

    try:
        embedding = await get_embedding(query, settings=cfg)
    except EmbeddingError as exc:
        logger.warning("RAG embedding failed: %s", exc)
        embedding = None

    merged: list[RetrievedChunk] = []
    for lang in languages:
        vector_hits = (
            await _vector_search(
                session,
                embedding=embedding,
                language=lang,
                limit=limit * 3,
                org_id=org_id,
                entity_types=prefer_types,
            )
            if embedding is not None
            else []
        )
        keyword_hits = await _keyword_search(
            session,
            query=query,
            language=lang,
            limit=limit,
            org_id=org_id,
        )
        merged = _merge_chunks(vector_hits, keyword_hits, limit)
        if merged:
            detected = lang
            break

    is_nearby = any(
        h in query.lower() for h in ("near", "closest", "nearby", "location", "close to", "around")
    )
    recommendations = await _hydrate_service_recommendations(
        session,
        merged,
        user_lat=user_lat,
        user_lng=user_lng,
        sort_by_distance=(is_nearby and user_lat is not None),
    )

    if is_nearby and not recommendations and user_lat is not None and user_lng is not None:
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
        for dist, s, s_set in scored_services[:limit]:
            recommendations.append(
                ServiceRecommendation(
                    service_id=s.id,
                    organization_id=s.organization_id,
                    name=s.name,
                    organization_name=s.organization.name if s.organization else "Salon",
                    base_price=s.base_price,
                    duration_minutes=s.duration_minutes,
                    category_name=s.category.name if s.category else None,
                    description=s.description,
                    physical_address=s_set.physical_address,
                    distance_km=round(dist, 1) if dist < 99999 else None,
                    score=1.0,
                )
            )

    context_text = format_context_text(merged, recommendations)
    return RetrievedContext(
        chunks=merged,
        recommendations=recommendations,
        context_text=context_text,
        detected_language=detected,
        is_greeting=False,
        intent=intent,
    )
