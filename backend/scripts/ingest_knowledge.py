"""Build semantic index from live SalonDesk data (+ optional platform FAQ JSON).

PRD: AI recommendations must use actual organization/service/pricing data.

Usage (from backend/):
  uv run python -m scripts.ingest_knowledge --clear
  uv run python -m scripts.ingest_knowledge --database-url 'postgresql+asyncpg://…'
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import logging
from pathlib import Path

from sqlalchemy import delete, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.ai.embeddings import get_embeddings_batch
from app.core.config import get_settings
from app.core.database import Base
from app.core.database_url import resolve_database_url
from app.models.enums import KnowledgeEntityType
from app.models.knowledge import KnowledgeChunk

from .knowledge_documents import (
    category_documents,
    load_approved_organizations,
    organization_documents,
    platform_policy_documents,
    policy_documents,
    review_documents,
    service_documents,
    staff_documents,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("ingest_knowledge")

# scripts/ingest_knowledge.py → backend/
BACKEND_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_FAQ = BACKEND_ROOT / "data" / "knowledge_en.json"
DEFAULT_SCHEMA_RAG = BACKEND_ROOT / "schema_rag.sql"


async def ensure_rag_schema(engine, schema_file: Path = DEFAULT_SCHEMA_RAG) -> None:
    async with engine.begin() as conn:
        try:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        except Exception as exc:
            raise RuntimeError(
                "pgvector extension is not available on this Postgres. "
                "Use the Compose DB image `pgvector/pgvector:pg16` "
                "(`docker compose up -d db`), not Homebrew/plain postgres. "
                "If localhost:5432 is another Postgres, set POSTGRES_PORT "
                "(e.g. 5433) in the root .env and reconnect."
            ) from exc
        # Ensure KnowledgeChunk is registered on metadata.
        import app.models  # noqa: F401

        await conn.run_sync(Base.metadata.create_all)

        # Apply schema_rag.sql DDL & HNSW indexes if present.
        if schema_file.is_file():
            sql_text = schema_file.read_text(encoding="utf-8")
            try:
                raw_conn = await conn.get_raw_connection()
                if hasattr(raw_conn, "driver_connection") and hasattr(
                    raw_conn.driver_connection, "execute"
                ):
                    await raw_conn.driver_connection.execute(sql_text)
                else:
                    await conn.exec_driver_sql(sql_text)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Applied %s with notice: %s", schema_file.name, exc)

        # Postgres enums are not altered by create_all — add guide types if missing.
        for value in ("org_guide", "admin_guide"):
            await conn.execute(
                text(
                    f"""
                    DO $$ BEGIN
                        ALTER TYPE knowledge_entity_type ADD VALUE IF NOT EXISTS '{value}';
                    EXCEPTION
                        WHEN duplicate_object THEN null;
                        WHEN undefined_object THEN null;
                    END $$;
                    """
                )
            )
    logger.info("RAG schema ready")


async def _embed_and_save_chunks(
    session: AsyncSession,
    items: list[dict],
    language: str,
    label: str = "items",
    batch_size: int = 50,
    schema_hash: str | None = None,
) -> int:
    if not items:
        return 0
    contents = [it["content"] for it in items]
    logger.info("Computing batch embeddings for %d %s...", len(items), label)
    embeddings = await get_embeddings_batch(contents, batch_size=batch_size)
    for it, emb in zip(items, embeddings, strict=True):
        meta = dict(it.get("metadata_json") or {})
        if schema_hash:
            meta["schema_hash"] = schema_hash
        session.add(
            KnowledgeChunk(
                entity_type=it["entity_type"],
                entity_id=it["entity_id"],
                org_id=it["org_id"],
                title=it["title"],
                content=it["content"],
                language=language,
                embedding=emb,
                metadata_json=meta,
                is_active=True,
            )
        )
    return len(items)


async def sync_from_platform(
    session: AsyncSession,
    *,
    language: str,
    schema_hash: str | None = None,
) -> int:
    """Index approved orgs + active services (+ categories, active policies)."""
    count = 0

    async def _save(items: list[dict], label: str) -> int:
        return await _embed_and_save_chunks(
            session, items, language, label, schema_hash=schema_hash
        )

    count += await _save(await category_documents(session), "categories")
    orgs, settings_map = await load_approved_organizations(session)
    count += await _save(organization_documents(orgs, settings_map), "organizations")
    count += await _save(await service_documents(session, settings_map), "services")
    count += await _save(await policy_documents(session), "cancellation policies")
    count += await _save(platform_policy_documents(), "core platform policies")
    count += await _save(await staff_documents(session, orgs), "staff members")
    count += await _save(await review_documents(session, orgs), "client reviews")
    return count


def _entity_type_for_faq_item(item: dict) -> KnowledgeEntityType:
    """Map FAQ audience → knowledge entity type for portal-scoped RAG."""
    audience = (item.get("audience") or "all").strip().lower()
    if audience in {"merchant", "org", "organization"}:
        return KnowledgeEntityType.ORG_GUIDE
    if audience in {"admin", "platform_admin"}:
        return KnowledgeEntityType.ADMIN_GUIDE
    # client | all → platform FAQ (retrieved by client booking concierge + shared fallback)
    return KnowledgeEntityType.PLATFORM


def get_file_sha256(path: Path) -> str:
    """Return SHA-256 hex digest of a file's content."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


async def get_stored_faq_hash(session: AsyncSession, language: str = "en") -> str | None:
    """Return the file_hash stored in the FAQ knowledge chunks for the given language."""
    stmt = (
        select(func.jsonb_extract_path_text(KnowledgeChunk.metadata_json, "file_hash"))
        .where(
            KnowledgeChunk.entity_type.in_(
                [
                    KnowledgeEntityType.PLATFORM,
                    KnowledgeEntityType.ORG_GUIDE,
                    KnowledgeEntityType.ADMIN_GUIDE,
                ]
            ),
            KnowledgeChunk.entity_id.is_(None),
            KnowledgeChunk.language == language,
            func.jsonb_extract_path_text(KnowledgeChunk.metadata_json, "file_hash").is_not(None),
        )
        .limit(1)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_chunk_counts(session: AsyncSession) -> tuple[int, int]:
    """Return (live_entity_chunks_count, faq_chunks_count)."""
    faq_types = [
        KnowledgeEntityType.PLATFORM,
        KnowledgeEntityType.ORG_GUIDE,
        KnowledgeEntityType.ADMIN_GUIDE,
    ]
    faq_stmt = select(func.count(KnowledgeChunk.id)).where(
        KnowledgeChunk.entity_type.in_(faq_types),
        KnowledgeChunk.entity_id.is_(None),
    )
    total_stmt = select(func.count(KnowledgeChunk.id))
    faq_count = int((await session.execute(faq_stmt)).scalar_one() or 0)
    total_count = int((await session.execute(total_stmt)).scalar_one() or 0)
    live_count = total_count - faq_count
    return live_count, faq_count


async def sync_platform_faq(
    session: AsyncSession,
    *,
    path: Path,
    language: str,
    file_hash: str | None = None,
    schema_hash: str | None = None,
) -> int:
    if not path.is_file():
        logger.warning("FAQ file missing: %s", path)
        return 0
    if not file_hash:
        file_hash = get_file_sha256(path)
    # Replace prior FAQ / guide chunks so re-ingest stays idempotent.
    await session.execute(
        delete(KnowledgeChunk).where(
            KnowledgeChunk.entity_type.in_(
                [
                    KnowledgeEntityType.PLATFORM,
                    KnowledgeEntityType.ORG_GUIDE,
                    KnowledgeEntityType.ADMIN_GUIDE,
                ]
            ),
            KnowledgeChunk.entity_id.is_(None),
            KnowledgeChunk.language == language,
        )
    )
    raw = json.loads(path.read_text(encoding="utf-8"))
    faq_items = []
    for item in raw:
        content = (item.get("content") or "").strip()
        if not content:
            continue
        source = item.get("source") or "platform"
        audience = (item.get("audience") or "all").strip().lower()
        title = str(source).replace("_", " ").title()
        entity_type = _entity_type_for_faq_item(item)
        faq_items.append(
            {
                "entity_type": entity_type,
                "entity_id": None,
                "org_id": None,
                "title": title,
                "content": content,
                "metadata_json": {
                    "source": source,
                    "audience": audience,
                    "file_hash": file_hash,
                },
            }
        )
    return await _embed_and_save_chunks(
        session, faq_items, language, "platform FAQs", schema_hash=schema_hash
    )


async def get_stored_schema_hash(session: AsyncSession) -> str | None:
    """Return the schema_hash stored in knowledge chunk metadata."""
    stmt = (
        select(func.jsonb_extract_path_text(KnowledgeChunk.metadata_json, "schema_hash"))
        .where(
            func.jsonb_extract_path_text(KnowledgeChunk.metadata_json, "schema_hash").is_not(None),
        )
        .limit(1)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def already_indexed(session: AsyncSession) -> int:
    """Return count of existing knowledge chunks."""
    result = await session.execute(select(func.count(KnowledgeChunk.id)))
    return int(result.scalar_one() or 0)


async def ingest(
    *,
    language: str,
    clear: bool,
    force: bool = False,
    database_url: str | None,
    faq_file: Path,
    schema_file: Path = DEFAULT_SCHEMA_RAG,
    skip_faq: bool,
) -> None:
    settings = get_settings()
    url = resolve_database_url(database_url or settings.database_url)
    engine = create_async_engine(url, echo=False, pool_pre_ping=True)
    session_factory = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
    )

    try:
        await ensure_rag_schema(engine, schema_file=schema_file)
        async with session_factory() as session:
            current_faq_hash = (
                get_file_sha256(faq_file) if (not skip_faq and faq_file.is_file()) else None
            )
            current_schema_hash = get_file_sha256(schema_file) if schema_file.is_file() else None
            live_count, faq_count = await get_chunk_counts(session)
            stored_faq_hash = (
                await get_stored_faq_hash(session, language=language) if faq_count > 0 else None
            )
            stored_schema_hash = (
                await get_stored_schema_hash(session) if (live_count + faq_count) > 0 else None
            )

            schema_changed = bool(
                current_schema_hash
                and (stored_schema_hash is None or current_schema_hash != stored_schema_hash)
            )
            faq_changed = bool(
                current_faq_hash
                and (stored_faq_hash is None or current_faq_hash != stored_faq_hash)
            )

            if clear:
                await session.execute(delete(KnowledgeChunk))
                await session.commit()
                logger.info("Cleared knowledge_chunk table")
                live_count = 0
                faq_count = 0

            # If live catalog is already indexed and schema is unchanged:
            if live_count > 0 and not force and not clear and not schema_changed:
                if not faq_changed and faq_count > 0:
                    logger.info(
                        "Knowledge index, RAG schema, and FAQ file are up-to-date "
                        "(%d live chunks, %d FAQ chunks, schema_hash=%s, faq_hash=%s). "
                        "Skipping ingestion. Use --force to re-index.",
                        live_count,
                        faq_count,
                        current_schema_hash[:8] if current_schema_hash else "none",
                        current_faq_hash[:8] if current_faq_hash else "none",
                    )
                    return

                if faq_changed:
                    logger.info(
                        "Detected changes in %s (hash: %s -> %s). Re-ingesting FAQ chunks...",
                        faq_file.name,
                        stored_faq_hash[:8] if stored_faq_hash else "none",
                        current_faq_hash[:8] if current_faq_hash else "none",
                    )
                    n_faq = await sync_platform_faq(
                        session,
                        path=faq_file,
                        language=language,
                        file_hash=current_faq_hash,
                        schema_hash=current_schema_hash,
                    )
                    await session.commit()
                    logger.info(
                        "Updated %d FAQ chunks from %s. Live catalog remains indexed (%d chunks).",
                        n_faq,
                        faq_file.name,
                        live_count,
                    )
                    return

            # Full index required (live_count == 0, force, or schema_changed):
            if schema_changed and (live_count + faq_count) > 0:
                logger.info(
                    "Detected changes in %s (hash: %s -> %s). Re-indexing all knowledge chunks under new schema...",
                    schema_file.name,
                    stored_schema_hash[:8] if stored_schema_hash else "none",
                    current_schema_hash[:8] if current_schema_hash else "none",
                )
                await session.execute(delete(KnowledgeChunk))
                await session.commit()
            elif force:
                await session.execute(delete(KnowledgeChunk))
                await session.commit()
                logger.info("Cleared knowledge_chunk table for force re-index")

            n_live = await sync_from_platform(
                session, language=language, schema_hash=current_schema_hash
            )
            n_faq = 0
            if not skip_faq and faq_file.is_file():
                n_faq = await sync_platform_faq(
                    session,
                    path=faq_file,
                    language=language,
                    file_hash=current_faq_hash,
                    schema_hash=current_schema_hash,
                )
            await session.commit()
            logger.info(
                "Ingested %s live entity chunks + %s platform FAQ chunks (%s)",
                n_live,
                n_faq,
                language,
            )
    finally:
        await engine.dispose()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Ingest SalonDesk semantic search index from live DB"
    )
    parser.add_argument("--language", default="en")
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Delete all knowledge_chunk rows before re-index",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-indexing even if knowledge_chunk table already has records",
    )
    parser.add_argument("--database-url", default=None)
    parser.add_argument("--faq-file", type=Path, default=DEFAULT_FAQ)
    parser.add_argument("--schema-file", type=Path, default=DEFAULT_SCHEMA_RAG)
    parser.add_argument(
        "--skip-faq",
        action="store_true",
        help="Only index live orgs/services (skip data/knowledge_en.json)",
    )
    return parser


def main(argv: list[str] | None = None) -> None:
    args = build_parser().parse_args(argv)
    asyncio.run(
        ingest(
            language=args.language,
            clear=args.clear,
            force=args.force,
            database_url=args.database_url,
            faq_file=args.faq_file,
            schema_file=args.schema_file,
            skip_faq=args.skip_faq,
        )
    )


if __name__ == "__main__":
    main()
