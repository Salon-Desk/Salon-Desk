"""Schema, user, and cover helpers for the demo seed."""

from __future__ import annotations

import enum
import logging
from decimal import Decimal
from functools import lru_cache

from sqlalchemy import Enum as SAEnum
from sqlalchemy import inspect, select, text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

import app.models  # noqa: F401 — register all models on metadata
from app.core.database import Base
from app.core.security import hash_password
from app.models.enums import UserRole, UserStatus
from app.models.user import Profile, User

from .constants import DEFAULT_PASSWORD, PLATFORM_ADMIN_EMAIL
from .images import SERVICE_COVER_IMAGES

logger = logging.getLogger("seed")


@lru_cache(maxsize=1)
def _demo_password_hash() -> str:
    return hash_password(DEFAULT_PASSWORD)


async def _ensure_pgvector(conn) -> None:
    try:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "Could not enable pgvector extension (RAG needs pgvector image): %s",
            exc,
        )


async def _ensure_enum_values(conn) -> None:
    # Postgres enums are not altered by create_all — add new values if missing.
    for enum_name, value in (
        ("booking_status", "PENDING_PAYMENT"),
        ("payment_hold_status", "PENDING"),
        ("payment_hold_status", "REAUTHORIZED"),
        ("commission_record_status", "ACCRUED"),
        ("commission_record_status", "INVOICED"),
        ("commission_record_status", "PAID"),
        ("commission_record_status", "WAIVED"),
        ("org_commission_invoice_status", "DRAFT"),
        ("org_commission_invoice_status", "ISSUED"),
        ("org_commission_invoice_status", "PAID"),
        ("org_commission_invoice_status", "OVERDUE"),
        ("org_commission_invoice_status", "VOID"),
        ("payment_capture_type", "LATE_CANCEL"),
        ("feedback_moderation_status", "pending"),
        ("feedback_moderation_status", "approved"),
        ("feedback_moderation_status", "rejected"),
        ("dispute_case_status", "OPEN"),
        ("dispute_case_status", "INVESTIGATING"),
        ("dispute_case_status", "EVIDENCE_READY"),
        ("dispute_case_status", "WAITING_FOR_SELLER_RESPONSE"),
        ("dispute_case_status", "EVIDENCE_SUBMITTED"),
        ("dispute_case_status", "UNDER_REVIEW"),
        ("dispute_case_status", "OFFER_MADE"),
        ("dispute_case_status", "RESOLVED_SELLER_FAVOR"),
        ("dispute_case_status", "RESOLVED_BUYER_FAVOR"),
        ("dispute_recommendation", "FILE_EVIDENCE"),
        ("dispute_recommendation", "MAKE_OFFER"),
        ("waitlist_status", "WAITING"),
        ("waitlist_status", "OFFERED"),
        ("waitlist_status", "RESCUED_FILLED"),
        ("waitlist_status", "EXPIRED"),
    ):
        await conn.execute(
            text(
                f"""
                DO $$ BEGIN
                    ALTER TYPE {enum_name} ADD VALUE IF NOT EXISTS '{value}';
                EXCEPTION
                    WHEN duplicate_object THEN null;
                    WHEN undefined_object THEN null;
                END $$;
                """
            )
        )


def _default_sql(column, dialect) -> str | None:
    """SQL literal for a column's scalar/clause default, or None when it has none."""
    if column.server_default is not None:
        arg = column.server_default.arg
        return arg if isinstance(arg, str) else str(arg.compile(dialect=dialect))
    default = column.default
    if default is None:
        return None
    if getattr(default, "is_clause_element", False):
        return str(default.arg.compile(dialect=dialect))
    if not getattr(default, "is_scalar", False):
        return None
    value = default.arg
    if isinstance(value, enum.Enum):
        value = value.value
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int | float | Decimal):
        return str(value)
    if isinstance(value, str):
        return "'" + value.replace("'", "''") + "'"
    return None


def _sync_model_columns(sync_conn) -> list[str]:
    """
    Bring existing tables in line with the models: create_all never alters tables, so a
    database created by an older build is missing newer columns (and inserts then fail).
    """
    insp = inspect(sync_conn)
    dialect = sync_conn.dialect
    existing_tables = set(insp.get_table_names())
    applied: list[str] = []
    for table in Base.metadata.sorted_tables:
        if table.name not in existing_tables:
            continue
        db_columns = {c["name"]: c for c in insp.get_columns(table.name)}
        model_columns = {c.name for c in table.columns}
        for column in table.columns:
            if column.name in db_columns:
                continue
            if isinstance(column.type, SAEnum):
                column.type.create(sync_conn, checkfirst=True)
            stmt = (
                f'ALTER TABLE "{table.name}" ADD COLUMN IF NOT EXISTS "{column.name}" '
                f"{column.type.compile(dialect=dialect)}"
            )
            default = _default_sql(column, dialect)
            if default is not None:
                stmt += f" DEFAULT {default}"
            sync_conn.exec_driver_sql(stmt)
            applied.append(stmt)
        # Legacy NOT NULL columns the models no longer write would reject every insert.
        for name, info in db_columns.items():
            if name not in model_columns and not info["nullable"] and info.get("default") is None:
                stmt = f'ALTER TABLE "{table.name}" ALTER COLUMN "{name}" DROP NOT NULL'
                sync_conn.exec_driver_sql(stmt)
                applied.append(stmt)
    return applied


async def _ensure_additive_columns(conn) -> None:
    """Patch schema drift on databases created by older builds, then backfill old rows."""
    for stmt in await conn.run_sync(_sync_model_columns):
        logger.info("Schema drift patched: %s", stmt)

    # Backfill NOT NULL snapshot columns so subsequent inserts/reads are safe on old rows.
    await conn.execute(
        text(
            """
            UPDATE booking
            SET agreed_hold_amount = COALESCE(agreed_hold_amount, total_price),
                agreed_no_show_fee = COALESCE(agreed_no_show_fee, ROUND(total_price * 0.5, 2)),
                agreed_late_cancel_fee = COALESCE(
                    agreed_late_cancel_fee,
                    ROUND(
                        total_price * COALESCE(
                            NULLIF((policy_snapshot_json->>'late_cancel_fee_percent')::numeric, 0),
                            NULLIF((policy_snapshot_json->>'no_show_fee_percent')::numeric, 0),
                            25
                        ) / 100,
                        2
                    )
                ),
                free_cancel_deadline_at = COALESCE(
                    free_cancel_deadline_at,
                    starts_at - INTERVAL '24 hours'
                ),
                policy_snapshot_json = COALESCE(
                    policy_snapshot_json,
                    '{"name": "Default", "free_cancel_hours": 24, "no_show_fee_percent": 50, "late_cancel_fee_percent": 25}'::jsonb
                ),
                commission_snapshot = COALESCE(
                    commission_snapshot,
                    '{"type": "percentage", "percentage": "5.0000", "flat": null}'::jsonb
                )
            WHERE agreed_hold_amount IS NULL
               OR agreed_no_show_fee IS NULL
               OR agreed_late_cancel_fee IS NULL
               OR free_cancel_deadline_at IS NULL
               OR policy_snapshot_json IS NULL
               OR commission_snapshot IS NULL
            """
        )
    )
    await conn.execute(
        text(
            """
            UPDATE booking_service bs
            SET base_price = COALESCE(
                    bs.base_price,
                    (SELECT s.base_price FROM service s WHERE s.id = bs.service_id),
                    0
                ),
                service_policy_snapshot_json = COALESCE(bs.service_policy_snapshot_json, '{}'::jsonb),
                commission_rule_snapshot_json = COALESCE(bs.commission_rule_snapshot_json, '{}'::jsonb)
            WHERE bs.base_price IS NULL
               OR bs.service_policy_snapshot_json IS NULL
               OR bs.commission_rule_snapshot_json IS NULL
            """
        )
    )
    await conn.execute(
        text(
            """
            UPDATE payment_hold
            SET captured_amount = COALESCE(captured_amount, 0),
                reauthorization_count = COALESCE(reauthorization_count, 0)
            WHERE captured_amount IS NULL OR reauthorization_count IS NULL
            """
        )
    )
    # Copy legacy single auth id if present.
    await conn.execute(
        text(
            """
            DO $$ BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'payment_hold' AND column_name = 'paypal_authorization_id'
                ) THEN
                    UPDATE payment_hold
                    SET parent_authorization_id = COALESCE(parent_authorization_id, paypal_authorization_id),
                        latest_authorization_id = COALESCE(latest_authorization_id, paypal_authorization_id)
                    WHERE paypal_authorization_id IS NOT NULL;
                END IF;
            END $$;
            """
        )
    )


async def _drop_public_schema(conn) -> None:
    """Wipe the public schema including orphan tables not on SQLAlchemy metadata."""
    await conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
    await conn.execute(text("CREATE SCHEMA public"))
    await conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
    await conn.execute(text("GRANT ALL ON SCHEMA public TO postgres"))


async def ensure_schema(engine: AsyncEngine, *, recreate: bool = False) -> None:
    async with engine.begin() as conn:
        if recreate:
            await _drop_public_schema(conn)
            logger.info("Dropped public schema (CASCADE) for schema recreate")
        await _ensure_pgvector(conn)
        await conn.run_sync(Base.metadata.create_all)
        if not recreate:
            await _ensure_additive_columns(conn)
        await _ensure_enum_values(conn)
    logger.info("Schema ensured (create_all%s)", ", recreated" if recreate else "")


async def clear_database(session: AsyncSession) -> None:
    """Wipe all application tables (PostgreSQL TRUNCATE CASCADE)."""
    reset_allocated_handles()
    tables = list(Base.metadata.sorted_tables)
    if not tables:
        logger.warning("No tables registered on metadata; nothing to clear")
        return
    names = ", ".join(f'"{table.name}"' for table in tables)
    await session.execute(text(f"TRUNCATE {names} RESTART IDENTITY CASCADE"))
    await session.commit()
    logger.info("Cleared %s tables", len(tables))


_allocated_handles: set[str] = set()


def reset_allocated_handles() -> None:
    """Reset the set of handles allocated during seeding."""
    _allocated_handles.clear()


def build_user(
    *,
    email: str,
    role: UserRole,
    first_name: str,
    last_name: str,
    org_id=None,
    phone: str | None = None,
    picture: str | None = None,
    handle: str | None = None,
) -> User:
    user = User(
        email=email.lower(),
        password_hash=_demo_password_hash(),
        role=role,
        status=UserStatus.ACTIVE,
        org_id=org_id,
    )
    if handle:
        base_handle = handle.strip().lstrip("@").lower()
    else:
        local_part, _, domain_part = email.lower().partition("@")
        local = local_part.replace(".", "_").replace("+", "_").replace("-", "_")
        domain_slug = (
            domain_part.split(".")[0].replace(".", "_").replace("-", "_") if domain_part else ""
        )
        if domain_slug and domain_slug not in {"example", "salondesk"}:
            base_handle = f"{local}_{domain_slug}"
        else:
            base_handle = local

    base_handle = base_handle[:64]
    candidate = base_handle
    counter = 1
    while candidate in _allocated_handles:
        suffix = f"_{counter}"
        candidate = f"{base_handle[: 64 - len(suffix)]}{suffix}"
        counter += 1

    _allocated_handles.add(candidate)

    user.profile = Profile(
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        picture=picture,
        handle=candidate,
    )
    return user


async def already_seeded(session: AsyncSession) -> bool:
    result = await session.execute(
        select(User.id).where(User.email == PLATFORM_ADMIN_EMAIL).limit(1)
    )
    return result.scalar_one_or_none() is not None


class CoverAllocator:
    """Assign a unique cover, then a secondary image, matching the original index walk."""

    def __init__(self) -> None:
        self._index = 0

    def allocate(self, preferred: str) -> str:
        if self._index < len(SERVICE_COVER_IMAGES):
            cover = SERVICE_COVER_IMAGES[self._index]
            self._index += 1
            return cover
        return preferred or SERVICE_COVER_IMAGES[0]

    def secondary(self, cover: str) -> str:
        if not SERVICE_COVER_IMAGES:
            return cover
        return SERVICE_COVER_IMAGES[self._index % len(SERVICE_COVER_IMAGES)]
