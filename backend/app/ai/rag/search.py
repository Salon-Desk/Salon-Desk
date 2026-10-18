"""Vector and keyword search for knowledge chunks."""

import logging
import re

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import KnowledgeEntityType
from app.models.knowledge import KnowledgeChunk

from .constants import RetrievedChunk

logger = logging.getLogger(__name__)


async def _vector_search(
    session: AsyncSession,
    *,
    embedding: list[float],
    language: str,
    limit: int,
    org_id: str | None = None,
    entity_types: list[KnowledgeEntityType] | None = None,
) -> list[RetrievedChunk]:
    """Perform semantic vector search using pgvector."""
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
    org_id: str | None = None,
    entity_types: list[KnowledgeEntityType] | None = None,
) -> list[RetrievedChunk]:
    """Perform keyword-based search as fallback."""
    tokens = [t for t in re.split(r"\W+", query.lower()) if len(t) >= 3][:8]
    if not tokens:
        return []

    stmt = select(KnowledgeChunk).where(
        KnowledgeChunk.language == language,
        KnowledgeChunk.is_active.is_(True),
    )

    if org_id is not None:
        stmt = stmt.where((KnowledgeChunk.org_id == org_id) | (KnowledgeChunk.org_id.is_(None)))

    if entity_types:
        stmt = stmt.where(KnowledgeChunk.entity_type.in_(entity_types))

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
    """Merge vector and keyword search results, deduplicating by key."""
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


async def search_chunks(
    session: AsyncSession,
    embedding: list[float] | None,
    query: str,
    languages: list[str],
    limit: int,
    org_id: str | None,
    prefer_types: list[KnowledgeEntityType],
) -> list[RetrievedChunk]:
    """Search chunks using vector and keyword search across languages."""
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
            entity_types=prefer_types,
        )
        merged = _merge_chunks(vector_hits, keyword_hits, limit)
        if merged:
            break

    return merged
