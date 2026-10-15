"""Catalog discovery tools (text chat + voice agent)."""

from __future__ import annotations

import json
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.ai.rag_service import retrieve_context
from app.core.config import get_settings


def build_catalog_tools(session_factory: async_sessionmaker[AsyncSession]):
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
        async with session_factory() as session:
            retrieved = await retrieve_context(
                session,
                query,
                chunk_limit=settings.voice_rag_chunk_limit,
                org_id=parsed_org,
                settings=settings,
            )
        return json.dumps(
            {
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
                    }
                    for r in retrieved.recommendations
                ],
                "context": retrieved.context_text,
            }
        )

    return [search_salon_services]


def build_voice_tools(session_factory: async_sessionmaker[AsyncSession]):
    """Aggregate catalog, schedule, and booking tools for the voice worker."""
    from app.ai.tools.booking_tools import build_booking_tools
    from app.ai.tools.schedule_tools import build_schedule_tools

    tools = build_catalog_tools(session_factory)
    tools.extend(build_schedule_tools(session_factory))
    tools.extend(build_booking_tools(session_factory))
    return tools


def build_rag_tool(session_factory: async_sessionmaker[AsyncSession]):
    tools = build_catalog_tools(session_factory)
    return tools[0]
