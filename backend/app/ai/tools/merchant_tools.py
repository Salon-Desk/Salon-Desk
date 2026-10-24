"""Merchant portal tools: navigation, UI interaction, and DB read access."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from .merchant_reads import build_merchant_read_tools
from .merchant_ui import build_merchant_ui_tools


def build_merchant_tools(
    session_factory: async_sessionmaker[AsyncSession],
) -> list:
    """Return LiveKit ``@function_tool`` callables for merchant/admin assistance."""
    try:
        from livekit.agents import function_tool
    except ImportError:  # pragma: no cover
        return []

    return [
        *build_merchant_ui_tools(function_tool),
        *build_merchant_read_tools(session_factory, function_tool),
    ]
