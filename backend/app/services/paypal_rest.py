"""Direct PayPal REST Orders/Payments v2 client (authorize, capture, void, reauthorize)."""

from __future__ import annotations

import logging
import uuid
from decimal import Decimal

import httpx

from app.core.config import get_settings
from app.services.paypal_errors import PayPalAPIError, _raise_for_paypal
from app.services.paypal_helpers import (
    build_http_headers,
    build_order_body,
    build_stub_authorize_response,
    build_stub_capture_response,
    build_stub_order_response,
    build_stub_reauthorize_response,
    build_stub_refund_response,
    build_stub_void_response,
    extract_approval_url,
    extract_authorization_id,
    extract_capture_id,
    is_paypal_merchant_id,
    is_stub_mode,
)
from app.services.paypal_webhooks import verify_webhook_signature as _verify_webhook_signature

logger = logging.getLogger(__name__)

__all__ = [
    "PayPalAPIError",
    "PayPalRestClient",
    "_raise_for_paypal",
    "is_paypal_merchant_id",
]


class PayPalRestClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    @property
    def configured(self) -> bool:
        return bool(self.settings.paypal_client_id and self.settings.paypal_client_secret)

    async def _access_token(self) -> str:
        if not self.configured:
            return ""
        resp = await self._request(
            "POST",
            "/v1/oauth2/token",
            form={"grant_type": "client_credentials"},
            auth=(self.settings.paypal_client_id, self.settings.paypal_client_secret),
            accept_only=True,
        )
        return str(resp.json()["access_token"])

    async def _request(
        self,
        method: str,
        path: str,
        *,
        body: dict | None = None,
        form: dict | None = None,
        request_id: str | None = None,
        prefer: bool = False,
        auth: tuple[str, str] | None = None,
        accept_only: bool = False,
        timeout: float = 30.0,
    ) -> httpx.Response:
        """Send one PayPal REST call and raise PayPalAPIError on a non-2xx response."""
        token = "" if auth or accept_only else await self._access_token()
        url = f"{self.settings.paypal_api_base.rstrip('/')}/{path.lstrip('/')}"
        if accept_only:
            headers = {"Accept": "application/json"}
        else:
            headers = build_http_headers(token, request_id)
            if prefer:
                headers["Prefer"] = "return=representation"
        async with httpx.AsyncClient(timeout=timeout) as client:
            send = client.get if method.upper() == "GET" else client.post
            kwargs: dict = {"headers": headers}
            if auth is not None:
                kwargs["auth"] = auth
            if body is not None:
                kwargs["json"] = body
            if form is not None:
                kwargs["data"] = form
            response = await send(url, **kwargs)
        _raise_for_paypal(response)
        return response

    async def create_authorize_order(
        self,
        *,
        amount: Decimal,
        currency: str = "USD",
        return_url: str,
        cancel_url: str,
        payee_merchant_id: str | None = None,
        reference_id: str | None = None,
        paypal_request_id: str | None = None,
    ) -> dict:
        """
        Create an Orders v2 order with intent=AUTHORIZE.
        Returns order_id, approval_url, status, and raw payload.
        """
        if not self.configured:
            order_id = f"STUB-{uuid.uuid4().hex[:16]}"
            return build_stub_order_response(order_id, return_url)

        if payee_merchant_id and not is_paypal_merchant_id(payee_merchant_id):
            logger.warning(
                "Skipping payee: %r is not a PayPal merchant ID; funds go to the platform account",
                payee_merchant_id,
            )

        body = build_order_body(
            amount=amount,
            currency=currency,
            return_url=return_url,
            cancel_url=cancel_url,
            intent="AUTHORIZE",
            payee_merchant_id=payee_merchant_id,
            reference_id=reference_id,
        )
        resp = await self._request(
            "POST",
            "/v2/checkout/orders",
            body=body,
            request_id=paypal_request_id,
            prefer=True,
        )
        data = resp.json()
        return {
            "status": data.get("status", "CREATED"),
            "mode": "live",
            "order_id": data.get("id"),
            "approval_url": extract_approval_url(data),
            "authorization_id": None,
            "raw": data,
        }

    async def authorize_order(
        self,
        *,
        order_id: str,
        amount: Decimal | None = None,
        currency: str = "USD",
        paypal_request_id: str | None = None,
    ) -> dict:
        """Authorize a buyer-approved order (or stub-complete when credentials missing)."""
        _ = amount, currency
        if is_stub_mode(order_id, self.configured):
            return build_stub_authorize_response(order_id)

        resp = await self._request(
            "POST",
            f"/v2/checkout/orders/{order_id}/authorize",
            request_id=paypal_request_id,
            prefer=True,
        )
        data = resp.json()
        return {
            "status": data.get("status", "COMPLETED"),
            "mode": "live",
            "order_id": order_id,
            "authorization_id": extract_authorization_id(data),
            "raw": data,
        }

    async def partial_capture(
        self,
        *,
        authorization_id: str,
        amount: Decimal,
        final_capture: bool = False,
        paypal_request_id: str | None = None,
    ) -> dict:
        """Capture funds against an authorization hold with final_capture and idempotency support."""
        if is_stub_mode(authorization_id, self.configured):
            return build_stub_capture_response(authorization_id, amount, final_capture)

        body = {
            "amount": {
                "currency_code": "USD",
                "value": f"{amount.quantize(Decimal('0.01'))}",
            },
            "final_capture": bool(final_capture),
        }
        resp = await self._request(
            "POST",
            f"/v2/payments/authorizations/{authorization_id}/capture",
            body=body,
            request_id=paypal_request_id,
        )
        data = resp.json()
        return {
            "status": data.get("status"),
            "mode": "live",
            "capture_id": data.get("id"),
            "final_capture": bool(final_capture),
            "raw": data,
        }

    async def void_authorization(
        self,
        *,
        authorization_id: str,
        paypal_request_id: str | None = None,
    ) -> dict:
        if is_stub_mode(authorization_id, self.configured):
            return build_stub_void_response()

        await self._request(
            "POST",
            f"/v2/payments/authorizations/{authorization_id}/void",
            request_id=paypal_request_id,
        )
        return {"status": "VOIDED", "mode": "live"}

    async def reauthorize_authorization(
        self,
        *,
        authorization_id: str,
        paypal_request_id: str | None = None,
    ) -> dict:
        if is_stub_mode(authorization_id, self.configured):
            return build_stub_reauthorize_response(authorization_id)

        resp = await self._request(
            "POST",
            f"/v2/payments/authorizations/{authorization_id}/reauthorize",
            request_id=paypal_request_id,
        )
        data = resp.json()
        return {
            "status": data.get("status"),
            "mode": "live",
            "authorization_id": data.get("id"),
            "raw": data,
        }

    async def create_capture_order(
        self,
        *,
        amount: Decimal,
        currency: str = "USD",
        return_url: str,
        cancel_url: str,
        description: str | None = None,
        payee_merchant_id: str | None = None,
        reference_id: str | None = None,
        paypal_request_id: str | None = None,
    ) -> dict:
        """Create an Orders v2 order with intent=CAPTURE (direct deposit / checkout)."""
        if not self.configured:
            order_id = f"STUB-CAP-{uuid.uuid4().hex[:16]}"
            sep = "&" if "?" in return_url else "?"
            approval_url = f"{return_url}{sep}token={order_id}&stub=1"
            return {
                "status": "CREATED",
                "mode": "stub",
                "order_id": order_id,
                "approval_url": approval_url,
                "amount": f"{amount.quantize(Decimal('0.01'))}",
                "currency": currency,
            }

        body = build_order_body(
            amount=amount,
            currency=currency,
            return_url=return_url,
            cancel_url=cancel_url,
            intent="CAPTURE",
            payee_merchant_id=payee_merchant_id,
            reference_id=reference_id,
            description=description,
        )
        resp = await self._request(
            "POST",
            "/v2/checkout/orders",
            body=body,
            request_id=paypal_request_id,
            prefer=True,
        )
        data = resp.json()
        return {
            "status": data.get("status", "CREATED"),
            "mode": "live",
            "order_id": data.get("id"),
            "approval_url": extract_approval_url(data),
            "raw": data,
        }

    async def capture_order(
        self,
        *,
        order_id: str,
        paypal_request_id: str | None = None,
    ) -> dict:
        """Capture payment for an approved CAPTURE order."""
        if is_stub_mode(order_id, self.configured):
            return {
                "status": "COMPLETED",
                "mode": "stub",
                "order_id": order_id,
                "capture_id": f"stub-capture-{order_id}",
            }

        resp = await self._request(
            "POST",
            f"/v2/checkout/orders/{order_id}/capture",
            request_id=paypal_request_id,
            prefer=True,
        )
        data = resp.json()
        return {
            "status": data.get("status", "COMPLETED"),
            "mode": "live",
            "order_id": order_id,
            "capture_id": extract_capture_id(data),
            "raw": data,
        }

    async def get_order(self, *, order_id: str) -> dict:
        """Read an order status and payment breakdown."""
        if is_stub_mode(order_id, self.configured):
            return {
                "id": order_id,
                "status": "APPROVED",
                "mode": "stub",
            }

        resp = await self._request("GET", f"/v2/checkout/orders/{order_id}")
        return resp.json()

    async def create_refund(
        self,
        *,
        capture_id: str,
        amount: Decimal | None = None,
        currency: str = "USD",
        note_to_payer: str | None = None,
        paypal_request_id: str | None = None,
    ) -> dict:
        """Issue a full or partial refund on a captured payment."""
        if is_stub_mode(capture_id, self.configured):
            return build_stub_refund_response(capture_id, amount)

        body: dict = {}
        if amount is not None:
            body["amount"] = {
                "currency_code": currency,
                "value": f"{amount.quantize(Decimal('0.01'))}",
            }
        if note_to_payer:
            body["note_to_payer"] = note_to_payer

        resp = await self._request(
            "POST",
            f"/v2/payments/captures/{capture_id}/refund",
            body=body,
            request_id=paypal_request_id,
        )
        data = resp.json()
        return {
            "status": data.get("status", "COMPLETED"),
            "mode": "live",
            "refund_id": data.get("id"),
            "raw": data,
        }

    async def get_refund(self, *, refund_id: str) -> dict:
        """Get refund details by ID."""
        if is_stub_mode(refund_id, self.configured):
            return {
                "id": refund_id,
                "status": "COMPLETED",
                "mode": "stub",
            }

        resp = await self._request("GET", f"/v2/payments/refunds/{refund_id}")
        return resp.json()

    async def verify_webhook_signature(
        self,
        *,
        transmission_id: str | None,
        transmission_time: str | None,
        cert_url: str | None,
        auth_algo: str | None,
        transmission_sig: str | None,
        raw_body: dict | str,
        webhook_id: str | None = None,
    ) -> bool:
        """Verify PayPal webhook cryptographic signature via /v1/notifications/verify-webhook-signature."""
        return await _verify_webhook_signature(
            self,
            transmission_id=transmission_id,
            transmission_time=transmission_time,
            cert_url=cert_url,
            auth_algo=auth_algo,
            transmission_sig=transmission_sig,
            raw_body=raw_body,
            webhook_id=webhook_id,
        )
