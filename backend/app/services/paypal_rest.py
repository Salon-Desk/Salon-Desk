"""Direct PayPal REST Orders/Payments v2 client (authorize, capture, void, reauthorize)."""

from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from decimal import Decimal
from typing import Any

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
from app.services.policy_engine import assert_can_reauthorize_hold

logger = logging.getLogger(__name__)

__all__ = [
    "PayPalAPIError",
    "PayPalRestClient",
    "_raise_for_paypal",
    "assert_can_reauthorize_hold",
    "close_paypal_http_client",
    "get_paypal_http_client",
    "is_paypal_merchant_id",
]

_token_cache: dict[str, Any] = {
    "token": "",
    "expires_at": 0.0,
}
_token_lock = asyncio.Lock()
SIMULATED_DISPUTE_PREFIXES = ("PP-D-SIM-", "PP-D-DEMO-")
_http_client: httpx.AsyncClient | None = None
_client_lock = asyncio.Lock()


async def get_paypal_http_client(timeout: float = 30.0) -> httpx.AsyncClient:
    """Return shared AsyncClient instance for connection pooling across requests."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        async with _client_lock:
            if _http_client is None or _http_client.is_closed:
                _http_client = httpx.AsyncClient(timeout=timeout)
    return _http_client


async def close_paypal_http_client() -> None:
    """Close the shared client on shutdown."""
    global _http_client
    if _http_client is not None and not _http_client.is_closed:
        async with _client_lock:
            if _http_client is not None and not _http_client.is_closed:
                await _http_client.aclose()
                _http_client = None


class PayPalRestClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    @property
    def configured(self) -> bool:
        return bool(self.settings.paypal_client_id and self.settings.paypal_client_secret)

    async def _access_token(self) -> str:
        if not self.configured:
            return ""

        now = time.monotonic()
        if _token_cache["token"] and now < _token_cache["expires_at"]:
            return str(_token_cache["token"])

        async with _token_lock:
            now = time.monotonic()
            if _token_cache["token"] and now < _token_cache["expires_at"]:
                return str(_token_cache["token"])

            resp = await self._request(
                "POST",
                "/v1/oauth2/token",
                form={"grant_type": "client_credentials"},
                auth=(self.settings.paypal_client_id, self.settings.paypal_client_secret),
                accept_only=True,
            )
            data = resp.json()
            token = str(data["access_token"])
            expires_in = float(data.get("expires_in", 3600))
            safe_ttl = max(10.0, expires_in - 60.0)
            _token_cache["token"] = token
            _token_cache["expires_at"] = time.monotonic() + safe_ttl
            return token

    async def _request(
        self,
        method: str,
        path: str,
        *,
        body: dict | None = None,
        form: dict | None = None,
        files: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
        request_id: str | None = None,
        prefer: bool = False,
        auth: tuple[str, str] | None = None,
        accept_only: bool = False,
        timeout: float = 30.0,
    ) -> httpx.Response:
        """Send one PayPal REST call and raise PayPalAPIError on a non-2xx response.

        Network failures are raised as PayPalAPIError(502). A 401 on a bearer-token call
        drops the cached token and retries once with a fresh one.
        """
        url = f"{self.settings.paypal_api_base.rstrip('/')}/{path.lstrip('/')}"
        client = await get_paypal_http_client()
        uses_bearer = not (auth or accept_only)
        attempts = 2 if uses_bearer else 1
        response: httpx.Response | None = None
        for attempt in range(attempts):
            if accept_only:
                headers = {"Accept": "application/json"}
            else:
                token = await self._access_token() if uses_bearer else ""
                headers = build_http_headers(token, request_id)
                if files is not None:
                    # Let httpx set the multipart boundary.
                    headers.pop("Content-Type", None)
                if prefer:
                    headers["Prefer"] = "return=representation"
            kwargs: dict = {"headers": headers, "timeout": timeout}
            if auth is not None:
                kwargs["auth"] = auth
            if body is not None:
                kwargs["json"] = body
            if form is not None:
                kwargs["data"] = form
            if files is not None:
                kwargs["files"] = files
            if params is not None:
                kwargs["params"] = params
            try:
                if method.upper() == "GET":
                    response = await client.get(url, **kwargs)
                else:
                    response = await client.post(url, **kwargs)
            except httpx.HTTPError as exc:
                raise PayPalAPIError(502, f"PayPal is unreachable: {exc}") from exc
            if response.status_code == 401 and attempt + 1 < attempts:
                _token_cache["token"] = ""
                _token_cache["expires_at"] = 0.0
                continue
            break
        assert response is not None
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
        hold: Any = None,
        paypal_request_id: str | None = None,
    ) -> dict:
        if hold is not None:
            assert_can_reauthorize_hold(hold)

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

    async def list_disputes(
        self,
        *,
        page_size: int = 10,
        dispute_state: str | None = None,
    ) -> dict[str, Any]:
        """Read list of customer disputes from PayPal Disputes v1."""
        if not self.configured:
            return {"items": [], "total_items": 0, "mode": "stub"}
        params: dict[str, Any] = {"page_size": page_size}
        if dispute_state:
            params["dispute_state"] = dispute_state
        resp = await self._request("GET", "/v1/customer/disputes", params=params)
        return resp.json()

    async def get_dispute(self, *, dispute_id: str) -> dict[str, Any]:
        """Read dispute details by ID (GET /v1/customer/disputes/{dispute_id})."""
        if is_stub_mode(dispute_id, self.configured) or self._is_simulated_dispute(dispute_id):
            return {
                "dispute_id": dispute_id,
                "status": "WAITING_FOR_SELLER_RESPONSE",
                "dispute_amount": {"currency_code": "USD", "value": "50.00"},
                "reason": "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
                "mode": "stub",
                "links": [
                    {
                        "rel": "self",
                        "href": f"https://api-m.sandbox.paypal.com/v1/customer/disputes/{dispute_id}",
                    },
                    {
                        "rel": "provide-evidence",
                        "href": f"https://api-m.sandbox.paypal.com/v1/customer/disputes/{dispute_id}/provide-evidence",
                    },
                ],
            }
        resp = await self._request("GET", f"/v1/customer/disputes/{dispute_id}")
        return resp.json()

    def _is_simulated_dispute(self, dispute_id: str) -> bool:
        """Disputes seeded by the sandbox simulator never exist on PayPal."""
        return not self.configured or dispute_id.startswith(SIMULATED_DISPUTE_PREFIXES)

    @staticmethod
    def _simulated_dispute_result(dispute_id: str, **fields: Any) -> dict[str, Any]:
        return {
            "dispute_id": dispute_id,
            "paypal_debug_id": f"sim-dbg-{uuid.uuid4().hex[:12]}",
            "mode": "simulated",
            **fields,
        }

    @staticmethod
    def _live_dispute_result(
        resp: httpx.Response, dispute_id: str, **fields: Any
    ) -> dict[str, Any]:
        return {
            "dispute_id": dispute_id,
            "paypal_debug_id": resp.headers.get("paypal-debug-id"),
            "mode": "live",
            **fields,
        }

    async def provide_dispute_evidence(
        self,
        *,
        dispute_id: str,
        evidence_type: str,
        notes: str,
        pdf_bytes: bytes,
        filename: str = "salondesk_evidence_dossier.pdf",
    ) -> dict[str, Any]:
        """Provide multipart PDF + JSON evidence (POST /v1/customer/disputes/{id}/provide-evidence).

        Raises PayPalAPIError when PayPal rejects the submission or is unreachable.
        """
        if self._is_simulated_dispute(dispute_id):
            return self._simulated_dispute_result(dispute_id, status="UNDER_REVIEW")

        evidence_input = {"evidences": [{"evidence_type": evidence_type, "notes": notes}]}
        files = {
            "input": (None, json.dumps(evidence_input), "application/json"),
            "file1": (filename, pdf_bytes, "application/pdf"),
        }
        resp = await self._request(
            "POST",
            f"/v1/customer/disputes/{dispute_id}/provide-evidence",
            files=files,
            timeout=45.0,
        )
        return self._live_dispute_result(resp, dispute_id, status="UNDER_REVIEW")

    async def make_dispute_offer(
        self,
        *,
        dispute_id: str,
        offer_amount: Decimal,
        note: str,
        currency: str = "USD",
    ) -> dict[str, Any]:
        """Make partial refund settlement offer (POST /v1/customer/disputes/{id}/make-offer).

        Raises PayPalAPIError when PayPal rejects the offer or is unreachable.
        """
        amount_str = f"{offer_amount.quantize(Decimal('0.01'))}"
        if self._is_simulated_dispute(dispute_id):
            return self._simulated_dispute_result(
                dispute_id, status="OFFER_MADE", offer_amount=amount_str, currency=currency
            )

        body = {
            "offer_amount": {"currency_code": currency, "value": amount_str},
            "note": note,
        }
        resp = await self._request(
            "POST", f"/v1/customer/disputes/{dispute_id}/make-offer", body=body
        )
        return self._live_dispute_result(
            resp, dispute_id, status="OFFER_MADE", offer_amount=amount_str, currency=currency
        )

    async def sandbox_require_evidence(self, *, dispute_id: str) -> dict[str, Any]:
        """Sandbox simulator: trigger SELLER_EVIDENCE state."""
        if self._is_simulated_dispute(dispute_id):
            return self._simulated_dispute_result(dispute_id, status="WAITING_FOR_SELLER_RESPONSE")

        resp = await self._request(
            "POST",
            f"/v1/customer/disputes/{dispute_id}/require-evidence",
            body={"action": "SELLER_EVIDENCE"},
        )
        return self._live_dispute_result(resp, dispute_id, status="WAITING_FOR_SELLER_RESPONSE")

    async def sandbox_adjudicate(
        self,
        *,
        dispute_id: str,
        outcome: str = "SELLER_FAVOR",
    ) -> dict[str, Any]:
        """Sandbox simulator: adjudicate dispute (outcome: SELLER_FAVOR or BUYER_FAVOR)."""
        status = "RESOLVED_SELLER_FAVOR" if outcome == "SELLER_FAVOR" else "RESOLVED_BUYER_FAVOR"
        if self._is_simulated_dispute(dispute_id):
            return self._simulated_dispute_result(
                dispute_id, status=status, adjudication_outcome=outcome
            )

        resp = await self._request(
            "POST",
            f"/v1/customer/disputes/{dispute_id}/adjudicate",
            body={"adjudication_outcome": outcome},
        )
        return self._live_dispute_result(
            resp, dispute_id, status=status, adjudication_outcome=outcome
        )
