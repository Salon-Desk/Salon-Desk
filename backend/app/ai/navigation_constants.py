"""Navigation and action constants for AI assistants (Merchant, Admin, Client).

Conformed according to the Salon-Desk frontend routes, navigation tabs,
selectors, and agent action handlers.
"""

from typing import TypedDict

# Merchant console routes and action mappings
# Aligned with frontend/app/merchant routes and frontend/app/merchant/_types/merchant-types.ts
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
    "security": {
        "target": "/merchant/settings?tab=security",
        "tab": "settings",
        "label": "Account Security & Credentials",
    },
    "billing": {
        "target": "/merchant/billing",
        "tab": "billing",
        "label": "Platform Commission Billing",
    },
    "invoices": {
        "target": "/merchant/billing",
        "tab": "billing",
        "label": "Platform Commission Billing",
    },
    "commissions": {
        "target": "/merchant/billing",
        "tab": "billing",
        "label": "Platform Commission Billing",
    },
    "profile": {"target": "/merchant/profile", "tab": "settings", "label": "Salon Profile"},
    "onboarding": {
        "target": "/merchant/onboarding",
        "tab": "dashboard",
        "label": "Salon Onboarding",
    },
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
        "selector": "[data-agent-action='filter-holds']",
        "details": "Filtering reservations by active PayPal holds",
    },
    "filter_captured": {
        "target": "/merchant/appointments",
        "label": "Filter: Settled Captured",
        "selector": "[data-agent-action='filter-captured']",
        "details": "Filtering reservations by settled completions",
    },
    "filter_voided": {
        "target": "/merchant/appointments",
        "label": "Filter: Voided / No-Show",
        "selector": "[data-agent-action='filter-voided']",
        "details": "Filtering reservations by voided / no-shows",
    },
}

# Admin console routes and action mappings
# Aligned with frontend/app/admin routes and frontend/app/admin/_constants/admin-nav.ts
ADMIN_NAV_MAP: dict[str, dict[str, str]] = {
    "overview": {"target": "/admin", "tab": "overview", "label": "Platform Overview"},
    "dashboard": {"target": "/admin", "tab": "overview", "label": "Platform Overview"},
    "salons": {"target": "/admin/salons", "tab": "salons", "label": "Salon Directory & Approvals"},
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
    "reviews": {
        "target": "/admin/reviews",
        "tab": "reviews",
        "label": "Client Reviews & Feedback",
    },
    "feedback": {
        "target": "/admin/reviews",
        "tab": "reviews",
        "label": "Client Reviews & Feedback",
    },
    "commission": {
        "target": "/admin/commission",
        "tab": "commission",
        "label": "Commission Rules & Overrides",
    },
    "billing": {
        "target": "/admin/billing",
        "tab": "billing",
        "label": "SaaS Commission Billing",
    },
    "invoices": {
        "target": "/admin/billing",
        "tab": "billing",
        "label": "SaaS Commission Billing",
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
    "curation": {
        "target": "/admin/curation",
        "tab": "curation",
        "label": "Discovery & Merchandising",
    },
    "merchandising": {
        "target": "/admin/curation",
        "tab": "curation",
        "label": "Discovery & Merchandising",
    },
    "hero": {
        "target": "/admin/curation",
        "tab": "curation",
        "label": "Discovery & Merchandising",
    },
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
        "selector": "[data-agent-action='filter-policy-requests']",
        "details": "Switching to cancellation policy amendment requests",
    },
    "filter_paypal_requests": {
        "target": "/admin/requests",
        "label": "Filter: PayPal Requests",
        "selector": "[data-agent-action='filter-paypal-requests']",
        "details": "Switching to PayPal account amendment requests",
    },
    "filter_pending": {
        "target": "/admin/salons",
        "label": "Filter: Pending Salons",
        "selector": "[data-agent-action='filter-pending']",
        "details": "Filtering salons pending compliance review",
    },
    "filter_approved": {
        "target": "/admin/salons",
        "label": "Filter: Approved Salons",
        "selector": "[data-agent-action='filter-approved']",
        "details": "Filtering approved partner salons",
    },
}

# Client routes
# Aligned with frontend/app/client routes and frontend/lib/constants.ts (ROUTES)
CLIENT_NAV_MAP: dict[str, dict[str, str]] = {
    "catalog": {"target": "/client", "tab": "catalog", "label": "Service Catalog"},
    "home": {"target": "/client", "tab": "catalog", "label": "Service Catalog"},
    "explore": {"target": "/client/explore", "tab": "explore", "label": "Explore Salons"},
    "salons": {"target": "/client/explore", "tab": "explore", "label": "Explore Salons"},
    "discover": {"target": "/client/explore", "tab": "explore", "label": "Explore Salons"},
    "bookings": {"target": "/client/bookings", "tab": "bookings", "label": "My Appointments"},
    "appointments": {"target": "/client/bookings", "tab": "bookings", "label": "My Appointments"},
    "checkout": {"target": "/client/book", "tab": "checkout", "label": "Booking Checkout"},
    "book": {"target": "/client/book", "tab": "checkout", "label": "Booking Checkout"},
    "profile": {"target": "/client/profile", "tab": "profile", "label": "My Profile"},
}


class PortalNavRule(TypedDict, total=False):
    """One ordered navigation or UI-action match for a portal assistant."""

    phrases: tuple[str, ...]
    action: str
    nav: str
    tab: str
    label: str
    reason: str


# First matching rule wins. Action rules stay ahead of broader page rules.
PORTAL_NAV_RULES: dict[str, tuple[PortalNavRule, ...]] = {
    "merchant": (
        {
            "phrases": (
                "add staff",
                "create staff",
                "new staff",
                "new stylist",
                "add stylist",
                "invite stylist",
                "create stylist",
                "onboard stylist",
            ),
            "action": "open_add_staff",
            "tab": "staff",
            "label": "Staff & Stylists Roster",
            "reason": "Opening Add Staff form",
        },
        {
            "phrases": (
                "add service",
                "new service",
                "create service",
                "add offering",
                "new haircut",
                "add braid",
                "add menu item",
            ),
            "action": "open_add_service",
            "tab": "services",
            "label": "Service Catalog",
            "reason": "Opening Add Service form",
        },
        {
            "phrases": (
                "change paypal",
                "update paypal",
                "paypal account",
                "edit paypal",
                "new paypal",
                "submit a paypal change",
                "paypal change request",
            ),
            "action": "open_change_paypal",
            "tab": "settings",
            "label": "PayPal Settings",
            "reason": "Opening PayPal change request",
        },
        {
            "phrases": (
                "change policy",
                "update policy",
                "cancellation policy",
                "no show fee",
                "edit policy",
                "policy change request",
                "amend policy",
            ),
            "action": "open_change_policy",
            "tab": "settings",
            "label": "Policy Settings",
            "reason": "Opening Policy change request",
        },
        {
            "phrases": (
                "open copilot",
                "ai copilot",
                "refund assistant",
                "dispute copilot",
                "settlement copilot",
                "copilot",
            ),
            "action": "open_copilot",
        },
        {
            "phrases": (
                "show holds",
                "only holds",
                "active holds",
                "filter holds",
                "see holds",
            ),
            "action": "filter_holds",
            "tab": "appointments",
            "label": "Active Holds",
            "reason": "Filtering active holds",
        },
        {
            "phrases": (
                "filter captured",
                "show captured",
                "settled bookings",
                "captured bookings",
            ),
            "action": "filter_captured",
            "tab": "appointments",
            "label": "Captured Settlements",
            "reason": "Filtering settled captured reservations",
        },
        {
            "phrases": (
                "filter voided",
                "show voided",
                "voided bookings",
                "no-show bookings",
                "cancelled bookings",
            ),
            "action": "filter_voided",
            "tab": "appointments",
            "label": "Voided & No-Shows",
            "reason": "Filtering voided or no-show reservations",
        },
        {
            "phrases": (
                "calendar",
                "station",
                "chair",
                "grid",
                "slot",
                "schedule",
                "shift",
                "timeline",
            ),
            "nav": "calendar",
            "reason": "Opening station calendar",
        },
        {
            "phrases": (
                "appointment",
                "appointments",
                "booking",
                "bookings",
                "ledger",
                "settlement",
                "settle",
                "inspect consent",
                "mark show",
                "mark no-show",
                "no show",
                "void",
            ),
            "nav": "appointments",
            "reason": "Opening appointments ledger",
        },
        {
            "phrases": ("staff", "stylist", "stylists", "roster", "team", "employee", "braider"),
            "nav": "staff",
            "reason": "Opening staff roster",
        },
        {
            "phrases": ("service", "services", "catalog", "offering", "price", "duration", "menu"),
            "nav": "services",
            "reason": "Opening services catalog",
        },
        {
            "phrases": (
                "billing",
                "invoice",
                "invoices",
                "commission invoice",
                "platform commission",
                "saas fee",
                "pay invoice",
                "accrual",
            ),
            "nav": "billing",
            "reason": "Opening platform commission billing",
        },
        {
            "phrases": (
                "paypal settings",
                "payout account",
                "disbursement",
            ),
            "nav": "paypal",
            "reason": "Opening PayPal payout settings",
        },
        {
            "phrases": (
                "policy settings",
                "cancellation rule",
                "no show policy",
                "guarantee rules",
            ),
            "nav": "policies",
            "reason": "Opening cancellation policy settings",
        },
        {
            "phrases": ("password", "security settings", "account security", "change password"),
            "nav": "security",
            "reason": "Opening account security settings",
        },
        {
            "phrases": ("setting", "settings", "config", "preference", "organization"),
            "nav": "settings",
            "reason": "Opening organization settings",
        },
        {
            "phrases": ("salon profile", "owner profile", "team profile"),
            "nav": "profile",
            "reason": "Opening salon profile",
        },
        {
            "phrases": ("onboarding", "setup salon"),
            "nav": "onboarding",
            "reason": "Opening salon onboarding",
        },
        {
            "phrases": ("dashboard", "home", "command center", "overview"),
            "nav": "dashboard",
            "reason": "Returning to command dashboard",
        },
    ),
    "admin": (
        {
            "phrases": (
                "add salon",
                "onboard salon",
                "new salon",
                "register salon",
                "create salon",
            ),
            "action": "open_add_salon",
            "tab": "salons",
            "label": "Salon Directory",
            "reason": "Opening salon onboarding modal",
        },
        {
            "phrases": (
                "add override",
                "custom rate",
                "override rate",
                "commission override",
                "add commission",
                "new commission rule",
                "create commission rule",
            ),
            "action": "open_add_override",
            "tab": "commission",
            "label": "Commission Overrides",
            "reason": "Opening commission override form",
        },
        {
            "phrases": (
                "add category",
                "create category",
                "new category",
                "taxonomy category",
            ),
            "action": "open_add_category",
            "tab": "taxonomy",
            "label": "Taxonomy Categories",
            "reason": "Opening category creation modal",
        },
        {
            "phrases": (
                "invite staff",
                "add operator",
                "new admin",
                "add admin",
                "invite operator",
                "create admin",
                "invite admin staff",
            ),
            "action": "open_invite_staff",
            "tab": "staff",
            "label": "Platform Staff",
            "reason": "Opening staff invitation modal",
        },
        {
            "phrases": ("paypal request", "paypal change", "paypal requests"),
            "action": "filter_paypal_requests",
            "tab": "requests",
            "label": "PayPal Requests",
            "reason": "Filtering PayPal amendment requests",
        },
        {
            "phrases": ("policy request", "cancellation request", "policy requests"),
            "action": "filter_policy_requests",
            "tab": "requests",
            "label": "Policy Requests",
            "reason": "Filtering Policy amendment requests",
        },
        {
            "phrases": ("pending salons", "salons pending", "salons to approve"),
            "action": "filter_pending",
            "tab": "salons",
            "label": "Pending Salons",
            "reason": "Filtering salons pending compliance review",
        },
        {
            "phrases": ("approved salons", "active salons"),
            "action": "filter_approved",
            "tab": "salons",
            "label": "Approved Salons",
            "reason": "Filtering approved partner salons",
        },
        {
            "phrases": (
                "salon",
                "salons",
                "directory",
                "suspend",
                "approve salon",
                "salon directory",
            ),
            "nav": "salons",
            "reason": "Opening salon management",
        },
        {
            "phrases": (
                "request",
                "requests",
                "approval",
                "approvals",
                "change request",
                "change requests",
                "pending request",
                "review change request",
            ),
            "nav": "requests",
            "reason": "Opening change requests",
        },
        {
            "phrases": (
                "review",
                "reviews",
                "feedback",
                "rating",
                "ratings",
                "moderate review",
                "client review",
                "moderate client reviews",
            ),
            "nav": "reviews",
            "reason": "Opening client reviews & feedback moderation",
        },
        {
            "phrases": (
                "invoice",
                "invoices",
                "billing",
                "saas fee",
                "saas invoice",
                "platform invoice",
            ),
            "nav": "billing",
            "reason": "Opening SaaS commission billing",
        },
        {
            "phrases": (
                "commission",
                "take rate",
                "take-rate",
                "commission rule",
                "platform fee",
                "percentage",
                "flat fee",
                "update commission",
            ),
            "nav": "commission",
            "reason": "Opening commission rules",
        },
        {
            "phrases": (
                "taxonomy",
                "category",
                "categories",
                "beauty",
                "hair",
                "classification",
                "service category",
            ),
            "nav": "taxonomy",
            "reason": "Opening service taxonomy",
        },
        {
            "phrases": (
                "staff",
                "operator",
                "platform user",
                "admin user",
                "admin staff",
                "platform staff",
            ),
            "nav": "staff",
            "reason": "Opening platform staff",
        },
        {
            "phrases": (
                "curation",
                "merchandising",
                "hero banner",
                "hero",
                "featured",
                "ranking tuning",
                "popular ranking",
                "featured salons",
                "featured services",
            ),
            "nav": "curation",
            "reason": "Opening discovery merchandising & curation",
        },
        {
            "phrases": ("overview", "dashboard", "analytics", "metric", "kpi"),
            "nav": "overview",
            "reason": "Opening platform overview",
        },
        {
            "phrases": ("profile", "admin profile", "my profile", "my account"),
            "nav": "profile",
            "reason": "Opening admin profile",
        },
    ),
    "client": (
        {
            "phrases": (
                "my bookings",
                "my appointments",
                "my reservation",
                "past bookings",
                "upcoming",
                "cancel booking",
                "cancel appointment",
                "bookings",
            ),
            "nav": "bookings",
            "reason": "Opening client appointments",
        },
        {
            "phrases": (
                "book haircut",
                "book a cut",
                "schedule haircut",
                "book an appointment",
                "book appointment",
                "start booking",
                "checkout",
                "reserve",
                "book",
            ),
            "nav": "checkout",
            "reason": "Opening booking checkout",
        },
        {
            "phrases": (
                "explore",
                "salons near me",
                "near me",
                "find salon",
                "find salons",
                "discover",
                "browse salons",
            ),
            "nav": "explore",
            "reason": "Exploring salons near you",
        },
        {
            "phrases": (
                "catalog",
                "home",
                "salons",
                "home page",
                "what's on",
                "whats on",
                "show available services",
                "available services",
                "menu",
            ),
            "nav": "catalog",
            "reason": "Opening discovery catalog",
        },
        {
            "phrases": ("profile", "my profile", "account", "login", "log in", "sign up"),
            "nav": "profile",
            "reason": "Opening client profile",
        },
    ),
}
