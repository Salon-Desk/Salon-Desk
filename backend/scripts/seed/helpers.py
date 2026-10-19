"""Schema, user, and cover helpers for the demo seed."""

from __future__ import annotations

import logging
from functools import lru_cache

from sqlalchemy import select, text
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


async def _ensure_additive_columns(conn) -> None:
    """create_all will not add columns to existing tables — patch demo schema drift."""
    for stmt in (
        'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ',
        "ALTER TABLE booking ADD COLUMN IF NOT EXISTS agreed_hold_amount NUMERIC(10, 2)",
        "ALTER TABLE booking ADD COLUMN IF NOT EXISTS agreed_no_show_fee NUMERIC(10, 2)",
        "ALTER TABLE booking ADD COLUMN IF NOT EXISTS free_cancel_deadline_at TIMESTAMPTZ",
        "ALTER TABLE booking ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ",
        "ALTER TABLE booking ADD COLUMN IF NOT EXISTS policy_snapshot_json JSONB",
        "ALTER TABLE booking ADD COLUMN IF NOT EXISTS commission_snapshot JSONB",
        "ALTER TABLE booking ADD COLUMN IF NOT EXISTS cancellation_fee_json JSONB",
        "ALTER TABLE booking_service ADD COLUMN IF NOT EXISTS base_price NUMERIC(10, 2)",
        "ALTER TABLE booking_service ADD COLUMN IF NOT EXISTS service_policy_snapshot_json JSONB",
        "ALTER TABLE booking_service ADD COLUMN IF NOT EXISTS commission_rule_snapshot_json JSONB",
        "ALTER TABLE payment_hold ADD COLUMN IF NOT EXISTS parent_authorization_id VARCHAR(100)",
        "ALTER TABLE payment_hold ADD COLUMN IF NOT EXISTS latest_authorization_id VARCHAR(100)",
        "ALTER TABLE payment_hold ADD COLUMN IF NOT EXISTS honor_expires_at TIMESTAMPTZ",
        "ALTER TABLE payment_hold ADD COLUMN IF NOT EXISTS reauthorization_count INTEGER DEFAULT 0",
    ):
        await conn.execute(text(stmt))

    # Backfill NOT NULL snapshot columns so subsequent inserts/reads are safe on old rows.
    await conn.execute(
        text(
            """
            UPDATE booking
            SET agreed_hold_amount = COALESCE(agreed_hold_amount, total_price),
                agreed_no_show_fee = COALESCE(agreed_no_show_fee, ROUND(total_price * 0.5, 2)),
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
               OR free_cancel_deadline_at IS NULL
               OR policy_snapshot_json IS NULL
               OR commission_snapshot IS NULL
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


async def ensure_schema(engine: AsyncEngine, *, recreate: bool = False) -> None:
    async with engine.begin() as conn:
        await _ensure_pgvector(conn)
        if recreate:
            await conn.run_sync(Base.metadata.drop_all)
            logger.info("Dropped all tables for schema recreate")
        await conn.run_sync(Base.metadata.create_all)
        if not recreate:
            await _ensure_additive_columns(conn)
        await _ensure_enum_values(conn)
    logger.info("Schema ensured (create_all%s)", ", recreated" if recreate else "")


async def clear_database(session: AsyncSession) -> None:
    """Wipe all application tables (PostgreSQL TRUNCATE CASCADE)."""
    tables = list(Base.metadata.sorted_tables)
    if not tables:
        logger.warning("No tables registered on metadata; nothing to clear")
        return
    names = ", ".join(f'"{table.name}"' for table in tables)
    await session.execute(text(f"TRUNCATE {names} RESTART IDENTITY CASCADE"))
    await session.commit()
    logger.info("Cleared %s tables", len(tables))


def build_user(
    *,
    email: str,
    role: UserRole,
    first_name: str,
    last_name: str,
    org_id=None,
    phone: str | None = None,
    picture: str | None = None,
) -> User:
    user = User(
        email=email.lower(),
        password_hash=_demo_password_hash(),
        role=role,
        status=UserStatus.ACTIVE,
        org_id=org_id,
    )
    user.profile = Profile(
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        picture=picture,
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
