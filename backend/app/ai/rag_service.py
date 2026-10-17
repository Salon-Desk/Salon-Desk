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

from sqlalchemy import func, or_, select, text
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
    organization_picture: str | None = None
    image_url: str | None = None
    score: float = 0.0


@dataclass
class OrganizationRecommendation:
    """Interactive organization / salon card payload for chat UI."""

    id: UUID
    name: str
    description: str | None = None
    picture: str | None = None
    physical_address: str | None = None
    rating: float = 4.9
    service_count: int = 0
    distance_km: float | None = None


@dataclass
class RetrievedContext:
    chunks: list[RetrievedChunk] = field(default_factory=list)
    recommendations: list[ServiceRecommendation] = field(default_factory=list)
    organizations: list[OrganizationRecommendation] = field(default_factory=list)
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


DEFAULT_RECOMMENDATION_LIMIT = 3
EXPANDED_RECOMMENDATION_LIMIT = 8

_MORE_RECOMMENDATIONS_RE = re.compile(
    r"\b("
    r"more( options| salons| services| please)?"
    r"|other(s)?"
    r"|what else"
    r"|anything else"
    r"|show more"
    r"|see more"
    r"|few more"
    r"|another"
    r"|all (the )?options"
    r"|full list"
    r")\b",
    re.I,
)

_QUERY_STOPWORDS = frozenset(
    {
        "searching",
        "search",
        "looking",
        "look",
        "want",
        "wanna",
        "need",
        "good",
        "best",
        "find",
        "finding",
        "please",
        "the",
        "for",
        "and",
        "you",
        "have",
        "any",
        "some",
        "near",
        "nearby",
        "around",
        "close",
        "just",
        "like",
        "get",
        "got",
        "can",
        "could",
        "would",
        "help",
        "hello",
        "hey",
        "salon",
        "salons",
        "salone",
        "place",
        "places",
        "studio",
    }
)

_SALON_HUNT_HINTS = (
    "salon",
    "salons",
    "salone",
    "studio",
    "place",
    "places",
    "nearby",
    "near me",
)

_SPECIFIC_SERVICE_HINTS = (
    "haircut",
    "cut",
    "color",
    "fade",
    "braid",
    "manicure",
    "pedicure",
    "facial",
    "massage",
    "spa",
    "beard",
    "balayage",
    "locs",
    "twist",
)


def wants_more_recommendations(message: str) -> bool:
    """True when the client asks to see more than the first three picks."""
    return bool(_MORE_RECOMMENDATIONS_RE.search(message or ""))


def recommendation_limit_for(message: str) -> int:
    if wants_more_recommendations(message):
        return EXPANDED_RECOMMENDATION_LIMIT
    return DEFAULT_RECOMMENDATION_LIMIT


def _meaningful_query_tokens(query: str) -> list[str]:
    return [
        token
        for token in re.split(r"\W+", (query or "").lower())
        if len(token) >= 3 and token not in _QUERY_STOPWORDS
    ]


def _card_relevance(card: ServiceRecommendation, tokens: list[str]) -> int:
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
        picked: list[ServiceRecommendation] = []
        seen_orgs: set[UUID] = set()
        for card in ranked:
            if card.organization_id in seen_orgs:
                continue
            picked.append(card)
            seen_orgs.add(card.organization_id)
            if len(picked) >= limit:
                return picked
        for card in ranked:
            if card in picked:
                continue
            picked.append(card)
            if len(picked) >= limit:
                break
        return picked

    return ranked[:limit]


CHAT_GREETING_REPLY = "Hey! What are you hoping to book — a cut, color, or just looking around?"

_CHAT_PERSONA = """
You are a real person helping someone book a salon — warm, brief, and easy to talk to.

How you talk:
- Sound like a text to a friend who works the front desk. Short sentences. Contractions are fine.
- Usually 2–4 sentences. Never write an essay.
- Do not use markdown tables, headings, numbered "Next Steps", bullet lists, or service IDs.
- Do not say "based on verified data" or treat distance as a rating. Kilometers are how far they are.
- Cards in the app already show price, duration, and address. Mention one or two highlights in passing.
- Recommend at most 3 options unless they asked for more. Invite them to ask if they want others.
- Ask only one easy follow-up. Never interview them with a numbered checklist.
- If they only said hi, greet them and ask what they are after. Do not recap how booking works.
- Stay grounded in the verified services below. Never invent salons, prices, or open slots.
- If they need to sign in to book, mention it casually and keep their pick.
""".strip()


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
        cover_img = None
        if isinstance(service.images, dict):
            cover_img = service.images.get("cover") or service.images.get("image")

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
            "They just said hello. Reply like a person — one warm sentence "
            "and ask what they are hoping to get done. No lists."
        )
    if retrieved.intent == "booking":
        base = (
            "They want to book. Stay on service, salon, and time. "
            "Use only verified services below. Do not invent availability. "
            "Ask one question if you need it. Speak in 1–2 short sentences."
        )
        if retrieved.context_text:
            return f"{base}\n\n{retrieved.context_text}"
        return base
    if not retrieved.chunks and not retrieved.recommendations:
        return (
            "No verified salon data matched this turn. "
            "Do not invent salons, prices, or slots. "
            "Ask what they want or which area, like a person would."
        )
    more_note = ""
    if len(retrieved.recommendations) > DEFAULT_RECOMMENDATION_LIMIT:
        more_note = " They asked for more options — you may mention these extra picks."
    return (
        "Use ONLY the verified platform context below. "
        "Mention at most three services unless they asked for more. "
        "Speak conversationally in 1–2 short sentences. No markdown or lists."
        f"{more_note}\n\n"
        f"{retrieved.context_text}"
    )


def build_chat_system_prompt(retrieved: RetrievedContext) -> str:
    parts = [_CHAT_PERSONA]
    if retrieved.intent == "greeting" or retrieved.is_greeting:
        parts.append(
            "They just said hello. Reply in one or two friendly sentences. "
            "Do not list questions or explain how booking works."
        )
        return "\n\n".join(parts)
    if retrieved.intent == "farewell":
        parts.append("They are saying goodbye. Wish them well in one short sentence.")
        return "\n\n".join(parts)
    if retrieved.intent == "booking":
        parts.append(
            "They are trying to book. Clarify service or time in a natural way; "
            "do not wander into unrelated FAQ."
        )
    if len(retrieved.recommendations) > DEFAULT_RECOMMENDATION_LIMIT:
        parts.append(
            "They asked for more options. You may mention these extra picks, still conversationally."
        )
    if retrieved.context_text:
        parts.append(
            "Verified services you can mention (do not invent others):\n" + retrieved.context_text
        )
    else:
        parts.append(
            "No matching salon data this turn. Ask what they want or which area — "
            "do not invent names or prices."
        )
    return "\n\n".join(parts)


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
        for dist, s, s_set in scored_services[: max(rec_limit * 3, 9)]:
            cover_img = None
            if isinstance(s.images, dict):
                cover_img = s.images.get("cover") or s.images.get("image")
            recommendations.append(
                ServiceRecommendation(
                    service_id=s.id,
                    organization_id=s.organization_id,
                    name=s.name,
                    organization_name=s.organization.name if s.organization else "Salon",
                    organization_picture=s.organization.picture if s.organization else None,
                    image_url=cover_img,
                    base_price=s.base_price,
                    duration_minutes=s.duration_minutes,
                    category_name=s.category.name if s.category else None,
                    description=s.description,
                    physical_address=s_set.physical_address,
                    distance_km=round(dist, 1) if dist < 99999 else None,
                    score=1.0,
                )
            )

    # General direct DB fallback if vector/keyword chunks were empty
    if not recommendations:
        tokens = [t for t in re.split(r"\W+", query.lower()) if len(t) >= 3][:5]
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
            stmt = stmt.where(Service.organization_id == org_id)
        if tokens:
            clauses = [Service.name.ilike(f"%{t}%") for t in tokens]
            clauses.extend(Organization.name.ilike(f"%{t}%") for t in tokens)
            stmt = stmt.where(or_(*clauses))
        stmt = stmt.limit(max(rec_limit * 3, 9))
        res = await session.execute(stmt)
        for s, s_set in res.all():
            cover_img = None
            if isinstance(s.images, dict):
                cover_img = s.images.get("cover") or s.images.get("image")
            dist = None
            if (
                user_lat is not None
                and user_lng is not None
                and s_set
                and s_set.lat is not None
                and s_set.lng is not None
            ):
                dist = round(
                    haversine_km(user_lat, user_lng, float(s_set.lat), float(s_set.lng)),
                    1,
                )
            recommendations.append(
                ServiceRecommendation(
                    service_id=s.id,
                    organization_id=s.organization_id,
                    name=s.name,
                    organization_name=s.organization.name if s.organization else "Salon",
                    organization_picture=s.organization.picture if s.organization else None,
                    image_url=cover_img,
                    base_price=s.base_price,
                    duration_minutes=s.duration_minutes,
                    category_name=s.category.name if s.category else None,
                    description=s.description,
                    physical_address=s_set.physical_address if s_set else None,
                    distance_km=dist,
                    score=0.9,
                )
            )

    # Hydrate organization cards
    seen_org_ids = {r.organization_id for r in recommendations}
    if not seen_org_ids or any(w in query.lower() for w in ("salon", "salons", "org", "place")):
        org_query = (
            select(Organization.id)
            .where(Organization.status == OrganizationStatus.APPROVED)
            .limit(rec_limit)
        )
        if org_id is not None:
            org_query = org_query.where(Organization.id == org_id)
        extra_orgs = await session.execute(org_query)
        for oid in extra_orgs.scalars().all():
            seen_org_ids.add(oid)

    organizations: list[OrganizationRecommendation] = []
    if seen_org_ids:
        org_rows = await session.execute(
            select(Organization, OrgSettings)
            .outerjoin(OrgSettings, Organization.id == OrgSettings.org_id)
            .where(
                Organization.id.in_(list(seen_org_ids)[: max(rec_limit, 3)]),
                Organization.status == OrganizationStatus.APPROVED,
            )
        )
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

    # If recommendations are few, hydrate top services from the top organizations for interactive booking
    if len(recommendations) < rec_limit and organizations:
        rec_srv_ids = {r.service_id for r in recommendations}
        top_org_ids = [o.id for o in organizations[:rec_limit]]
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
            .limit(max(rec_limit * 2, 6))
        )
        for s, s_set in extra_srv_res.all():
            if s.id in rec_srv_ids:
                continue
            rec_srv_ids.add(s.id)
            cover_img = None
            if isinstance(s.images, dict):
                cover_img = s.images.get("cover") or s.images.get("image")
            dist = None
            if (
                user_lat is not None
                and user_lng is not None
                and s_set
                and s_set.lat is not None
                and s_set.lng is not None
            ):
                dist = round(
                    haversine_km(user_lat, user_lng, float(s_set.lat), float(s_set.lng)),
                    1,
                )
            recommendations.append(
                ServiceRecommendation(
                    service_id=s.id,
                    organization_id=s.organization_id,
                    name=s.name,
                    organization_name=s.organization.name if s.organization else "Salon",
                    organization_picture=s.organization.picture if s.organization else None,
                    image_url=cover_img,
                    base_price=s.base_price,
                    duration_minutes=s.duration_minutes,
                    category_name=s.category.name if s.category else None,
                    description=s.description,
                    physical_address=s_set.physical_address if s_set else None,
                    distance_km=dist,
                    score=0.85,
                )
            )

    recommendations = select_recommendations(recommendations, query=query, limit=rec_limit)
    if recommendations:
        rec_org_ids = {card.organization_id for card in recommendations}
        matched_orgs = [org for org in organizations if org.id in rec_org_ids]
        organizations = matched_orgs or organizations[:rec_limit]
    else:
        organizations = organizations[:rec_limit]

    context_text = format_context_text(merged, recommendations)
    return RetrievedContext(
        chunks=merged,
        recommendations=recommendations,
        organizations=organizations,
        context_text=context_text,
        detected_language=detected,
        is_greeting=False,
        intent=intent,
    )
