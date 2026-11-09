"""PayPal dispute calls must surface real failures instead of reporting success."""

from __future__ import annotations

from decimal import Decimal
from types import SimpleNamespace

import httpx
import pytest

from app.services import paypal_rest
from app.services.paypal_errors import PayPalAPIError
from app.services.paypal_rest import PayPalRestClient


def _configured_client() -> PayPalRestClient:
    client = PayPalRestClient()
    client.settings = SimpleNamespace(
        paypal_client_id="test-id",
        paypal_client_secret="test-secret",
        paypal_api_base="https://api-m.sandbox.paypal.com",
    )
    return client


def _install_transport(monkeypatch, handler) -> list[httpx.Request]:
    seen: list[httpx.Request] = []

    def recording(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return handler(request)

    http = httpx.AsyncClient(transport=httpx.MockTransport(recording))

    async def fake_client(timeout: float = 30.0) -> httpx.AsyncClient:
        return http

    monkeypatch.setattr(paypal_rest, "get_paypal_http_client", fake_client)
    paypal_rest._token_cache["token"] = "cached-token"
    paypal_rest._token_cache["expires_at"] = float("inf")
    return seen


@pytest.fixture(autouse=True)
def _reset_token_cache():
    yield
    paypal_rest._token_cache["token"] = ""
    paypal_rest._token_cache["expires_at"] = 0.0


@pytest.mark.asyncio
async def test_simulated_dispute_is_labelled_simulated() -> None:
    res = await PayPalRestClient().provide_dispute_evidence(
        dispute_id="PP-D-SIM-123",
        evidence_type="PROOF_OF_SERVICE_DELIVERY",
        notes="n",
        pdf_bytes=b"%PDF",
    )
    assert res["mode"] == "simulated"
    assert res["paypal_debug_id"].startswith("sim-dbg-")


@pytest.mark.asyncio
async def test_evidence_rejection_raises(monkeypatch) -> None:
    seen = _install_transport(
        monkeypatch,
        lambda req: httpx.Response(
            422,
            json={"name": "UNPROCESSABLE_ENTITY", "message": "Bad evidence", "debug_id": "D-9"},
        ),
    )
    with pytest.raises(PayPalAPIError) as exc:
        await _configured_client().provide_dispute_evidence(
            dispute_id="PP-D-REAL-1",
            evidence_type="PROOF_OF_SERVICE_DELIVERY",
            notes="n",
            pdf_bytes=b"%PDF",
        )
    assert exc.value.status_code == 422
    assert exc.value.debug_id == "D-9"
    assert len(seen) == 1
    assert seen[0].headers["content-type"].startswith("multipart/form-data")


@pytest.mark.asyncio
async def test_offer_network_failure_raises(monkeypatch) -> None:
    def boom(req: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("down", request=req)

    _install_transport(monkeypatch, boom)
    with pytest.raises(PayPalAPIError) as exc:
        await _configured_client().make_dispute_offer(
            dispute_id="PP-D-REAL-1", offer_amount=Decimal("10.00"), note="n"
        )
    assert exc.value.status_code == 502


@pytest.mark.asyncio
async def test_evidence_success_uses_response_debug_id(monkeypatch) -> None:
    _install_transport(
        monkeypatch,
        lambda req: httpx.Response(200, json={}, headers={"paypal-debug-id": "REAL-DBG"}),
    )
    res = await _configured_client().provide_dispute_evidence(
        dispute_id="PP-D-REAL-1",
        evidence_type="PROOF_OF_SERVICE_DELIVERY",
        notes="n",
        pdf_bytes=b"%PDF",
    )
    assert res == {
        "dispute_id": "PP-D-REAL-1",
        "paypal_debug_id": "REAL-DBG",
        "mode": "live",
        "status": "UNDER_REVIEW",
    }


@pytest.mark.asyncio
async def test_expired_token_is_refreshed_once_on_401(monkeypatch) -> None:
    calls = {"n": 0}

    def handler(req: httpx.Request) -> httpx.Response:
        if req.url.path == "/v1/oauth2/token":
            return httpx.Response(200, json={"access_token": "fresh", "expires_in": 3600})
        calls["n"] += 1
        if req.headers["authorization"] == "Bearer cached-token":
            return httpx.Response(401, json={"message": "expired"})
        return httpx.Response(200, json={"status": "OPEN"})

    _install_transport(monkeypatch, handler)
    res = await _configured_client().get_dispute(dispute_id="PP-D-REAL-1")
    assert res == {"status": "OPEN"}
    assert calls["n"] == 2
    assert paypal_rest._token_cache["token"] == "fresh"
