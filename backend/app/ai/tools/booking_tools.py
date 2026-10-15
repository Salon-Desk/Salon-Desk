"""Booking draft/confirm tools shared by chat and voice."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker


def build_booking_tools(_session_factory: async_sessionmaker[AsyncSession]) -> list:
    """Placeholder for hold/draft booking tools (extend with auth-aware booking_service)."""
    return []
