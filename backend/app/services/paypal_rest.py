"""Direct PayPal REST Orders/Payments v2 client (authorize, capture, void, reauthorize)."""

from __future__ import annotations

import logging
import re
import uuid
from decimal import Decimal

import httpx

from app.core.config import get_settings
from app.core.exceptions import SalonDeskError

logger = logging.getLogger(__name__)

# PayPal merchant (payer) IDs are 13 uppercase alphanumerics, e.g. "QJ7XZ8ME9GKDA".
_MERCHANT_ID_RE = re.compile(r"^[A-Z0-9]{13}$")


def is_paypal_merchant_id(value: str | None) -> bool:
    return bool(value and _MERCHANT_ID_RE.fullmatch(value))


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


class PayPalRestClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    @property
    def configured(self) -> bool:
        return bool(self.settings.paypal_client_id and self.settings.paypal_client_secret)

    async def _access_token(self) -> str:
        if not self.configured:
            return ""
        url = f"{self.settings.paypal_api_base.rstrip('/')}/v1/oauth2/token"
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                url,
                data={"grant_type": "client_credentials"},
                auth=(self.settings.paypal_client_id, self.settings.paypal_client_secret),
                headers={"Accept": "application/json"},
            )
            _raise_for_paypal(resp)
            return str(resp.json()["access_token"])

    async def create_authorize_order(
        self,
        *,
        amount: Decimal,
        currency: str = "USD",
        return_url: str,
        cancel_url: str,
        payee_merchant_id: str | None = None,
        reference_id: str | None = None,
    ) -> dict:
        """
        Create an Orders v2 order with intent=AUTHORIZE.
        Returns order_id, approval_url, status, and raw payload.
        """
        amount_str = f"{amount.quantize(Decimal('0.01'))}"
        if not self.configured:
            order_id = f"STUB-{uuid.uuid4().hex[:16]}"
            sep = "&" if "?" in return_url else "?"
            approval_url = f"{return_url}{sep}token={order_id}&stub=1"
            return {
                "status": "CREATED",
                "mode": "stub",
                "order_id": order_id,
                "approval_url": approval_url,
                "authorization_id": None,
            }

        purchase_unit: dict = {
            "reference_id": reference_id or "booking",
            "amount": {"currency_code": currency, "value": amount_str},
        }
        if is_paypal_merchant_id(payee_merchant_id):
            purchase_unit["payee"] = {"merchant_id": payee_merchant_id}
        elif payee_merchant_id:
            logger.warning(
                "Skipping payee: %r is not a PayPal merchant ID; funds go to the platform account",
                payee_merchant_id,
            )

        body = {
            "intent": "AUTHORIZE",
            "purchase_units": [purchase_unit],
            "application_context": {
                "return_url": return_url,
                "cancel_url": cancel_url,
                "user_action": "CONTINUE",
                "shipping_preference": "NO_SHIPPING",
                "brand_name": "SalonDesk",
            },
        }
        token = await self._access_token()
        url = f"{self.settings.paypal_api_base.rstrip('/')}/v2/checkout/orders"
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                url,
                json=body,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation",
                },
            )
            _raise_for_paypal(resp)
            data = resp.json()

        approval_url = None
        for link in data.get("links") or []:
            if link.get("rel") == "approve":
                approval_url = link.get("href")
                break

        return {
            "status": data.get("status", "CREATED"),
            "mode": "live",
            "order_id": data.get("id"),
            "approval_url": approval_url,
            "authorization_id": None,
            "raw": data,
        }

    async def authorize_order(
        self,
        *,
        order_id: str,
        amount: Decimal | None = None,
        currency: str = "USD",
    ) -> dict:
        """Authorize a buyer-approved order (or stub-complete when credentials missing)."""
        _ = amount, currency
        if not self.configured or str(order_id).startswith("STUB-"):
            auth_id = f"stub-auth-{order_id}"
            return {
                "status": "COMPLETED",
                "mode": "stub",
                "order_id": order_id,
                "authorization_id": auth_id,
            }

        token = await self._access_token()
        url = f"{self.settings.paypal_api_base.rstrip('/')}/v2/checkout/orders/{order_id}/authorize"
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation",
                },
            )
            _raise_for_paypal(resp)
            data = resp.json()

        auth_id = None
        for unit in data.get("purchase_units") or []:
            payments = unit.get("payments") or {}
            for auth in payments.get("authorizations") or []:
                auth_id = auth.get("id")
                if auth_id:
                    break
            if auth_id:
                break

        return {
            "status": data.get("status", "COMPLETED"),
            "mode": "live",
            "order_id": order_id,
            "authorization_id": auth_id,
            "raw": data,
        }

    async def partial_capture(self, *, authorization_id: str, amount: Decimal) -> dict:
        if not self.configured or str(authorization_id).startswith("stub-"):
            return {
                "status": "COMPLETED",
                "mode": "stub",
                "capture_id": f"stub-cap-{authorization_id}",
                "amount": str(amount),
            }
        token = await self._access_token()
        url = (
            f"{self.settings.paypal_api_base.rstrip('/')}"
            f"/v2/payments/authorizations/{authorization_id}/capture"
        )
        body = {
            "amount": {
                "currency_code": "USD",
                "value": f"{amount.quantize(Decimal('0.01'))}",
            },
            "final_capture": False,
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                url,
                json=body,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            _raise_for_paypal(resp)
            data = resp.json()
        return {
            "status": data.get("status"),
            "mode": "live",
            "capture_id": data.get("id"),
            "raw": data,
        }

    async def void_authorization(self, *, authorization_id: str) -> dict:
        if not self.configured or str(authorization_id).startswith("stub-"):
            return {"status": "VOIDED", "mode": "stub"}
        token = await self._access_token()
        url = (
            f"{self.settings.paypal_api_base.rstrip('/')}"
            f"/v2/payments/authorizations/{authorization_id}/void"
        )
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                url,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            )
            _raise_for_paypal(resp)
        return {"status": "VOIDED", "mode": "live"}

    async def reauthorize_authorization(self, *, authorization_id: str) -> dict:
        if not self.configured or str(authorization_id).startswith("stub-"):
            return {
                "status": "CREATED",
                "mode": "stub",
                "authorization_id": f"stub-reauth-{authorization_id}",
            }
        token = await self._access_token()
        url = (
            f"{self.settings.paypal_api_base.rstrip('/')}"
            f"/v2/payments/authorizations/{authorization_id}/reauthorize"
        )
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                url,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            )
            _raise_for_paypal(resp)
            data = resp.json()
        return {
            "status": data.get("status"),
            "mode": "live",
            "authorization_id": data.get("id"),
            "raw": data,
        }
