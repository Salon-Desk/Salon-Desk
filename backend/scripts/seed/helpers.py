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


async def ensure_schema(engine: AsyncEngine) -> None:
    async with engine.begin() as conn:
        try:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "Could not enable pgvector extension (RAG needs pgvector image): %s",
                exc,
            )
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Schema ensured (create_all)")


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
