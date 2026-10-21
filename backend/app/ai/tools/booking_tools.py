"""Booking draft/confirm tools shared by chat and voice."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from .booking_confirm import build_confirm_tools
from .booking_lookup import build_lookup_tools
from .booking_manage import build_manage_tools
from .booking_pending import build_pending_tools


def build_booking_tools(
    session_factory: async_sessionmaker[AsyncSession],
    on_booking_success: Callable[[dict[str, Any]], Any] | None = None,
    on_payment_link: Callable[[dict[str, Any]], Any] | None = None,
) -> list:
    """Return LiveKit ``@function_tool`` callables for voice/chat booking confirmation."""
    try:
        from livekit.agents import function_tool
    except ImportError:  # pragma: no cover
        return []

    return [
        *build_confirm_tools(session_factory, on_booking_success, function_tool),
        *build_pending_tools(session_factory, on_payment_link, function_tool),
        *build_manage_tools(session_factory, function_tool),
        *build_lookup_tools(session_factory, function_tool),
    ]
