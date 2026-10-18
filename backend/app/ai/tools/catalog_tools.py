"""Catalog discovery tools (text chat + voice agent)."""

from __future__ import annotations

import json
from collections.abc import Callable
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.ai.portal import is_support_portal, normalize_portal
from app.ai.rag_service import retrieve_context
from app.core.config import get_settings


def build_catalog_tools(
    session_factory: async_sessionmaker[AsyncSession],
    user_location_getter: Callable[[], tuple[float | None, float | None]] | None = None,
    on_discovery_results: Callable[[dict[str, Any]], Any] | None = None,
):
    """Return LiveKit ``@function_tool`` callables for semantic catalog search."""

    try:
        from livekit.agents import function_tool
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError("livekit-agents is required for voice tools") from exc

    @function_tool()
    async def search_salon_services(query: str, org_id: str | None = None) -> str:
        """Semantically search approved salons and active services for the client."""
        settings = get_settings()
        parsed_org: UUID | None = None
        if org_id:
            try:
                parsed_org = UUID(org_id)
            except ValueError:
                parsed_org = None
        u_lat, u_lng = None, None
        if user_location_getter:
            try:
                u_lat, u_lng = user_location_getter()
            except Exception:
                u_lat, u_lng = None, None
        async with session_factory() as session:
            retrieved = await retrieve_context(
                session,
                query,
                chunk_limit=settings.voice_rag_chunk_limit,
                org_id=parsed_org,
                settings=settings,
                user_lat=u_lat,
                user_lng=u_lng,
                portal="client",
            )
        payload = {
            "intent": retrieved.intent,
            "language": retrieved.detected_language,
            "recommendations": [
                {
                    "service_id": str(r.service_id),
                    "organization_id": str(r.organization_id),
                    "name": r.name,
                    "organization_name": r.organization_name,
                    "base_price": str(r.base_price),
                    "duration_minutes": r.duration_minutes,
                    "category_name": r.category_name,
                    "physical_address": r.physical_address,
                    "distance_km": r.distance_km,
                    "image_url": getattr(r, "image_url", None),
                    "organization_picture": getattr(r, "organization_picture", None),
                }
                for r in retrieved.recommendations
            ],
            "organizations": [
                {
                    "id": str(o.id),
                    "name": o.name,
                    "description": o.description,
                    "picture": o.picture,
                    "physical_address": o.physical_address,
                    "rating": o.rating,
                    "service_count": o.service_count,
                    "distance_km": o.distance_km,
                }
                for o in retrieved.organizations
            ],
            "context": retrieved.context_text,
        }
        if on_discovery_results:
            try:
                import inspect

                res = on_discovery_results(payload)
                if inspect.isawaitable(res):
                    await res
            except Exception:
                pass
        return json.dumps(payload)

    return [search_salon_services]


def build_support_tools(
    session_factory: async_sessionmaker[AsyncSession],
    *,
    portal: str,
):
    """Help-desk tools for merchant / admin voice agents (no booking)."""

    try:
        from livekit.agents import function_tool
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError("livekit-agents is required for voice tools") from exc

    mode = normalize_portal(portal)

    @function_tool()
    async def search_help_docs(query: str) -> str:
        """Search SalonDesk how-to and support docs for this portal."""
        settings = get_settings()
        async with session_factory() as session:
            retrieved = await retrieve_context(
                session,
                query,
                chunk_limit=settings.voice_rag_chunk_limit,
                settings=settings,
                portal=mode,
            )
        payload = {
            "intent": retrieved.intent,
            "language": retrieved.detected_language,
            "context": retrieved.context_text,
            "citations": [
                {
                    "entity_type": c.entity_type,
                    "title": c.title,
                    "content": c.content,
                }
                for c in retrieved.chunks
            ],
        }
        return json.dumps(payload)

    return [search_help_docs]


def build_voice_tools(
    session_factory: async_sessionmaker[AsyncSession],
    user_location_getter: Callable[[], tuple[float | None, float | None]] | None = None,
    on_auth_success: Callable[[dict[str, Any]], Any] | None = None,
    on_booking_success: Callable[[dict[str, Any]], Any] | None = None,
    on_discovery_results: Callable[[dict[str, Any]], Any] | None = None,
    portal: str = "client",
):
    """Aggregate tools for the voice worker (booking or support by portal)."""
    if is_support_portal(portal):
        return build_support_tools(session_factory, portal=portal)

    from app.ai.tools.auth_tools import build_auth_tools
    from app.ai.tools.booking_tools import build_booking_tools
    from app.ai.tools.schedule_tools import build_schedule_tools

    tools = build_catalog_tools(
        session_factory,
        user_location_getter=user_location_getter,
        on_discovery_results=on_discovery_results,
    )
    tools.extend(build_schedule_tools(session_factory))
    tools.extend(build_booking_tools(session_factory, on_booking_success=on_booking_success))
    tools.extend(build_auth_tools(session_factory, on_auth_success=on_auth_success))
    return tools


def build_rag_tool(session_factory: async_sessionmaker[AsyncSession]):
    tools = build_catalog_tools(session_factory)
    return tools[0]
