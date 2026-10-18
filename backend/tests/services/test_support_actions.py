"""Unit tests for portal navigation and interactive UI action resolver."""

from app.ai.support_actions import (
    ADMIN_ACTION_MAP,
    ADMIN_NAV_MAP,
    MERCHANT_ACTION_MAP,
    MERCHANT_NAV_MAP,
    resolve_portal_navigation,
)


def test_merchant_navigation_resolution():
    nav, ui_act = resolve_portal_navigation("merchant", "can you take me to the calendar?")
    assert nav is not None
    assert nav.target == MERCHANT_NAV_MAP["calendar"]["target"]
    assert nav.tab == "calendar"
    assert ui_act is None


def test_merchant_action_resolution():
    nav, ui_act = resolve_portal_navigation("merchant", "I want to add a new stylist to my salon")
    assert nav is not None
    assert nav.target == "/merchant/staff"
    assert ui_act is not None
    assert ui_act.action == "open_add_staff"
    assert ui_act.selector == MERCHANT_ACTION_MAP["open_add_staff"]["selector"]


def test_merchant_paypal_change_resolution():
    nav, ui_act = resolve_portal_navigation("merchant", "update paypal account payout")
    assert nav is not None
    assert nav.target == "/merchant/settings/paypal"
    assert ui_act is not None
    assert ui_act.action == "open_change_paypal"


def test_merchant_billing_nav_map():
    assert MERCHANT_NAV_MAP["billing"]["target"] == "/merchant/billing"
    assert MERCHANT_NAV_MAP["invoices"]["target"] == "/merchant/billing"


def test_admin_navigation_and_actions():
    nav, ui_act = resolve_portal_navigation("admin", "show me change requests")
    assert nav is not None
    assert nav.target == ADMIN_NAV_MAP["requests"]["target"]
    assert nav.tab == "requests"

    nav, ui_act = resolve_portal_navigation("admin", "let's onboard a new salon")
    assert nav is not None
    assert nav.target == "/admin/salons"
    assert ui_act is not None
    assert ui_act.action == "open_add_salon"
    assert ui_act.selector == ADMIN_ACTION_MAP["open_add_salon"]["selector"]


def test_client_navigation():
    nav, _ = resolve_portal_navigation("client", "take me to my bookings")
    assert nav is not None
    assert nav.target == "/client/bookings"
