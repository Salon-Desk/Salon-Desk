"""Portal action and navigation registry for Merchant, Admin, and Client assistants."""

from __future__ import annotations

from pydantic import BaseModel


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


# Merchant console routes and action mappings
MERCHANT_NAV_MAP: dict[str, dict[str, str]] = {
    "dashboard": {"target": "/merchant", "tab": "dashboard", "label": "Command Center Dashboard"},
    "overview": {"target": "/merchant", "tab": "dashboard", "label": "Command Center Dashboard"},
    "calendar": {
        "target": "/merchant/calendar",
        "tab": "calendar",
        "label": "Station Chair Calendar",
    },
    "appointments": {
        "target": "/merchant/appointments",
        "tab": "appointments",
        "label": "Settlement Ledger & Appointments",
    },
    "bookings": {
        "target": "/merchant/appointments",
        "tab": "appointments",
        "label": "Settlement Ledger & Appointments",
    },
    "ledger": {
        "target": "/merchant/appointments",
        "tab": "appointments",
        "label": "Settlement Ledger & Appointments",
    },
    "holds": {
        "target": "/merchant/appointments",
        "tab": "appointments",
        "label": "Active Holds Ledger",
    },
    "staff": {"target": "/merchant/staff", "tab": "staff", "label": "Staff & Stylists Roster"},
    "stylists": {"target": "/merchant/staff", "tab": "staff", "label": "Staff & Stylists Roster"},
    "services": {
        "target": "/merchant/services",
        "tab": "services",
        "label": "Service Offerings Catalog",
    },
    "catalog": {
        "target": "/merchant/services",
        "tab": "services",
        "label": "Service Offerings Catalog",
    },
    "settings": {
        "target": "/merchant/settings",
        "tab": "settings",
        "label": "Organization Settings",
    },
    "paypal": {
        "target": "/merchant/settings/paypal",
        "tab": "settings",
        "label": "PayPal Payout Settings",
    },
    "policies": {
        "target": "/merchant/settings/policies",
        "tab": "settings",
        "label": "Cancellation & No-Show Policies",
    },
    "policy": {
        "target": "/merchant/settings/policies",
        "tab": "settings",
        "label": "Cancellation & No-Show Policies",
    },
    "profile": {"target": "/merchant/profile", "tab": "settings", "label": "Salon Profile"},
}

MERCHANT_ACTION_MAP: dict[str, dict[str, str]] = {
    "open_add_staff": {
        "target": "/merchant/staff",
        "label": "Add Team Member",
        "selector": "[data-agent-action='add-staff']",
        "details": "Opening stylist onboarding modal",
    },
    "open_add_service": {
        "target": "/merchant/services",
        "label": "Add Service Offering",
        "selector": "[data-agent-action='add-service']",
        "details": "Opening new service offering modal",
    },
    "open_change_paypal": {
        "target": "/merchant/settings/paypal",
        "label": "Request PayPal Change",
        "selector": "[data-agent-action='change-paypal']",
        "details": "Opening PayPal payout account amendment form",
    },
    "open_change_policy": {
        "target": "/merchant/settings/policies",
        "label": "Request Policy Change",
        "selector": "[data-agent-action='change-policy']",
        "details": "Opening cancellation policy amendment form",
    },
    "open_copilot": {
        "target": "/merchant",
        "label": "AI Dispute Copilot",
        "selector": "[data-agent-action='open-copilot']",
        "details": "Opening AI dispute & refund copilot drawer",
    },
    "filter_holds": {
        "target": "/merchant/appointments",
        "label": "Filter: Active Holds",
        "selector": "[data-tour='filter-holds']",
        "details": "Filtering reservations by active PayPal holds",
    },
    "filter_captured": {
        "target": "/merchant/appointments",
        "label": "Filter: Settled Captured",
        "selector": "[data-tour='filter-captured']",
        "details": "Filtering reservations by settled completions",
    },
    "filter_voided": {
        "target": "/merchant/appointments",
        "label": "Filter: Voided / No-Show",
        "selector": "[data-tour='filter-voided']",
        "details": "Filtering reservations by voided / no-shows",
    },
}

# Admin console routes and action mappings
ADMIN_NAV_MAP: dict[str, dict[str, str]] = {
    "overview": {"target": "/admin", "tab": "overview", "label": "Platform Overview"},
    "dashboard": {"target": "/admin", "tab": "overview", "label": "Platform Overview"},
    "salons": {"target": "/admin/salons", "tab": "salons", "label": "Salon Management & Approvals"},
    "approvals": {
        "target": "/admin/requests",
        "tab": "requests",
        "label": "Change Request Approvals",
    },
    "requests": {
        "target": "/admin/requests",
        "tab": "requests",
        "label": "Change Request Approvals",
    },
    "commission": {
        "target": "/admin/commission",
        "tab": "commission",
        "label": "Commission Rules & Overrides",
    },
    "overrides": {
        "target": "/admin/commission",
        "tab": "commission",
        "label": "Commission Rules & Overrides",
    },
    "taxonomy": {
        "target": "/admin/taxonomy",
        "tab": "taxonomy",
        "label": "Taxonomy & Beauty Categories",
    },
    "categories": {
        "target": "/admin/taxonomy",
        "tab": "taxonomy",
        "label": "Taxonomy & Beauty Categories",
    },
    "staff": {"target": "/admin/staff", "tab": "staff", "label": "Platform Staff & Operators"},
    "operators": {"target": "/admin/staff", "tab": "staff", "label": "Platform Staff & Operators"},
    "profile": {"target": "/admin/profile", "tab": "profile", "label": "Admin Profile"},
}

ADMIN_ACTION_MAP: dict[str, dict[str, str]] = {
    "open_add_salon": {
        "target": "/admin/salons",
        "label": "Onboard Salon",
        "selector": "[data-agent-action='add-salon']",
        "details": "Opening salon onboarding modal",
    },
    "open_add_override": {
        "target": "/admin/commission",
        "label": "Add Commission Override",
        "selector": "[data-agent-action='add-override']",
        "details": "Opening custom commission rate modal",
    },
    "open_add_category": {
        "target": "/admin/taxonomy",
        "label": "Create Category",
        "selector": "[data-agent-action='add-category']",
        "details": "Opening taxonomy category creation modal",
    },
    "open_invite_staff": {
        "target": "/admin/staff",
        "label": "Invite Staff Member",
        "selector": "[data-agent-action='invite-staff']",
        "details": "Opening platform operator invitation modal",
    },
    "filter_policy_requests": {
        "target": "/admin/requests",
        "label": "Filter: Policy Requests",
        "selector": "[data-tour='filter-policy-requests']",
        "details": "Switching to cancellation policy amendment requests",
    },
    "filter_paypal_requests": {
        "target": "/admin/requests",
        "label": "Filter: PayPal Requests",
        "selector": "[data-tour='filter-paypal-requests']",
        "details": "Switching to PayPal account amendment requests",
    },
}

# Client routes
CLIENT_NAV_MAP: dict[str, dict[str, str]] = {
    "catalog": {"target": "/client", "tab": "catalog", "label": "Service Catalog"},
    "home": {"target": "/client", "tab": "catalog", "label": "Service Catalog"},
    "bookings": {"target": "/client/bookings", "tab": "bookings", "label": "My Appointments"},
    "appointments": {"target": "/client/bookings", "tab": "bookings", "label": "My Appointments"},
    "checkout": {"target": "/client/book", "tab": "checkout", "label": "Booking Checkout"},
    "book": {"target": "/client/book", "tab": "checkout", "label": "Booking Checkout"},
    "profile": {"target": "/client/profile", "tab": "profile", "label": "My Profile"},
}


def resolve_portal_navigation(
    portal: str, query: str
) -> tuple[AgentNavigation | None, AgentUiAction | None]:
    """Parse user text query to detect navigation intent and direct UI actions."""
    q = (query or "").lower().strip()
    if len(q) < 3:
        return None, None

    if portal == "merchant":
        # Action detections first (more specific)
        if any(
            w in q
            for w in [
                "add staff",
                "new staff",
                "new stylist",
                "add stylist",
                "invite stylist",
                "create stylist",
            ]
        ):
            act_info = MERCHANT_ACTION_MAP["open_add_staff"]
            return (
                AgentNavigation(
                    target=act_info["target"],
                    tab="staff",
                    label="Staff & Stylists Roster",
                    reason="Opening Add Staff form",
                ),
                AgentUiAction(
                    action="open_add_staff",
                    target=act_info["target"],
                    label=act_info["label"],
                    details=act_info["details"],
                    selector=act_info["selector"],
                ),
            )
        if any(
            w in q
            for w in [
                "add service",
                "new service",
                "create service",
                "add offering",
                "new haircut",
                "add braid",
            ]
        ):
            act_info = MERCHANT_ACTION_MAP["open_add_service"]
            return (
                AgentNavigation(
                    target=act_info["target"],
                    tab="services",
                    label="Service Catalog",
                    reason="Opening Add Service form",
                ),
                AgentUiAction(
                    action="open_add_service",
                    target=act_info["target"],
                    label=act_info["label"],
                    details=act_info["details"],
                    selector=act_info["selector"],
                ),
            )
        if any(
            w in q
            for w in [
                "change paypal",
                "update paypal",
                "paypal account",
                "edit paypal",
                "new paypal",
            ]
        ):
            act_info = MERCHANT_ACTION_MAP["open_change_paypal"]
            return (
                AgentNavigation(
                    target=act_info["target"],
                    tab="settings",
                    label="PayPal Settings",
                    reason="Opening PayPal change request",
                ),
                AgentUiAction(
                    action="open_change_paypal",
                    target=act_info["target"],
                    label=act_info["label"],
                    details=act_info["details"],
                    selector=act_info["selector"],
                ),
            )
        if any(
            w in q
            for w in [
                "change policy",
                "update policy",
                "cancellation policy",
                "no show fee",
                "edit policy",
            ]
        ):
            act_info = MERCHANT_ACTION_MAP["open_change_policy"]
            return (
                AgentNavigation(
                    target=act_info["target"],
                    tab="settings",
                    label="Policy Settings",
                    reason="Opening Policy change request",
                ),
                AgentUiAction(
                    action="open_change_policy",
                    target=act_info["target"],
                    label=act_info["label"],
                    details=act_info["details"],
                    selector=act_info["selector"],
                ),
            )
        if any(
            w in q
            for w in [
                "open copilot",
                "ai copilot",
                "refund assistant",
                "dispute copilot",
                "settlement copilot",
            ]
        ):
            act_info = MERCHANT_ACTION_MAP["open_copilot"]
            return (
                None,
                AgentUiAction(
                    action="open_copilot",
                    target=act_info["target"],
                    label=act_info["label"],
                    details=act_info["details"],
                    selector=act_info["selector"],
                ),
            )
        if any(
            w in q
            for w in ["show holds", "only holds", "active holds", "filter holds", "see holds"]
        ):
            act_info = MERCHANT_ACTION_MAP["filter_holds"]
            return (
                AgentNavigation(
                    target=act_info["target"],
                    tab="appointments",
                    label="Active Holds",
                    reason="Filtering active holds",
                ),
                AgentUiAction(
                    action="filter_holds",
                    target=act_info["target"],
                    label=act_info["label"],
                    details=act_info["details"],
                    selector=act_info["selector"],
                ),
            )

        # General navigation
        if any(w in q for w in ["calendar", "station", "chair", "grid", "slot", "schedule"]):
            nav = MERCHANT_NAV_MAP["calendar"]
            return AgentNavigation(
                target=nav["target"],
                tab=nav["tab"],
                label=nav["label"],
                reason="Opening station calendar",
            ), None
        if any(
            w in q
            for w in [
                "appointment",
                "booking",
                "ledger",
                "settlement",
                "settle",
                "inspect consent",
                "void",
            ]
        ):
            nav = MERCHANT_NAV_MAP["appointments"]
            return AgentNavigation(
                target=nav["target"],
                tab=nav["tab"],
                label=nav["label"],
                reason="Opening appointments ledger",
            ), None
        if any(w in q for w in ["staff", "stylist", "roster", "team", "employee", "braider"]):
            nav = MERCHANT_NAV_MAP["staff"]
            return AgentNavigation(
                target=nav["target"],
                tab=nav["tab"],
                label=nav["label"],
                reason="Opening staff roster",
            ), None
        if any(w in q for w in ["service", "catalog", "offering", "price", "duration", "menu"]):
            nav = MERCHANT_NAV_MAP["services"]
            return AgentNavigation(
                target=nav["target"],
                tab=nav["tab"],
                label=nav["label"],
                reason="Opening services catalog",
            ), None
        if any(w in q for w in ["setting", "config", "preference", "paypal", "policy"]):
            nav = MERCHANT_NAV_MAP["settings"]
            return AgentNavigation(
                target=nav["target"],
                tab=nav["tab"],
                label=nav["label"],
                reason="Opening organization settings",
            ), None
        if any(w in q for w in ["dashboard", "home", "command center", "overview"]):
            nav = MERCHANT_NAV_MAP["dashboard"]
            return AgentNavigation(
                target=nav["target"],
                tab=nav["tab"],
                label=nav["label"],
                reason="Returning to command dashboard",
            ), None

    elif portal == "admin":
        if any(
            w in q
            for w in ["add salon", "onboard salon", "new salon", "register salon", "create salon"]
        ):
            act_info = ADMIN_ACTION_MAP["open_add_salon"]
            return (
                AgentNavigation(
                    target=act_info["target"],
                    tab="salons",
                    label="Salon Directory",
                    reason="Opening salon onboarding modal",
                ),
                AgentUiAction(
                    action="open_add_salon",
                    target=act_info["target"],
                    label=act_info["label"],
                    details=act_info["details"],
                    selector=act_info["selector"],
                ),
            )
        if any(
            w in q for w in ["add override", "custom rate", "override rate", "commission override"]
        ):
            act_info = ADMIN_ACTION_MAP["open_add_override"]
            return (
                AgentNavigation(
                    target=act_info["target"],
                    tab="commission",
                    label="Commission Overrides",
                    reason="Opening commission override form",
                ),
                AgentUiAction(
                    action="open_add_override",
                    target=act_info["target"],
                    label=act_info["label"],
                    details=act_info["details"],
                    selector=act_info["selector"],
                ),
            )
        if any(
            w in q for w in ["add category", "create category", "new category", "taxonomy category"]
        ):
            act_info = ADMIN_ACTION_MAP["open_add_category"]
            return (
                AgentNavigation(
                    target=act_info["target"],
                    tab="taxonomy",
                    label="Taxonomy Categories",
                    reason="Opening category creation modal",
                ),
                AgentUiAction(
                    action="open_add_category",
                    target=act_info["target"],
                    label=act_info["label"],
                    details=act_info["details"],
                    selector=act_info["selector"],
                ),
            )
        if any(
            w in q
            for w in ["invite staff", "add operator", "new admin", "add admin", "invite operator"]
        ):
            act_info = ADMIN_ACTION_MAP["open_invite_staff"]
            return (
                AgentNavigation(
                    target=act_info["target"],
                    tab="staff",
                    label="Platform Staff",
                    reason="Opening staff invitation modal",
                ),
                AgentUiAction(
                    action="open_invite_staff",
                    target=act_info["target"],
                    label=act_info["label"],
                    details=act_info["details"],
                    selector=act_info["selector"],
                ),
            )
        if any(w in q for w in ["paypal request", "paypal change"]):
            act_info = ADMIN_ACTION_MAP["filter_paypal_requests"]
            return (
                AgentNavigation(
                    target=act_info["target"],
                    tab="requests",
                    label="PayPal Requests",
                    reason="Filtering PayPal amendment requests",
                ),
                AgentUiAction(
                    action="filter_paypal_requests",
                    target=act_info["target"],
                    label=act_info["label"],
                    details=act_info["details"],
                    selector=act_info["selector"],
                ),
            )
        if any(w in q for w in ["policy request", "cancellation request"]):
            act_info = ADMIN_ACTION_MAP["filter_policy_requests"]
            return (
                AgentNavigation(
                    target=act_info["target"],
                    tab="requests",
                    label="Policy Requests",
                    reason="Filtering Policy amendment requests",
                ),
                AgentUiAction(
                    action="filter_policy_requests",
                    target=act_info["target"],
                    label=act_info["label"],
                    details=act_info["details"],
                    selector=act_info["selector"],
                ),
            )

        # General navigation
        if any(w in q for w in ["salon", "salons", "approved salons", "pending salons", "suspend"]):
            nav = ADMIN_NAV_MAP["salons"]
            return AgentNavigation(
                target=nav["target"],
                tab=nav["tab"],
                label=nav["label"],
                reason="Opening salon management",
            ), None
        if any(w in q for w in ["request", "approval", "change request", "pending request"]):
            nav = ADMIN_NAV_MAP["requests"]
            return AgentNavigation(
                target=nav["target"],
                tab=nav["tab"],
                label=nav["label"],
                reason="Opening change requests",
            ), None
        if any(w in q for w in ["commission", "rate", "platform fee", "percentage", "flat fee"]):
            nav = ADMIN_NAV_MAP["commission"]
            return AgentNavigation(
                target=nav["target"],
                tab=nav["tab"],
                label=nav["label"],
                reason="Opening commission rules",
            ), None
        if any(w in q for w in ["taxonomy", "category", "categories", "beauty", "hair"]):
            nav = ADMIN_NAV_MAP["taxonomy"]
            return AgentNavigation(
                target=nav["target"],
                tab=nav["tab"],
                label=nav["label"],
                reason="Opening service taxonomy",
            ), None
        if any(w in q for w in ["staff", "operator", "platform user", "admin user"]):
            nav = ADMIN_NAV_MAP["staff"]
            return AgentNavigation(
                target=nav["target"],
                tab=nav["tab"],
                label=nav["label"],
                reason="Opening platform staff",
            ), None
        if any(w in q for w in ["overview", "dashboard", "analytics", "metric", "kpi"]):
            nav = ADMIN_NAV_MAP["overview"]
            return AgentNavigation(
                target=nav["target"],
                tab=nav["tab"],
                label=nav["label"],
                reason="Opening platform overview",
            ), None

    elif portal == "client":
        if any(
            w in q for w in ["my bookings", "my appointments", "my reservation", "past bookings"]
        ):
            nav = CLIENT_NAV_MAP["bookings"]
            return AgentNavigation(
                target=nav["target"],
                tab=nav["tab"],
                label=nav["label"],
                reason="Opening client appointments",
            ), None
        if any(w in q for w in ["catalog", "explore", "salons near me", "home page"]):
            nav = CLIENT_NAV_MAP["catalog"]
            return AgentNavigation(
                target=nav["target"],
                tab=nav["tab"],
                label=nav["label"],
                reason="Opening discovery catalog",
            ), None
        if any(w in q for w in ["profile", "my profile", "account"]):
            nav = CLIENT_NAV_MAP["profile"]
            return AgentNavigation(
                target=nav["target"],
                tab=nav["tab"],
                label=nav["label"],
                reason="Opening client profile",
            ), None

    return None, None
