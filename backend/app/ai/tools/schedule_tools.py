"""Availability and shift tools shared by chat and voice."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker


def build_schedule_tools(_session_factory: async_sessionmaker[AsyncSession]) -> list:
    """Placeholder for working-hours / capacity tools (extend as booking flows mature)."""
    return []
