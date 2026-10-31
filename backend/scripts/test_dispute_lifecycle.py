"""PayPal Sandbox Disputes v1 Verification & Lifecycle Script.

Validates Disputes v1 API access, lists disputes, and tests the full seller
and sandbox-simulator lifecycle on a target dispute:
1. GET /v1/customer/disputes (read access & list)
2. GET /v1/customer/disputes/{id} (inspect state & HATEOAS links)
3. POST /v1/customer/disputes/{id}/require-evidence (simulator: trigger seller response window)
4. POST /v1/customer/disputes/{id}/provide-evidence (multipart/form-data upload of JSON + PDF evidence)
5. POST /v1/customer/disputes/{id}/adjudicate (simulator: resolve in seller's favor)

Usage:
  # List all sandbox disputes:
  cd backend && uv run python -m scripts.test_dispute_lifecycle

  # Run full lifecycle on a specific dispute:
  cd backend && uv run python -m scripts.test_dispute_lifecycle --dispute-id PP-D-12345
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
from typing import Any

import httpx

from app.services.paypal_rest import PayPalRestClient

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("test_dispute_lifecycle")

# Minimal valid 1-page PDF (conforming to ISO 32000-1 / PDF-1.4 standard)
MINIMAL_VALID_PDF_BYTES = (
    b"%PDF-1.4\n"
    b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
    b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n"
    b"xref\n0 4\n"
    b"0000000000 65535 f \n"
    b"0000000009 00000 n \n"
    b"0000000052 00000 n \n"
    b"0000000101 00000 n \n"
    b"trailer<</Size 4/Root 1 0 R>>\n"
    b"startxref\n180\n%%EOF\n"
)


class PayPalDisputesClient:
    """Async client for PayPal Disputes v1 and Sandbox Simulator endpoints."""

    def __init__(self, rest_client: PayPalRestClient | None = None) -> None:
        self.rest_client = rest_client or PayPalRestClient()
        self.base_url = self.rest_client.settings.paypal_api_base.rstrip("/")

    async def get_token(self) -> str:
        token = await self.rest_client._access_token()
        if not token:
            raise RuntimeError(
                "Failed to acquire OAuth2 access token. Check PAYPAL_CLIENT_ID and "
                "PAYPAL_CLIENT_SECRET in backend/.env"
            )
        return token

    async def list_disputes(
        self,
        *,
        state: str | None = None,
        page_size: int = 10,
    ) -> dict[str, Any]:
        """Call GET /v1/customer/disputes."""
        token = await self.get_token()
        url = f"{self.base_url}/v1/customer/disputes"
        params: dict[str, Any] = {"page_size": page_size}
        if state:
            params["dispute_state"] = state

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        async with httpx.AsyncClient(timeout=30.0) as http:
            resp = await http.get(url, headers=headers, params=params)
            resp.raise_for_status()
            return resp.json()

    async def get_dispute(self, dispute_id: str) -> dict[str, Any]:
        """Call GET /v1/customer/disputes/{dispute_id}."""
        token = await self.get_token()
        url = f"{self.base_url}/v1/customer/disputes/{dispute_id}"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        async with httpx.AsyncClient(timeout=30.0) as http:
            resp = await http.get(url, headers=headers)
            resp.raise_for_status()
            return resp.json()

    async def require_evidence(
        self,
        dispute_id: str,
        *,
        action: str = "SELLER_EVIDENCE",
    ) -> dict[str, Any]:
        """Call Sandbox simulator POST /v1/customer/disputes/{dispute_id}/require-evidence."""
        token = await self.get_token()
        url = f"{self.base_url}/v1/customer/disputes/{dispute_id}/require-evidence"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        body = {"action": action}
        async with httpx.AsyncClient(timeout=30.0) as http:
            resp = await http.post(url, headers=headers, json=body)
            # Response may be 200/204 or return updated dispute
            if resp.status_code in (200, 201, 204):
                try:
                    return (
                        resp.json()
                        if resp.text
                        else {"status": "success", "http_code": resp.status_code}
                    )
                except Exception:
                    return {"status": "success", "http_code": resp.status_code}
            resp.raise_for_status()
            return resp.json()

    async def provide_evidence(
        self,
        dispute_id: str,
        *,
        notes: str,
        pdf_bytes: bytes,
        evidence_type: str = "OTHER",
    ) -> dict[str, Any]:
        """Call POST /v1/customer/disputes/{dispute_id}/provide-evidence with multipart/form-data."""
        token = await self.get_token()
        url = f"{self.base_url}/v1/customer/disputes/{dispute_id}/provide-evidence"

        evidence_input = {
            "evidences": [
                {
                    "evidence_type": evidence_type,
                    "notes": notes,
                }
            ]
        }

        # Multipart payload: 'input' JSON part + 'file' binary PDF part
        files = {
            "input": (None, json.dumps(evidence_input), "application/json"),
            "file": ("evidence.pdf", pdf_bytes, "application/pdf"),
        }
        headers = {
            "Authorization": f"Bearer {token}",
        }

        async with httpx.AsyncClient(timeout=45.0) as http:
            resp = await http.post(url, headers=headers, files=files)
            if resp.status_code in (200, 201, 204):
                try:
                    return (
                        resp.json()
                        if resp.text
                        else {"status": "evidence_accepted", "http_code": resp.status_code}
                    )
                except Exception:
                    return {"status": "evidence_accepted", "http_code": resp.status_code}
            logger.error("provide_evidence failed (HTTP %s): %s", resp.status_code, resp.text)
            resp.raise_for_status()
            return resp.json()

    async def adjudicate(
        self,
        dispute_id: str,
        *,
        adjudication_outcome: str = "SELLER_FAVOR",
    ) -> dict[str, Any]:
        """Call Sandbox simulator POST /v1/customer/disputes/{dispute_id}/adjudicate."""
        token = await self.get_token()
        url = f"{self.base_url}/v1/customer/disputes/{dispute_id}/adjudicate"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        body = {"adjudication_outcome": adjudication_outcome}
        async with httpx.AsyncClient(timeout=30.0) as http:
            resp = await http.post(url, headers=headers, json=body)
            if resp.status_code in (200, 201, 204):
                try:
                    return (
                        resp.json()
                        if resp.text
                        else {"status": "adjudicated", "http_code": resp.status_code}
                    )
                except Exception:
                    return {"status": "adjudicated", "http_code": resp.status_code}
            logger.error("adjudicate failed (HTTP %s): %s", resp.status_code, resp.text)
            resp.raise_for_status()
            return resp.json()


def extract_hateoas_links(dispute: dict[str, Any]) -> dict[str, str]:
    """Map link rel to href."""
    links = dispute.get("links") or []
    return {link.get("rel"): link.get("href") for link in links if link.get("rel")}


async def run_list_mode(client: PayPalDisputesClient) -> None:
    print("\n========================================================")
    print("  PayPal Sandbox Disputes v1: Account & Read Access Check")
    print("========================================================")
    print(f"Sandbox Base URL : {client.base_url}")
    print(
        f"PayPal Client ID : {client.rest_client.settings.paypal_client_id[:8]}...{client.rest_client.settings.paypal_client_id[-6:]}"
    )

    try:
        data = await client.list_disputes()
    except Exception as exc:
        print(f"\n[FAIL] Unable to list disputes: {exc}")
        sys.exit(1)

    items = data.get("items") or []
    print(f"\nDisputes Found   : {len(items)}")

    if not items:
        print("\nNotice: No disputes currently active in this Sandbox account.")
        print("To test the full lifecycle on a dispute:")
        print("1. Log in to https://sandbox.paypal.com with a Sandbox Buyer account")
        print("2. Open a dispute on any previous test transaction")
        print(
            "3. Re-run: uv run python -m scripts.test_dispute_lifecycle --dispute-id <DISPUTE-ID>\n"
        )
        return

    print("\n---------------- Active Sandbox Disputes ----------------")
    for idx, d in enumerate(items, 1):
        d_id = d.get("dispute_id")
        status = d.get("status")
        amt = d.get("dispute_amount", {})
        amt_str = f"{amt.get('currency_code', 'USD')} {amt.get('value', '0.00')}"
        reason = d.get("reason", "N/A")
        stage = d.get("dispute_life_cycle_stage", "N/A")
        links = extract_hateoas_links(d)
        action_links = [k for k in links if k not in ("self", "first", "last", "next")]

        print(f"[{idx}] Dispute ID : {d_id}")
        print(f"    Status     : {status} (Stage: {stage})")
        print(f"    Amount     : {amt_str}")
        print(f"    Reason     : {reason}")
        print(f"    Actions    : {', '.join(action_links) or 'None'}")
        print("---------------------------------------------------------")


async def run_lifecycle_mode(client: PayPalDisputesClient, dispute_id: str) -> None:
    print("\n========================================================")
    print(f"  PayPal Sandbox Disputes v1: Lifecycle Runner on {dispute_id}")
    print("========================================================")

    # 1. Inspect Dispute
    print(f"\n[Step 1/4] Inspecting Dispute {dispute_id}...")
    try:
        dispute = await client.get_dispute(dispute_id)
    except httpx.HTTPStatusError as err:
        print(f"[FAIL] HTTP {err.response.status_code}: {err.response.text}")
        return
    except Exception as exc:
        print(f"[FAIL] Error querying dispute: {exc}")
        return

    status = dispute.get("status")
    links = extract_hateoas_links(dispute)
    print(f"  Current Status : {status}")
    print(f"  Lifecycle Stage: {dispute.get('dispute_life_cycle_stage')}")
    print(f"  Dispute Amount : {dispute.get('dispute_amount')}")
    print(f"  HATEOAS Links  : {list(links.keys())}")

    # 2. Simulator: Require Evidence (if under review or link present)
    if status == "UNDER_REVIEW" or "require-evidence" in links:
        print("\n[Step 2/4] Triggering Sandbox Simulator 'require-evidence' (SELLER_EVIDENCE)...")
        try:
            req_res = await client.require_evidence(dispute_id, action="SELLER_EVIDENCE")
            print(f"  [SUCCESS] require-evidence accepted: {req_res}")
            # Refresh dispute state
            dispute = await client.get_dispute(dispute_id)
            status = dispute.get("status")
            links = extract_hateoas_links(dispute)
            print(f"  Updated Status : {status}")
        except Exception as exc:
            print(f"  [WARN] require-evidence returned: {exc}")
    else:
        print(
            f"\n[Step 2/4] Skipping require-evidence (current status '{status}' not UNDER_REVIEW)."
        )

    # 3. Provide Evidence (Multipart Upload)
    print("\n[Step 3/4] Testing POST /provide-evidence with Ed25519 Consent Dossier PDF...")
    evidence_notes = (
        "SalonDesk Cryptographic Dispute Counsel Evidence: "
        "Client consented to cancellation policy at booking time. "
        "Ed25519 digital signature verified. "
        "Tamper-evident SHA-256 ledger hash-chain attached."
    )
    try:
        prov_res = await client.provide_evidence(
            dispute_id,
            notes=evidence_notes,
            pdf_bytes=MINIMAL_VALID_PDF_BYTES,
            evidence_type="OTHER",
        )
        print(f"  [SUCCESS] provide-evidence response: {prov_res}")
    except httpx.HTTPStatusError as err:
        print(f"  [FAIL] HTTP {err.response.status_code}: {err.response.text}")
    except Exception as exc:
        print(f"  [FAIL] Failed to provide evidence: {exc}")

    # 4. Refresh & Check for Adjudication
    await asyncio.sleep(1.0)
    print("\n[Step 4/4] Checking Adjudication options...")
    try:
        dispute = await client.get_dispute(dispute_id)
        status = dispute.get("status")
        links = extract_hateoas_links(dispute)
        print(f"  Current Status : {status}")
        print(f"  Available Links: {list(links.keys())}")

        if "adjudicate" in links:
            print("  Triggering Sandbox Simulator 'adjudicate' in SELLER_FAVOR...")
            adj_res = await client.adjudicate(dispute_id, adjudication_outcome="SELLER_FAVOR")
            print(f"  [SUCCESS] adjudicate response: {adj_res}")

            # Verify final state
            final_d = await client.get_dispute(dispute_id)
            print(f"\n===> Final Adjudicated Status: {final_d.get('status')} <===")
        else:
            print(f"  Adjudicate link not currently available for status '{status}'.")
    except Exception as exc:
        print(f"  Adjudication check error: {exc}")

    print("\n================ Lifecycle Run Complete ================\n")


async def async_main() -> None:
    parser = argparse.ArgumentParser(description="Test PayPal Sandbox Disputes v1 API lifecycle.")
    parser.add_argument(
        "--dispute-id",
        type=str,
        default=None,
        help="Target dispute ID to run full lifecycle simulation (e.g. PP-D-12345).",
    )
    args = parser.parse_args()

    client = PayPalDisputesClient()
    if args.dispute_id:
        await run_lifecycle_mode(client, args.dispute_id.strip())
    else:
        await run_list_mode(client)


def main() -> None:
    asyncio.run(async_main())


if __name__ == "__main__":
    main()
