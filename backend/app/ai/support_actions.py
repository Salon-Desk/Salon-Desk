"""Portal action and navigation registry for Merchant, Admin, and Client assistants."""

from __future__ import annotations

from pydantic import BaseModel

from app.ai.navigation_constants import (
    ADMIN_ACTION_MAP,
    ADMIN_NAV_MAP,
    CLIENT_NAV_MAP,
    MERCHANT_ACTION_MAP,
    MERCHANT_NAV_MAP,
    PORTAL_NAV_RULES,
)

_ACTION_MAPS = {
    "merchant": MERCHANT_ACTION_MAP,
    "admin": ADMIN_ACTION_MAP,
}
_NAV_MAPS = {
    "merchant": MERCHANT_NAV_MAP,
    "admin": ADMIN_NAV_MAP,
    "client": CLIENT_NAV_MAP,
}


class AgentNavigation(BaseModel):
    target: str
    tab: str | None = None
    label: str
    reason: str | None = None


class AgentUiAction(BaseModel):
    action: str
    target: str | None = None
    label: str | None = None
    details: str | None = None
    selector: str | None = None


def resolve_portal_navigation(
    portal: str, query: str
) -> tuple[AgentNavigation | None, AgentUiAction | None]:
    """Parse user text query to detect navigation intent and direct UI actions."""
    q = (query or "").lower().strip()
    if len(q) < 3:
        return None, None

    action_map = _ACTION_MAPS.get(portal, {})
    nav_map = _NAV_MAPS.get(portal, {})
    for rule in PORTAL_NAV_RULES.get(portal, ()):
        if not any(phrase in q for phrase in rule["phrases"]):
            continue

        action_key = rule.get("action")
        if action_key:
            info = action_map[action_key]
            ui_action = AgentUiAction(
                action=action_key,
                target=info["target"],
                label=info["label"],
                details=info["details"],
                selector=info["selector"],
            )
            if "tab" not in rule:
                return None, ui_action
            return (
                AgentNavigation(
                    target=info["target"],
                    tab=rule["tab"],
                    label=rule["label"],
                    reason=rule["reason"],
                ),
                ui_action,
            )

        nav_info = nav_map[rule["nav"]]
        return (
            AgentNavigation(
                target=nav_info["target"],
                tab=nav_info["tab"],
                label=nav_info["label"],
                reason=rule["reason"],
            ),
            None,
        )

    return None, None
