"""Helper functions for PayPal REST API client."""

import re
from decimal import Decimal

# PayPal merchant (payer) IDs are 13 uppercase alphanumerics, e.g. "QJ7XZ8ME9GKDA".
_MERCHANT_ID_RE = re.compile(r"^[A-Z0-9]{13}$")


def is_paypal_merchant_id(value: str | None) -> bool:
    return bool(value and _MERCHANT_ID_RE.fullmatch(value))


def is_stub_mode(order_id: str | None, configured: bool) -> bool:
    """Check if we're in stub mode (no credentials or stub order)."""
    return not configured or (order_id and str(order_id).startswith("STUB-"))


def extract_approval_url(data: dict) -> str | None:
    """Extract approval URL from PayPal order response."""
    for link in data.get("links") or []:
        if link.get("rel") == "approve":
            return link.get("href")
    return None


def extract_authorization_id(data: dict) -> str | None:
    """Extract authorization ID from PayPal authorize response."""
    for unit in data.get("purchase_units") or []:
        payments = unit.get("payments") or {}
        for auth in payments.get("authorizations") or []:
            auth_id = auth.get("id")
            if auth_id:
                return auth_id
    return None


def extract_capture_id(data: dict) -> str | None:
    """Extract capture ID from PayPal capture response."""
    for unit in data.get("purchase_units") or []:
        payments = unit.get("payments") or {}
        for cap in payments.get("captures") or []:
            capture_id = cap.get("id")
            if capture_id:
                return capture_id
    return None


def build_stub_order_response(order_id: str, return_url: str) -> dict:
    """Build a stub order response for testing."""
    sep = "&" if "?" in return_url else "?"
    approval_url = f"{return_url}{sep}token={order_id}&stub=1"
    return {
        "status": "CREATED",
        "mode": "stub",
        "order_id": order_id,
        "approval_url": approval_url,
        "authorization_id": None,
    }


def build_stub_authorize_response(order_id: str) -> dict:
    """Build a stub authorize response for testing."""
    auth_id = f"stub-auth-{order_id}"
    return {
        "status": "COMPLETED",
        "mode": "stub",
        "order_id": order_id,
        "authorization_id": auth_id,
    }


def build_stub_capture_response(
    authorization_id: str, amount: Decimal, final_capture: bool
) -> dict:
    """Build a stub capture response for testing."""
    return {
        "status": "COMPLETED",
        "mode": "stub",
        "capture_id": f"stub-cap-{authorization_id}",
        "amount": str(amount),
        "final_capture": final_capture,
    }


def build_stub_void_response() -> dict:
    """Build a stub void response for testing."""
    return {"status": "VOIDED", "mode": "stub"}


def build_stub_reauthorize_response(authorization_id: str) -> dict:
    """Build a stub reauthorize response for testing."""
    return {
        "status": "CREATED",
        "mode": "stub",
        "authorization_id": f"stub-reauth-{authorization_id}",
    }


def build_stub_refund_response(capture_id: str, amount: Decimal | None) -> dict:
    """Build a stub refund response for testing."""
    return {
        "status": "COMPLETED",
        "mode": "stub",
        "refund_id": f"stub-refund-{capture_id}",
        "amount": str(amount) if amount else "full",
    }


def build_http_headers(token: str, request_id: str | None = None) -> dict:
    """Build standard HTTP headers for PayPal API requests."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    if request_id:
        headers["PayPal-Request-Id"] = request_id
    return headers


def build_order_body(
    amount: Decimal,
    currency: str,
    return_url: str,
    cancel_url: str,
    intent: str = "AUTHORIZE",
    payee_merchant_id: str | None = None,
    reference_id: str | None = None,
    description: str | None = None,
) -> dict:
    """Build PayPal order request body."""
    amount_str = f"{amount.quantize(Decimal('0.01'))}"
    purchase_unit: dict = {
        "reference_id": reference_id or ("booking" if intent == "AUTHORIZE" else "order"),
        "amount": {"currency_code": currency, "value": amount_str},
    }
    if description:
        purchase_unit["description"] = description
    if is_paypal_merchant_id(payee_merchant_id):
        purchase_unit["payee"] = {"merchant_id": payee_merchant_id}

    body = {
        "intent": intent,
        "purchase_units": [purchase_unit],
        "application_context": {
            "return_url": return_url,
            "cancel_url": cancel_url,
            "user_action": "PAY_NOW" if intent == "CAPTURE" else "CONTINUE",
            "shipping_preference": "NO_SHIPPING",
            "brand_name": "SalonDesk",
        },
    }
    return body
