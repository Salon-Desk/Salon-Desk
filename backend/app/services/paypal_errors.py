"""PayPal REST error type and response checking."""

from __future__ import annotations

import logging

import httpx

from app.core.exceptions import SalonDeskError

logger = logging.getLogger(__name__)


class PayPalAPIError(SalonDeskError):
    """Non-2xx response from the PayPal REST API, with PayPal's own explanation."""

    def __init__(self, status_code: int, message: str, debug_id: str | None = None) -> None:
        self.status_code = status_code
        self.debug_id = debug_id
        super().__init__(message)


def _raise_for_paypal(resp: httpx.Response) -> None:
    if resp.is_success:
        return
    try:
        payload = resp.json()
    except ValueError:
        payload = {}
    details = payload.get("details") or []
    issue = "; ".join(
        f"{d.get('issue')}: {d.get('description')}" for d in details if d.get("issue")
    )
    message = payload.get("message") or resp.reason_phrase or "PayPal request failed"
    if issue:
        message = f"{message} ({issue})"
    debug_id = payload.get("debug_id")
    logger.error(
        "PayPal %s %s -> %s debug_id=%s body=%s",
        resp.request.method,
        resp.request.url.path,
        resp.status_code,
        debug_id,
        resp.text[:2000],
    )
    raise PayPalAPIError(resp.status_code, f"PayPal: {message}", debug_id)
