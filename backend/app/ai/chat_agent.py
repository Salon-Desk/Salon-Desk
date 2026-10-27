"""Agentic tool-calling runner for the client chat concierge.

Equips the LLM with direct database access tools (e.g. get_salon_services,
get_salon_details, search_salons) so questions like "what are the services in
Lovely Beauty Spa" or "all of them" reliably return all active database records.
"""

from __future__ import annotations

import json
import logging
from typing import Any
from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.ai.llm.base import BaseLLMService
from app.ai.rag.constants import (
    OrganizationRecommendation,
    ServiceRecommendation,
)
from app.ai.rag.hydration import (
    _create_service_recommendation,
    _extract_address_and_distance,
)
from app.ai.rag.utils import format_working_hours
from app.models.enums import OrganizationStatus, ServiceStatus
from app.models.organization import Organization, OrgSettings
from app.models.service import Service

logger = logging.getLogger("salondesk.ai.chat_agent")

CLIENT_CHAT_TOOLS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "get_salon_services",
            "description": (
                "Fetch all active services, prices, duration, and treatment catalog for a "
                "specific salon or spa by name. Call this whenever the user asks what services, "
                "treatments, menu, or prices a salon offers, or asks for 'all of them' / 'full list'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "salon_name": {
                        "type": "string",
                        "description": "Name of the salon or spa, e.g. 'Lovely Beauty Spa'.",
                    },
                },
                "required": ["salon_name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_salon_details",
            "description": (
                "Fetch contact information, physical address, working hours, and rating for a "
                "specific salon or spa."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "salon_name": {
                        "type": "string",
                        "description": "Name of the salon or spa, e.g. 'Lovely Beauty Spa'.",
                    },
                },
                "required": ["salon_name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_salons",
            "description": (
                "Search for approved salons and spas by name, location, neighborhood, or category."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search keywords like 'spa Addis Ababa' or 'hair salon'.",
                    },
                },
                "required": ["query"],
            },
        },
    },
]


async def resolve_organization_by_name(
    db: AsyncSession,
    salon_name: str | None,
) -> Organization | None:
    """Find an approved organization by UUID or case-insensitive name."""
    if not salon_name or not salon_name.strip():
        return None

    cleaned = salon_name.strip()
    try:
        parsed_uuid = UUID(cleaned)
        res = await db.execute(
            select(Organization).where(
                Organization.id == parsed_uuid,
                Organization.status == OrganizationStatus.APPROVED,
            )
        )
        return res.scalar_one_or_none()
    except (ValueError, AttributeError):
        pass

    # 1. Exact / substring match
    res = await db.execute(
        select(Organization)
        .where(
            Organization.name.ilike(f"%{cleaned}%"),
            Organization.status == OrganizationStatus.APPROVED,
        )
        .limit(1)
    )
    found = res.scalar_one_or_none()
    if found:
        return found

    # 2. Token conjunction match (e.g. "Lovely" and "Spa")
    tokens = [t for t in cleaned.split() if len(t) >= 3]
    if tokens:
        clauses = [Organization.name.ilike(f"%{t}%") for t in tokens]
        res = await db.execute(
            select(Organization)
            .where(and_(*clauses), Organization.status == OrganizationStatus.APPROVED)
            .limit(1)
        )
        found = res.scalar_one_or_none()
        if found:
            return found

    # 3. Any token match
    if tokens:
        clauses = [Organization.name.ilike(f"%{t}%") for t in tokens]
        res = await db.execute(
            select(Organization)
            .where(or_(*clauses), Organization.status == OrganizationStatus.APPROVED)
            .limit(1)
        )
        return res.scalar_one_or_none()

    return None


async def execute_get_salon_services(
    db: AsyncSession,
    salon_name: str,
    user_lat: float | None = None,
    user_lng: float | None = None,
) -> tuple[dict[str, Any], list[ServiceRecommendation]]:
    """Query PostgreSQL directly for all active services in the requested salon."""
    org = await resolve_organization_by_name(db, salon_name)
    if not org:
        return (
            {
                "status": "not_found",
                "message": f"No approved salon found matching '{salon_name}'.",
                "services": [],
            },
            [],
        )

    res = await db.execute(
        select(Service, OrgSettings)
        .join(Organization, Service.organization_id == Organization.id)
        .outerjoin(OrgSettings, Organization.id == OrgSettings.org_id)
        .options(
            selectinload(Service.organization),
            selectinload(Service.category),
        )
        .where(
            Service.organization_id == org.id,
            Service.status == ServiceStatus.ACTIVE,
        )
        .order_by(Service.name)
    )
    rows = res.all()

    cards: list[ServiceRecommendation] = []
    items: list[dict[str, Any]] = []

    for s, s_set in rows:
        rec = _create_service_recommendation(s, s_set, user_lat, user_lng, score=1.0)
        cards.append(rec)
        items.append(
            {
                "service_id": str(s.id),
                "name": s.name,
                "base_price": str(s.base_price),
                "duration_minutes": s.duration_minutes,
                "category": s.category.name if s.category else None,
                "description": s.description,
            }
        )

    return (
        {
            "status": "success",
            "salon_id": str(org.id),
            "salon_name": org.name,
            "total_services": len(items),
            "services": items,
        },
        cards,
    )


async def execute_get_salon_details(
    db: AsyncSession,
    salon_name: str,
    user_lat: float | None = None,
    user_lng: float | None = None,
) -> tuple[dict[str, Any], list[OrganizationRecommendation]]:
    """Query PostgreSQL directly for salon information, hours, and address."""
    org = await resolve_organization_by_name(db, salon_name)
    if not org:
        return (
            {
                "status": "not_found",
                "message": f"No approved salon found matching '{salon_name}'.",
            },
            [],
        )

    settings_res = await db.execute(select(OrgSettings).where(OrgSettings.org_id == org.id))
    o_settings = settings_res.scalar_one_or_none()

    count_res = await db.execute(
        select(func.count(Service.id)).where(
            Service.organization_id == org.id,
            Service.status == ServiceStatus.ACTIVE,
        )
    )
    service_count = count_res.scalar() or 0

    addr, dist_km = _extract_address_and_distance(o_settings, user_lat, user_lng)
    wh_str = (
        format_working_hours(o_settings.working_hours)
        if o_settings and o_settings.working_hours
        else "Mon-Sat 9:00 AM - 6:00 PM"
    )

    card = OrganizationRecommendation(
        id=org.id,
        name=org.name,
        description=org.description,
        picture=org.picture,
        physical_address=addr,
        rating=4.9,
        service_count=service_count,
        distance_km=dist_km,
        working_hours=o_settings.working_hours if o_settings else None,
        timezone=o_settings.timezone if o_settings else "UTC",
    )

    return (
        {
            "status": "success",
            "salon_id": str(org.id),
            "salon_name": org.name,
            "physical_address": addr,
            "distance_km": dist_km,
            "working_hours": wh_str,
            "timezone": o_settings.timezone if o_settings else "UTC",
            "active_services_count": service_count,
            "description": org.description,
        },
        [card],
    )


async def execute_search_salons(
    db: AsyncSession,
    query: str,
    user_lat: float | None = None,
    user_lng: float | None = None,
) -> tuple[dict[str, Any], list[OrganizationRecommendation]]:
    """Search salons by keyword or location."""
    tokens = [t for t in query.split() if len(t) >= 3][:4]
    stmt = (
        select(Organization, OrgSettings)
        .outerjoin(OrgSettings, Organization.id == OrgSettings.org_id)
        .where(Organization.status == OrganizationStatus.APPROVED)
    )
    if tokens:
        clauses = [Organization.name.ilike(f"%{t}%") for t in tokens]
        clauses.extend(OrgSettings.physical_address.ilike(f"%{t}%") for t in tokens)
        stmt = stmt.where(or_(*clauses))

    res = await db.execute(stmt.limit(6))
    cards: list[OrganizationRecommendation] = []
    items: list[dict[str, Any]] = []

    for org, o_settings in res.all():
        addr, dist_km = _extract_address_and_distance(o_settings, user_lat, user_lng)
        cards.append(
            OrganizationRecommendation(
                id=org.id,
                name=org.name,
                description=org.description,
                picture=org.picture,
                physical_address=addr,
                distance_km=dist_km,
                working_hours=o_settings.working_hours if o_settings else None,
                timezone=o_settings.timezone if o_settings else "UTC",
            )
        )
        items.append(
            {
                "salon_id": str(org.id),
                "salon_name": org.name,
                "physical_address": addr,
                "distance_km": dist_km,
            }
        )

    return (
        {
            "status": "success",
            "matches_count": len(items),
            "salons": items,
        },
        cards,
    )


async def run_chat_agent(
    llm: BaseLLMService,
    messages: list[dict[str, Any]],
    *,
    db: AsyncSession,
    user_lat: float | None = None,
    user_lng: float | None = None,
    max_tokens: int = 360,
    temperature: float = 0.55,
    max_iterations: int = 2,
) -> tuple[str, list[ServiceRecommendation], list[OrganizationRecommendation]]:
    """Run agent tool loop using OpenAI-compatible function calling.

    Returns:
        (reply_text, newly_collected_services, newly_collected_organizations)
    """
    current_messages = [dict(m) for m in messages]
    accumulated_services: list[ServiceRecommendation] = []
    accumulated_orgs: list[OrganizationRecommendation] = []

    for _ in range(max_iterations):
        try:
            msg = await llm.chat_completion(
                current_messages,
                tools=CLIENT_CHAT_TOOLS,
                tool_choice="auto",
                temperature=temperature,
                max_tokens=max_tokens,
            )
        except Exception as exc:
            logger.warning("Agent chat_completion failed, falling back to chat: %s", exc)
            fallback_reply = await llm.chat(
                current_messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return fallback_reply, accumulated_services, accumulated_orgs

        tool_calls = msg.get("tool_calls")
        if not tool_calls:
            reply = msg.get("content") or ""
            return reply, accumulated_services, accumulated_orgs

        # Append assistant tool invocation turn
        current_messages.append(
            {
                "role": "assistant",
                "content": msg.get("content") or "",
                "tool_calls": tool_calls,
            }
        )

        for tc in tool_calls:
            tc_id = tc.get("id") or "call_0"
            func_name = tc.get("function", {}).get("name", "")
            raw_args = tc.get("function", {}).get("arguments", "{}")
            try:
                args = json.loads(raw_args) if isinstance(raw_args, str) else dict(raw_args)
            except Exception:
                args = {}

            logger.info("Executing chat agent tool '%s' with args %s", func_name, args)
            tool_data: dict[str, Any] = {}

            if func_name == "get_salon_services":
                salon_name = args.get("salon_name", "")
                tool_data, cards = await execute_get_salon_services(
                    db, salon_name, user_lat=user_lat, user_lng=user_lng
                )
                accumulated_services.extend(cards)

            elif func_name == "get_salon_details":
                salon_name = args.get("salon_name", "")
                tool_data, org_cards = await execute_get_salon_details(
                    db, salon_name, user_lat=user_lat, user_lng=user_lng
                )
                accumulated_orgs.extend(org_cards)

            elif func_name == "search_salons":
                query_str = args.get("query", "")
                tool_data, org_cards = await execute_search_salons(
                    db, query_str, user_lat=user_lat, user_lng=user_lng
                )
                accumulated_orgs.extend(org_cards)

            else:
                tool_data = {"error": f"Unknown tool '{func_name}'"}

            current_messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tc_id,
                    "name": func_name,
                    "content": json.dumps(tool_data),
                }
            )

    # Final turn after tool executions
    final_reply = await llm.chat(
        current_messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return final_reply, accumulated_services, accumulated_orgs
