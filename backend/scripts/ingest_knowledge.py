"""Build semantic index from live SalonDesk data (+ optional platform FAQ JSON).

PRD: AI recommendations must use actual organization/service/pricing data.

Usage (from backend/):
  uv run python -m app.scripts.ingest_knowledge --clear
  uv run python -m app.scripts.ingest_knowledge --database-url 'postgresql+asyncpg://…'
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import uuid
from pathlib import Path

from sqlalchemy import delete, select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.database import Base
from app.core.database_url import resolve_database_url
from app.models.enums import (
    KnowledgeEntityType,
    OrganizationStatus,
    ServiceStatus,
)
from app.models.knowledge import KnowledgeChunk
from app.models.organization import Organization, OrgSettings
from app.models.policy import OrgCancellationPolicy
from app.models.service import Service, ServiceCategory
from app.services.embeddings import get_embedding

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("ingest_knowledge")

# scripts/ingest_knowledge.py → backend/
BACKEND_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_FAQ = BACKEND_ROOT / "data" / "knowledge_en.json"


async def ensure_rag_schema(engine) -> None:
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


def _service_document(service: Service, settings: OrgSettings | None) -> tuple[str, str, dict]:
    org = service.organization
    category = service.category
    address = settings.physical_address if settings else None
    title = f"{service.name} — {org.name if org else 'Salon'}"
    parts = [
        service.name,
        org.name if org else "",
        category.name if category else "",
        service.description or "",
        f"price {service.base_price}",
        f"{service.duration_minutes} minutes",
        address or "",
    ]
    content = " | ".join(p for p in parts if p)
    meta = {
        "service_id": str(service.id),
        "organization_id": str(service.organization_id),
        "organization_name": org.name if org else None,
        "category_name": category.name if category else None,
        "base_price": str(service.base_price),
        "duration_minutes": service.duration_minutes,
        "physical_address": address,
    }
    return title, content, meta


async def sync_from_platform(
    session: AsyncSession,
    *,
    language: str,
) -> int:
    """Index approved orgs + active services (+ categories, active policies)."""
    count = 0

    cat_result = await session.execute(select(ServiceCategory))
    for cat in cat_result.scalars().all():
        title = cat.name
        content = f"Service category: {cat.name}. {cat.description or ''}".strip()
        embedding = await get_embedding(content)
        session.add(
            KnowledgeChunk(
                entity_type=KnowledgeEntityType.CATEGORY,
                entity_id=cat.id,
                org_id=None,
                title=title,
                content=content,
                language=language,
                embedding=embedding,
                metadata_json={"category_id": str(cat.id)},
                is_active=True,
            )
        )
        count += 1

    org_result = await session.execute(
        select(Organization).where(Organization.status == OrganizationStatus.APPROVED)
    )
    orgs = list(org_result.scalars().all())
    settings_map: dict[uuid.UUID, OrgSettings] = {}
    if orgs:
        s_result = await session.execute(
            select(OrgSettings).where(OrgSettings.org_id.in_([o.id for o in orgs]))
        )
        settings_map = {s.org_id: s for s in s_result.scalars().all()}

    for org in orgs:
        settings = settings_map.get(org.id)
        title = org.name
        content = " | ".join(
            p
            for p in [
                org.name,
                org.description or "",
                settings.physical_address if settings else "",
                settings.timezone if settings else "",
            ]
            if p
        )
        embedding = await get_embedding(content)
        session.add(
            KnowledgeChunk(
                entity_type=KnowledgeEntityType.ORGANIZATION,
                entity_id=org.id,
                org_id=org.id,
                title=title,
                content=content,
                language=language,
                embedding=embedding,
                metadata_json={
                    "organization_id": str(org.id),
                    "physical_address": settings.physical_address if settings else None,
                    "timezone": settings.timezone if settings else None,
                    "lat": str(settings.lat) if settings and settings.lat is not None else None,
                    "lng": str(settings.lng) if settings and settings.lng is not None else None,
                },
                is_active=True,
            )
        )
        count += 1

    svc_result = await session.execute(
        select(Service)
        .options(
            selectinload(Service.organization),
            selectinload(Service.category),
        )
        .where(Service.status == ServiceStatus.ACTIVE)
    )
    for service in svc_result.scalars().all():
        org = service.organization
        if org is None or org.status != OrganizationStatus.APPROVED:
            continue
        title, content, meta = _service_document(service, settings_map.get(service.organization_id))
        embedding = await get_embedding(content)
        session.add(
            KnowledgeChunk(
                entity_type=KnowledgeEntityType.SERVICE,
                entity_id=service.id,
                org_id=service.organization_id,
                title=title,
                content=content,
                language=language,
                embedding=embedding,
                metadata_json=meta,
                is_active=True,
            )
        )
        count += 1

    # Active cancellation policies (org-scoped help)
    from app.models.enums import OrgCancellationPolicyStatus

    pol_result = await session.execute(
        select(OrgCancellationPolicy).where(
            OrgCancellationPolicy.status == OrgCancellationPolicyStatus.ACTIVE
        )
    )
    for policy in pol_result.scalars().all():
        title = f"Cancellation policy — {policy.name}"
        content = f"{policy.name}: {json.dumps(policy.data)}"
        embedding = await get_embedding(content)
        session.add(
            KnowledgeChunk(
                entity_type=KnowledgeEntityType.POLICY,
                entity_id=policy.id,
                org_id=policy.org_id,
                title=title,
                content=content,
                language=language,
                embedding=embedding,
                metadata_json={"policy_id": str(policy.id), "data": policy.data},
                is_active=True,
            )
        )
        count += 1

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


async def sync_platform_faq(
    session: AsyncSession,
    *,
    path: Path,
    language: str,
) -> int:
    if not path.is_file():
        logger.warning("FAQ file missing: %s", path)
        return 0
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
        )
    )
    raw = json.loads(path.read_text(encoding="utf-8"))
    count = 0
    for item in raw:
        content = (item.get("content") or "").strip()
        if not content:
            continue
        source = item.get("source") or "platform"
        audience = (item.get("audience") or "all").strip().lower()
        title = str(source).replace("_", " ").title()
        entity_type = _entity_type_for_faq_item(item)
        embedding = await get_embedding(content)
        session.add(
            KnowledgeChunk(
                entity_type=entity_type,
                entity_id=None,
                org_id=None,
                title=title,
                content=content,
                language=language,
                embedding=embedding,
                metadata_json={"source": source, "audience": audience},
                is_active=True,
            )
        )
        count += 1
    return count


async def ingest(
    *,
    language: str,
    clear: bool,
    database_url: str | None,
    faq_file: Path,
    skip_faq: bool,
) -> None:
    settings = get_settings()
    url = resolve_database_url(database_url or settings.database_url)
    engine = create_async_engine(url, echo=False, pool_pre_ping=True)
    session_factory = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
    )

    try:
        await ensure_rag_schema(engine)
        async with session_factory() as session:
            if clear:
                await session.execute(delete(KnowledgeChunk))
                await session.commit()
                logger.info("Cleared knowledge_chunk table")

            n_live = await sync_from_platform(session, language=language)
            n_faq = 0
            if not skip_faq:
                n_faq = await sync_platform_faq(session, path=faq_file, language=language)
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
    parser.add_argument("--database-url", default=None)
    parser.add_argument("--faq-file", type=Path, default=DEFAULT_FAQ)
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
            database_url=args.database_url,
            faq_file=args.faq_file,
            skip_faq=args.skip_faq,
        )
    )


if __name__ == "__main__":
    main()
