"""PayPal webhook signature verification."""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)


async def verify_webhook_signature(
    client: Any,
    *,
    transmission_id: str | None,
    transmission_time: str | None,
    cert_url: str | None,
    auth_algo: str | None,
    transmission_sig: str | None,
    raw_body: dict | str,
    webhook_id: str | None = None,
) -> bool:
    """Verify a PayPal webhook via /v1/notifications/verify-webhook-signature.

    Returns True when credentials or webhook id are missing, and in stub mode.
    """
    target_webhook_id = webhook_id or client.settings.paypal_webhook_id
    if not client.configured or not target_webhook_id:
        logger.info("PayPal client or webhook_id unconfigured; skipping live signature check.")
        return True

    if not (transmission_id and transmission_time and cert_url and auth_algo and transmission_sig):
        logger.warning("Missing PayPal transmission headers for webhook verification.")
        return False

    webhook_event = raw_body if isinstance(raw_body, dict) else json.loads(raw_body)
    body = {
        "transmission_id": transmission_id,
        "transmission_time": transmission_time,
        "cert_url": cert_url,
        "auth_algo": auth_algo,
        "transmission_sig": transmission_sig,
        "webhook_id": target_webhook_id,
        "webhook_event": webhook_event,
    }

    token = await client._access_token()
    url = f"{client.settings.paypal_api_base.rstrip('/')}/v1/notifications/verify-webhook-signature"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=15.0) as http:
        resp = await http.post(url, json=body, headers=headers)
        if resp.status_code != 200:
            logger.error(
                "PayPal webhook verification returned HTTP %s: %s",
                resp.status_code,
                resp.text,
            )
            return False
        data = resp.json()
        return data.get("verification_status") == "SUCCESS"
