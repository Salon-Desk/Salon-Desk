"""Quarantined sandbox simulation helpers.

Isolates PayPal simulator prefix sniffing and mock webhook event rewrites
away from core production services.
"""

from __future__ import annotations

import uuid
from typing import Any

from app.core.config import get_settings

SIMULATOR_WEBHOOK_PREFIX = "WH-4M0448861G563140B-"
SIMULATOR_DISPUTE_PREFIX = "PP-000-042-663-135"


def is_simulator_payload(paypal_event_id: str, resource: dict[str, Any]) -> bool:
    """Return True if the webhook event originates from PayPal's simulator dashboard."""
    return paypal_event_id.startswith(SIMULATOR_WEBHOOK_PREFIX) or str(
        resource.get("dispute_id", "")
    ).startswith(SIMULATOR_DISPUTE_PREFIX)


def normalize_simulator_webhook(
    paypal_event_id: str,
    resource: dict[str, Any],
) -> tuple[str, dict[str, Any]]:
    """If running in non-production, rewrite PayPal Webhook Simulator identifiers so

    successive simulation triggers do not fail uniqueness constraints.
    """
    settings = get_settings()
    if settings.environment == "production":
        return paypal_event_id, resource

    if is_simulator_payload(paypal_event_id, resource):
        paypal_event_id = f"WH-SIM-{uuid.uuid4().hex[:8].upper()}"
        if resource.get("dispute_id") == SIMULATOR_DISPUTE_PREFIX:
            resource = dict(resource)
            resource["dispute_id"] = f"PP-000-{uuid.uuid4().hex[:6].upper()}-SIM"

    return paypal_event_id, resource
