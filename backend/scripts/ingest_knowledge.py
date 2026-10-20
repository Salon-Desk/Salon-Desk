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
from app.services.embeddings import get_embeddings_batch

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


async def _embed_and_save_chunks(
    session: AsyncSession,
    items: list[dict],
    language: str,
    label: str = "items",
    batch_size: int = 50,
) -> int:
    if not items:
        return 0
    contents = [it["content"] for it in items]
    logger.info("Computing batch embeddings for %d %s...", len(items), label)
    embeddings = await get_embeddings_batch(contents, batch_size=batch_size)
    for it, emb in zip(items, embeddings, strict=True):
        session.add(
            KnowledgeChunk(
                entity_type=it["entity_type"],
                entity_id=it["entity_id"],
                org_id=it["org_id"],
                title=it["title"],
                content=it["content"],
                language=language,
                embedding=emb,
                metadata_json=it["metadata_json"],
                is_active=True,
            )
        )
    return len(items)


async def sync_from_platform(
    session: AsyncSession,
    *,
    language: str,
) -> int:
    """Index approved orgs + active services (+ categories, active policies)."""
    count = 0

    cat_result = await session.execute(select(ServiceCategory))
    cat_items = []
    for cat in cat_result.scalars().all():
        title = cat.name
        content = f"Service category: {cat.name}. {cat.description or ''}".strip()
        cat_items.append(
            {
                "entity_type": KnowledgeEntityType.CATEGORY,
                "entity_id": cat.id,
                "org_id": None,
                "title": title,
                "content": content,
                "metadata_json": {"category_id": str(cat.id)},
            }
        )
    count += await _embed_and_save_chunks(session, cat_items, language, "categories")

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

    org_items = []
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
        org_items.append(
            {
                "entity_type": KnowledgeEntityType.ORGANIZATION,
                "entity_id": org.id,
                "org_id": org.id,
                "title": title,
                "content": content,
                "metadata_json": {
                    "organization_id": str(org.id),
                    "physical_address": settings.physical_address if settings else None,
                    "timezone": settings.timezone if settings else None,
                    "lat": str(settings.lat) if settings and settings.lat is not None else None,
                    "lng": str(settings.lng) if settings and settings.lng is not None else None,
                },
            }
        )
    count += await _embed_and_save_chunks(session, org_items, language, "organizations")

    svc_result = await session.execute(
        select(Service)
        .options(
            selectinload(Service.organization),
            selectinload(Service.category),
        )
        .where(Service.status == ServiceStatus.ACTIVE)
    )
    svc_items = []
    for service in svc_result.scalars().all():
        org = service.organization
        if org is None or org.status != OrganizationStatus.APPROVED:
            continue
        title, content, meta = _service_document(service, settings_map.get(service.organization_id))
        svc_items.append(
            {
                "entity_type": KnowledgeEntityType.SERVICE,
                "entity_id": service.id,
                "org_id": service.organization_id,
                "title": title,
                "content": content,
                "metadata_json": meta,
            }
        )
    count += await _embed_and_save_chunks(session, svc_items, language, "services")

    # Active cancellation policies (org-scoped help)
    from app.models.enums import OrgCancellationPolicyStatus

    pol_result = await session.execute(
        select(OrgCancellationPolicy).where(
            OrgCancellationPolicy.status == OrgCancellationPolicyStatus.ACTIVE
        )
    )
    pol_items = []
    for policy in pol_result.scalars().all():
        data = policy.data or {}
        free_hours = data.get("free_cancel_hours", 24)
        late_fee = data.get("late_cancel_fee_percent", 25)
        no_show_fee = data.get("no_show_fee_percent", 50)
        readable_desc = (
            f"Cancellation and No-Show Policy ({policy.name}): "
            f"Free cancellation is allowed up to {free_hours} hours prior to the appointment with 100% hold release ($0 charged). "
            f"Late cancellation after the {free_hours}-hour deadline incurs an agreed {late_fee}% fee of the service price. "
            f"No-show without notice incurs an agreed {no_show_fee}% fee of the service price. "
            f"All fee captures settle directly into the salon's verified PayPal merchant account."
        )
        pol_items.append(
            {
                "entity_type": KnowledgeEntityType.POLICY,
                "entity_id": policy.id,
                "org_id": policy.org_id,
                "title": f"Cancellation Policy — {policy.name}",
                "content": readable_desc,
                "metadata_json": {"policy_id": str(policy.id), "data": policy.data},
            }
        )
    count += await _embed_and_save_chunks(session, pol_items, language, "cancellation policies")

    # Platform legal & payment policies (Privacy, Terms, PayPal Hold, Booking Consent)
    platform_policy_items = [
        {
            "entity_type": KnowledgeEntityType.PLATFORM,
            "entity_id": None,
            "org_id": None,
            "title": "SalonDesk Privacy Policy & Data Protection",
            "content": (
                "Privacy Policy: SalonDesk prioritizes data security and user privacy. "
                "Payment credentials, card numbers, and banking details are processed exclusively through PayPal's "
                "PCI-DSS compliant infrastructure and are never stored on SalonDesk servers. "
                "Client personal information (name, phone number, email) is collected solely for booking coordination "
                "and appointment reminders with the booked salon. We do not sell personal data to third parties. "
                "Users may request data access or account deletion at any time in their profile settings."
            ),
            "metadata_json": {"topic": "privacy_policy", "category": "legal"},
        },
        {
            "entity_type": KnowledgeEntityType.PLATFORM,
            "entity_id": None,
            "org_id": None,
            "title": "SalonDesk Terms of Service & Agreement",
            "content": (
                "Terms of Service & Platform Agreement: Governs all use of the SalonDesk booking platform. "
                "Clients agree to provide accurate contact information and attend confirmed bookings on time. "
                "Salons agree to honor scheduled services at stated prices and comply with cancellation terms. "
                "SalonDesk provides the booking and software management infrastructure and does not directly employ "
                "stylists or provide salon services. Service disputes or rescheduling requests are handled between the client and salon."
            ),
            "metadata_json": {"topic": "terms_of_service", "category": "legal"},
        },
        {
            "entity_type": KnowledgeEntityType.PLATFORM,
            "entity_id": None,
            "org_id": None,
            "title": "PayPal Authorization Hold Policy & Lifecycle",
            "content": (
                "PayPal Authorization Hold Policy: All client bookings place a $0 upfront authorization hold on the client's "
                "selected PayPal payment method. Funds are not deducted upfront. The authorization reserves the required amount. "
                "Upon service completion, the salon captures 100% of the service price directly into its verified PayPal merchant account. "
                "If the client cancels before the free cancellation deadline, 100% of the hold is voided and released ($0 charged). "
                "In case of a late cancellation or no-show, the agreed penalty fee is captured and the remaining hold is released. "
                "Holds older than 3 days undergo automatic re-authorization to maintain the payment honor window."
            ),
            "metadata_json": {"topic": "paypal_hold", "category": "payments"},
        },
        {
            "entity_type": KnowledgeEntityType.PLATFORM,
            "entity_id": None,
            "org_id": None,
            "title": "Client Booking Consent Agreement",
            "content": (
                "Client Booking Consent & Authorization Terms: During checkout, clients explicitly agree to: "
                "'I authorize a PayPal hold for this booking under the salon cancellation policy.' "
                "This agreement is cryptographically signed and stored with a timestamp and a snapshot of the salon's "
                "active cancellation policy, ensuring transparent and legally enforceable hold authorization."
            ),
            "metadata_json": {"topic": "consent_terms", "category": "legal"},
        },
    ]
    count += await _embed_and_save_chunks(
        session, platform_policy_items, language, "core platform policies"
    )

    # Staff members and ratings
    from app.models.enums import FeedbackModerationStatus, UserRole, UserStatus
    from app.models.feedback import ClientFeedback
    from app.models.user import User

    staff_result = await session.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(
            User.role.in_([UserRole.STYLIST, UserRole.ORG_OWNER, UserRole.RECEPTION]),
            User.status == UserStatus.ACTIVE,
        )
    )
    staff_items = []
    for staff in staff_result.scalars().all():
        if not staff.org_id:
            continue
        org = next((o for o in orgs if o.id == staff.org_id), None)
        first_name = staff.profile.first_name if staff.profile else ""
        last_name = staff.profile.last_name if staff.profile else ""
        full_name = f"{first_name} {last_name}".strip() or staff.email
        staff_items.append(
            {
                "entity_type": KnowledgeEntityType.ORGANIZATION,
                "entity_id": staff.id,
                "org_id": staff.org_id,
                "title": f"Staff Member — {full_name}",
                "content": (
                    f"Staff member {full_name} at {org.name if org else 'salon'}. "
                    f"Role: {staff.role.value}. Email: {staff.email}."
                ),
                "metadata_json": {"staff_id": str(staff.id), "role": staff.role.value},
            }
        )
    count += await _embed_and_save_chunks(session, staff_items, language, "staff members")

    # Client reviews & feedback
    feedback_result = await session.execute(
        select(ClientFeedback).where(ClientFeedback.status == FeedbackModerationStatus.APPROVED)
    )
    fb_items = []
    for fb in feedback_result.scalars().all():
        org = next((o for o in orgs if o.id == fb.org_id), None)
        fb_items.append(
            {
                "entity_type": KnowledgeEntityType.ORGANIZATION,
                "entity_id": fb.id,
                "org_id": fb.org_id,
                "title": f"Client Review — {org.name if org else 'Salon'} ({fb.rating} Stars)",
                "content": (
                    f"Client review for {org.name if org else 'salon'}: rating {fb.rating} out of 5 stars. "
                    f"Comment: {fb.comment or 'Great service and experience.'}"
                ),
                "metadata_json": {"feedback_id": str(fb.id), "rating": fb.rating},
            }
        )
    count += await _embed_and_save_chunks(session, fb_items, language, "client reviews")

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
                "metadata_json": {"source": source, "audience": audience},
            }
        )
    return await _embed_and_save_chunks(session, faq_items, language, "platform FAQs")


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
