"""Unit and integration tests for Dispute Counsel (PayPal Disputes v1 closed-loop defense agent)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.core.exceptions import PolicyViolationException
from app.models.booking import Booking
from app.models.dispute import DisputeCase
from app.models.enums import (
    BookingStatus,
    DisputeCaseStatus,
    DisputeRecommendation,
    PaymentCaptureType,
    UserRole,
)
from app.models.organization import Organization
from app.models.payment import PaymentCapture
from app.models.policy import Consent
from app.models.user import User
from app.services.dispute_service import DisputeService
from app.services.ledger_service import build_consent_signature
from app.services.paypal_toolkit import (
    BLOCKED_AGENT_TOOLS,
    PayPalToolkitRunner,
    assert_tool_allowed,
)
from app.services.pdf_evidence_generator import generate_dispute_evidence_pdf


def test_pdf_evidence_generator() -> None:
    bundle = {
        "dispute_id": "PP-D-90418-SANDBOX",
        "booking_id": str(uuid4()),
        "org_name": "Selam Hair Studio",
        "capture_id": "CAP-TEST-123",
        "dispute_amount": "30.00",
        "free_cancel_deadline": "2026-10-24 12:00 UTC",
        "agreed_no_show_fee": "30.00",
        "policy_version": "v1.0-standard",
        "consent_verified": True,
        "terms_hash": "a1b2c3d4e5f6",
        "signature_prefix": "ed25519-sig-test",
        "ledger_chain_verified": True,
        "ledger_entries_checked": 5,
        "terminal_ledger_hash": "deadbeef123456",
        "transcript_excerpt": [
            {
                "role": "Client",
                "english": "I want to book braids Saturday at 3:00 PM with Selam. I accept the $30 no-show fee policy.",
            }
        ],
        "advocate_summary": "Cardholder consented to cancellation policy via verified Ed25519 signature.",
        "skeptic_win_probability": 94,
    }

    pdf_bytes = generate_dispute_evidence_pdf(bundle)
    assert pdf_bytes.startswith(b"%PDF-1.4")
    assert b"SALONDESK CRYPTOGRAPHIC DISPUTE EVIDENCE DOSSIER" in pdf_bytes
    assert b"VERIFIED" in pdf_bytes and b"MATHEMATICAL PASS" in pdf_bytes
    assert b"CONTINUOUS CHAIN VERIFIED" in pdf_bytes
    assert pdf_bytes.endswith(b"%%EOF\n")


def test_blocked_agent_tools_guardrail() -> None:
    assert "accept_dispute_claim" in BLOCKED_AGENT_TOOLS

    with pytest.raises(PolicyViolationException) as exc:
        assert_tool_allowed("accept_dispute_claim")
    assert "strictly prohibited" in str(exc.value) or "prohibited by SalonDesk policy" in str(
        exc.value
    )


@pytest.mark.asyncio
async def test_agent_toolkit_blocks_autonomous_claim_acceptance() -> None:
    runner = PayPalToolkitRunner()
    user = User(
        id=uuid4(),
        email="test@example.com",
        role=UserRole.CLIENT,
    )
    res = await runner.run("Please accept dispute claim on transaction", user=user)
    assert res["status"] == "error"
    assert "prohibited by SalonDesk policy" in res["message"]


@pytest.mark.asyncio
async def test_dispute_counsel_3_role_analysis_verified() -> None:
    org_id = uuid4()
    booking_id = uuid4()
    client_id = uuid4()

    booking = Booking(
        id=booking_id,
        org_id=org_id,
        client_id=client_id,
        status=BookingStatus.NO_SHOW,
        total_price=Decimal("60.00"),
        agreed_no_show_fee=Decimal("30.00"),
        starts_at=datetime.now(UTC),
        ends_at=datetime.now(UTC) + timedelta(hours=1),
        free_cancel_deadline_at=datetime.now(UTC) - timedelta(hours=24),
    )
    org = Organization(id=org_id, name="Selam Hair Studio")

    signed_payload = f"booking={booking_id};fee=30.00"
    terms_hash, sig_b64 = build_consent_signature(signed_payload)
    consent = Consent(
        id=uuid4(),
        booking_id=booking_id,
        client_id=client_id,
        terms_version="v1.0",
        terms_text_hash=terms_hash,
        signature_b64=sig_b64,
        signed_payload=signed_payload,
    )

    hold_id = uuid4()
    capture = PaymentCapture(
        id=uuid4(),
        booking_id=booking_id,
        hold_id=hold_id,
        amount=Decimal("30.00"),
        currency="USD",
        capture_type=PaymentCaptureType.NO_SHOW_FEE,
        status="COMPLETED",
        paypal_capture_id="CAP-12345",
    )

    db = AsyncMock()
    db.bind = MagicMock()
    db.bind.dialect.name = "sqlite"

    async def mock_get(model, pk):
        if model is Booking and pk == booking_id:
            return booking
        if model is Organization and pk == org_id:
            return org
        return None

    db.get = AsyncMock(side_effect=mock_get)

    # Mock execute results for consent, hold, capture, ledger
    async def mock_execute(stmt):
        stmt_str = str(stmt)
        mock_result = MagicMock()
        if "FROM consent" in stmt_str:
            mock_result.scalar_one_or_none.return_value = consent
        elif "FROM payment_hold" in stmt_str:
            mock_result.scalar_one_or_none.return_value = None
        elif "FROM payment_capture" in stmt_str:
            mock_result.scalar_one_or_none.return_value = capture
        elif "FROM dispute_case" in stmt_str:
            mock_result.scalar_one_or_none.return_value = None
        elif "FROM ledger_entry" in stmt_str:
            mock_result.scalars.return_value.all.return_value = []
            mock_result.scalar_one_or_none.return_value = None
        else:
            mock_result.scalar_one_or_none.return_value = None
            mock_result.scalars.return_value.all.return_value = []
        return mock_result

    db.execute = AsyncMock(side_effect=mock_execute)
    db.flush = AsyncMock()
    db.add = MagicMock()

    service = DisputeService()
    case = await service.run_dispute_counsel_analysis(db, booking_id=booking_id)

    # Assert 3-role pipeline outputs
    assert case.consent_verified is True
    assert case.ledger_chain_verified is True
    assert case.skeptic_win_probability >= 88
    assert case.recommended_action == DisputeRecommendation.FILE_EVIDENCE
    assert case.recommended_offer_amount is None
    assert "Selam Hair Studio" in case.advocate_rebuttal_text
    assert "Ed25519" in case.advocate_rebuttal_text


@pytest.mark.asyncio
async def test_dispute_counsel_unverified_recommends_offer() -> None:
    org_id = uuid4()
    booking_id = uuid4()

    booking = Booking(
        id=booking_id,
        org_id=org_id,
        client_id=uuid4(),
        status=BookingStatus.NO_SHOW,
        total_price=Decimal("60.00"),
        agreed_no_show_fee=Decimal("30.00"),
        starts_at=datetime.now(UTC),
        ends_at=datetime.now(UTC) + timedelta(hours=1),
        free_cancel_deadline_at=datetime.now(UTC) - timedelta(hours=24),
    )
    org = Organization(id=org_id, name="Test Studio")

    db = AsyncMock()
    db.bind = MagicMock()
    db.bind.dialect.name = "sqlite"

    async def mock_get(model, pk):
        if model is Booking and pk == booking_id:
            return booking
        if model is Organization and pk == org_id:
            return org
        return None

    db.get = AsyncMock(side_effect=mock_get)

    async def mock_execute(stmt):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_result.scalars.return_value.all.return_value = []
        return mock_result

    db.execute = AsyncMock(side_effect=mock_execute)
    db.flush = AsyncMock()
    db.add = MagicMock()

    service = DisputeService()
    case = await service.run_dispute_counsel_analysis(db, booking_id=booking_id)

    # Missing consent should lower win probability and recommend settlement offer
    assert case.consent_verified is False
    assert case.skeptic_win_probability <= 65
    assert case.recommended_action == DisputeRecommendation.MAKE_OFFER
    assert case.recommended_offer_amount == Decimal("15.00")


@pytest.mark.asyncio
async def test_submit_dispute_defense_and_adjudicate() -> None:
    org_id = uuid4()
    booking_id = uuid4()
    case_id = uuid4()

    user = User(
        id=uuid4(),
        email="owner@selam.et",
        role=UserRole.ORG_OWNER,
        org_id=org_id,
    )
    booking = Booking(
        id=booking_id,
        org_id=org_id,
        agreed_no_show_fee=Decimal("30.00"),
        free_cancel_deadline_at=datetime.now(UTC),
    )
    org = Organization(id=org_id, name="Selam Hair Studio")

    dispute_case = DisputeCase(
        id=case_id,
        booking_id=booking_id,
        org_id=org_id,
        paypal_dispute_id="PP-D-DEMO-9999",
        dispute_amount=Decimal("30.00"),
        status=DisputeCaseStatus.EVIDENCE_READY,
        consent_verified=True,
        ledger_chain_verified=True,
        ledger_entries_checked=2,
        investigator_report_json={},
        advocate_rebuttal_text="Formal rebuttal text",
        skeptic_win_probability=94,
    )

    db = AsyncMock()
    db.bind = MagicMock()
    db.bind.dialect.name = "sqlite"

    async def mock_get(model, pk):
        if model is DisputeCase and pk == case_id:
            return dispute_case
        if model is Booking and pk == booking_id:
            return booking
        if model is Organization and pk == org_id:
            return org
        return None

    db.get = AsyncMock(side_effect=mock_get)
    db.flush = AsyncMock()
    db.add = MagicMock()

    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = None
    mock_res.scalars.return_value.all.return_value = []
    db.execute = AsyncMock(return_value=mock_res)

    mock_paypal = AsyncMock()
    mock_paypal.provide_dispute_evidence.return_value = {
        "status": "UNDER_REVIEW",
        "paypal_debug_id": "debug-evidence-999",
    }
    mock_paypal.sandbox_adjudicate.return_value = {
        "status": "RESOLVED_SELLER_FAVOR",
        "paypal_debug_id": "debug-adj-999",
    }

    service = DisputeService(rest_client=mock_paypal)

    # 1. Submit defense
    updated = await service.submit_dispute_defense(
        db,
        dispute_case_id=case_id,
        actor_user=user,
    )
    assert updated.status == DisputeCaseStatus.UNDER_REVIEW
    assert updated.paypal_debug_id == "debug-evidence-999"

    # 2. Adjudicate sandbox
    adjudicated = await service.adjudicate_sandbox_dispute(
        db,
        dispute_case_id=case_id,
        outcome="SELLER_FAVOR",
        actor_user=user,
    )
    assert adjudicated.status == DisputeCaseStatus.RESOLVED_SELLER_FAVOR
    assert adjudicated.adjudication_outcome == "SELLER_FAVOR"
    assert adjudicated.resolved_at is not None

    # Validate Pydantic schema serialization
    from app.schemas.dispute import DisputeCaseOut

    out = DisputeCaseOut.model_validate(adjudicated)
    assert out.paypal_dispute_id == "PP-D-DEMO-9999"
    assert out.status == DisputeCaseStatus.RESOLVED_SELLER_FAVOR
