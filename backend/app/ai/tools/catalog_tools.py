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
    on_ui_action: Callable[[dict[str, Any]], Any] | None = None,
):
    """Help-desk tools for merchant / admin voice agents with live console navigation & actions."""

    try:
        from livekit.agents import function_tool
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError("livekit-agents is required for voice tools") from exc

    import inspect

    from app.ai.support_actions import (
        ADMIN_ACTION_MAP,
        ADMIN_NAV_MAP,
        MERCHANT_ACTION_MAP,
        MERCHANT_NAV_MAP,
    )

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

    @function_tool()
    async def navigate_portal_page(page: str, reason: str = "") -> str:
        """Navigate the user's screen to a specific console page or tab.

        For merchant: 'calendar', 'appointments', 'staff', 'services', 'settings', 'paypal', 'policies', 'security', 'billing', 'invoices', 'profile', 'dashboard'.
        For admin: 'overview', 'salons', 'requests', 'reviews', 'commission', 'billing', 'taxonomy', 'staff', 'curation', 'profile'.
        For client: 'catalog', 'explore', 'bookings', 'checkout', 'profile'.
        """
        key = (page or "").lower().strip()
        nav_map = MERCHANT_NAV_MAP if mode == "merchant" else ADMIN_NAV_MAP
        nav_info = nav_map.get(key)
        if not nav_info:
            for k, info in nav_map.items():
                if k in key or key in k:
                    nav_info = info
                    break
        if not nav_info:
            nav_info = nav_map.get("dashboard" if mode == "merchant" else "overview")

        target = nav_info["target"]
        label = nav_info["label"]
        tab = nav_info.get("tab")

        payload = {
            "type": "navigate",
            "portal": mode,
            "target": target,
            "tab": tab,
            "label": label,
            "reason": reason or f"Navigating to {label}",
        }
        if on_ui_action:
            try:
                res = on_ui_action(payload)
                if inspect.isawaitable(res):
                    await res
            except Exception:
                pass

        return f"Successfully navigated user to {label} ({target}). State to the user that you've opened this page for them."

    @function_tool()
    async def perform_portal_action(action: str, details: str = "") -> str:
        """Trigger a direct interactive UI action or open a modal on the user's console.

        For merchant:
        - 'open_add_staff': Open the Add Stylist / Staff modal.
        - 'open_add_service': Open the Add Service Offering modal.
        - 'open_change_paypal': Open the PayPal Payout account amendment form.
        - 'open_change_policy': Open the Cancellation Policy amendment form.
        - 'open_copilot': Open the AI dispute & refund Copilot drawer.
        - 'filter_holds': Filter reservations to active PayPal holds.
        - 'filter_captured': Filter reservations to settled captured bookings.

        For admin:
        - 'open_add_salon': Open the Onboard / Add Salon modal.
        - 'open_add_override': Open the Add Commission Override modal.
        - 'open_add_category': Open the Create Taxonomy Category modal.
        - 'open_invite_staff': Open the Invite Platform Staff modal.
        - 'filter_policy_requests': Filter to Policy change requests.
        - 'filter_paypal_requests': Filter to PayPal change requests.
        """
        act_key = (action or "").lower().strip()
        action_map = MERCHANT_ACTION_MAP if mode == "merchant" else ADMIN_ACTION_MAP
        act_info = action_map.get(act_key)
        if not act_info:
            for k, info in action_map.items():
                if k in act_key or act_key in k:
                    act_info = info
                    act_key = k
                    break

        if not act_info:
            return f"Action '{action}' is not recognized for portal {mode}."

        target = act_info.get("target")
        label = act_info.get("label", act_key)
        selector = act_info.get("selector")

        payload = {
            "type": "ui_action",
            "portal": mode,
            "action": act_key,
            "target": target,
            "label": label,
            "selector": selector,
            "details": details or act_info.get("details", ""),
        }
        if on_ui_action:
            try:
                res = on_ui_action(payload)
                if inspect.isawaitable(res):
                    await res
            except Exception:
                pass

        return f"Action '{act_key}' ({label}) executed on the user's screen. Confirm to the user that it is now open for them."

    return [search_help_docs, navigate_portal_page, perform_portal_action]


def build_voice_tools(
    session_factory: async_sessionmaker[AsyncSession],
    user_location_getter: Callable[[], tuple[float | None, float | None]] | None = None,
    on_auth_success: Callable[[dict[str, Any]], Any] | None = None,
    on_booking_success: Callable[[dict[str, Any]], Any] | None = None,
    on_discovery_results: Callable[[dict[str, Any]], Any] | None = None,
    on_ui_action: Callable[[dict[str, Any]], Any] | None = None,
    on_payment_link: Callable[[dict[str, Any]], Any] | None = None,
    portal: str = "client",
):
    """Aggregate tools for the voice worker (booking or support by portal)."""
    if is_support_portal(portal):
        from app.ai.tools.merchant_tools import build_merchant_tools

        support_tools = build_support_tools(
            session_factory, portal=portal, on_ui_action=on_ui_action
        )
        merchant_tools = build_merchant_tools(session_factory)
        return support_tools + merchant_tools

    from app.ai.tools.auth_tools import build_auth_tools
    from app.ai.tools.booking_tools import build_booking_tools
    from app.ai.tools.schedule_tools import build_schedule_tools

    tools = build_catalog_tools(
        session_factory,
        user_location_getter=user_location_getter,
        on_discovery_results=on_discovery_results,
    )
    tools.extend(build_schedule_tools(session_factory))
    tools.extend(
        build_booking_tools(
            session_factory,
            on_booking_success=on_booking_success,
            on_payment_link=on_payment_link,
            on_discovery_results=on_discovery_results,
        )
    )
    tools.extend(
        build_auth_tools(
            session_factory,
            on_auth_success=on_auth_success,
            on_ui_action=on_ui_action,
        )
    )
    return tools


def build_rag_tool(session_factory: async_sessionmaker[AsyncSession]):
    tools = build_catalog_tools(session_factory)
    return tools[0]
