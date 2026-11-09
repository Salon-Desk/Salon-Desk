"""FastAPI endpoints for Dispute Counsel (PayPal Disputes v1 closed-loop defense agent)."""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Response
from sqlalchemy import select

from app.api.deps import DbSession, OptionalUser, OrgMember
from app.core.config import get_settings
from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.booking import Booking
from app.models.dispute import DisputeCase
from app.models.enums import UserRole
from app.models.organization import Organization
from app.schemas.dispute import (
    DisputeAdjudicateRequest,
    DisputeCaseOut,
    DisputeKPIs,
    DisputeListResponse,
    DisputeOfferRequest,
    DisputeSimulateRequest,
)
from app.services.dispute_service import DisputeService
from app.services.pdf_evidence_generator import generate_dispute_evidence_pdf

router = APIRouter(prefix="/disputes", tags=["org-disputes"])


@router.get("", response_model=DisputeListResponse)
async def list_disputes(user: OrgMember, db: DbSession) -> DisputeListResponse:
    """List disputes for the current salon organization along with summary KPIs."""
    org_id = (
        None if user.role in {UserRole.PLATFORM_ADMIN, UserRole.PLATFORM_STAFF} else user.org_id
    )
    service = DisputeService()
    cases, kpis = await service.list_for_org(db, org_id=org_id)

    return DisputeListResponse(
        items=[DisputeCaseOut.model_validate(c) for c in cases],
        kpis=DisputeKPIs(
            total_disputes=kpis["total_disputes"],
            disputed_volume_usd=kpis["disputed_volume_usd"],
            evidence_ready_count=kpis["evidence_ready_count"],
            resolved_seller_favor_count=kpis["resolved_seller_favor_count"],
            average_win_probability=kpis["average_win_probability"],
        ),
    )


@router.get("/booking/{booking_id}", response_model=DisputeCaseOut)
async def get_or_create_dispute_for_booking(
    booking_id: UUID,
    user: OrgMember,
    db: DbSession,
) -> DisputeCaseOut:
    """Get active Dispute Counsel dossier for a booking or initialize it."""
    booking = await db.get(Booking, booking_id)
    if not booking:
        raise NotFoundError(f"Booking {booking_id} not found")
    if (
        user.role not in {UserRole.PLATFORM_ADMIN, UserRole.PLATFORM_STAFF}
        and booking.org_id != user.org_id
    ):
        raise ForbiddenError("You do not have access to this booking's dispute")

    stmt = select(DisputeCase).where(DisputeCase.booking_id == booking_id)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        await db.refresh(existing)
        return DisputeCaseOut.model_validate(existing)

    # If none exists yet, run initial analysis
    service = DisputeService()
    case = await service.run_dispute_counsel_analysis(db, booking_id=booking_id)
    await db.refresh(case)
    return DisputeCaseOut.model_validate(case)


@router.get("/{dispute_id}", response_model=DisputeCaseOut)
async def get_dispute(
    dispute_id: str,
    user: OrgMember,
    db: DbSession,
) -> DisputeCaseOut:
    """Get dispute details by UUID or PayPal dispute ID."""
    service = DisputeService()
    case = await service.get_case(db, dispute_id)
    if (
        user.role not in {UserRole.PLATFORM_ADMIN, UserRole.PLATFORM_STAFF}
        and case.org_id != user.org_id
    ):
        raise ForbiddenError("You do not have access to this dispute")
    await db.refresh(case)
    return DisputeCaseOut.model_validate(case)


@router.post("/booking/{booking_id}/simulate", response_model=DisputeCaseOut)
async def simulate_dispute_chargeback(
    booking_id: UUID,
    body: DisputeSimulateRequest,
    user: OrgMember,
    db: DbSession,
) -> DisputeCaseOut:
    """Simulate a CUSTOMER.DISPUTE.CREATED chargeback and run the 3-role AI pipeline."""
    if get_settings().environment == "production":
        raise ForbiddenError("Dispute simulation is not permitted in production environments.")

    booking = await db.get(Booking, booking_id)
    if not booking:
        raise NotFoundError(f"Booking {booking_id} not found")
    if (
        user.role not in {UserRole.PLATFORM_ADMIN, UserRole.PLATFORM_STAFF}
        and booking.org_id != user.org_id
    ):
        raise ForbiddenError("You do not have access to simulate a dispute for this booking")

    service = DisputeService()
    case = await service.run_dispute_counsel_analysis(
        db,
        booking_id=booking_id,
        reason=body.reason,
        dispute_amount=body.dispute_amount,
    )
    await db.refresh(case)
    return DisputeCaseOut.model_validate(case)


@router.post("/{dispute_id}/submit-evidence", response_model=DisputeCaseOut)
async def submit_dispute_evidence(
    dispute_id: str,
    user: OrgMember,
    db: DbSession,
) -> DisputeCaseOut:
    """HITL Execution: Approve and file cryptographic multipart PDF dossier to PayPal."""
    service = DisputeService()
    case = await service.get_case(db, dispute_id)
    updated = await service.submit_dispute_defense(
        db,
        dispute_case_id=case.id,
        actor_user=user,
    )
    await db.refresh(updated)
    return DisputeCaseOut.model_validate(updated)


@router.post("/{dispute_id}/make-offer", response_model=DisputeCaseOut)
async def make_dispute_settlement_offer(
    dispute_id: str,
    body: DisputeOfferRequest,
    user: OrgMember,
    db: DbSession,
) -> DisputeCaseOut:
    """HITL Execution: Submit partial refund settlement offer to the cardholder."""
    service = DisputeService()
    case = await service.get_case(db, dispute_id)
    updated = await service.submit_dispute_offer(
        db,
        dispute_case_id=case.id,
        offer_amount=body.offer_amount,
        note=body.note,
        actor_user=user,
    )
    await db.refresh(updated)
    return DisputeCaseOut.model_validate(updated)


@router.post("/{dispute_id}/adjudicate-sandbox", response_model=DisputeCaseOut)
async def adjudicate_sandbox_dispute(
    dispute_id: str,
    body: DisputeAdjudicateRequest,
    user: OrgMember,
    db: DbSession,
) -> DisputeCaseOut:
    """Adjudicate dispute in PayPal sandbox (SELLER_FAVOR or BUYER_FAVOR)."""
    if get_settings().environment == "production":
        raise ForbiddenError("Sandbox adjudication is not permitted in production environments.")

    service = DisputeService()
    case = await service.get_case(db, dispute_id)
    updated = await service.adjudicate_sandbox_dispute(
        db,
        dispute_case_id=case.id,
        outcome=body.outcome,
        actor_user=user,
    )
    await db.refresh(updated)
    return DisputeCaseOut.model_validate(updated)


@router.get("/{dispute_id}/evidence.pdf")
async def get_dispute_evidence_pdf(
    dispute_id: str,
    db: DbSession,
    user: OptionalUser = None,
) -> Response:
    """Generate and download/preview the cryptographic dispute PDF dossier."""
    service = DisputeService()
    case = await service.get_case(db, dispute_id)
    if (
        user
        and user.role not in {UserRole.PLATFORM_ADMIN, UserRole.PLATFORM_STAFF}
        and user.org_id
        and case.org_id != user.org_id
    ):
        raise ForbiddenError("You do not have access to this dispute dossier")
    booking = await db.get(Booking, case.booking_id)
    org = await db.get(Organization, case.org_id)
    org_name = org.name if org else "SalonDesk Partner"

    report = case.investigator_report_json or {}
    bundle = {
        "dispute_id": case.paypal_dispute_id,
        "booking_id": str(case.booking_id),
        "org_name": org_name,
        "capture_id": str(case.capture_id or "N/A"),
        "dispute_amount": case.dispute_amount,
        "free_cancel_deadline": report.get("free_cancel_deadline_at_utc", "N/A"),
        "agreed_no_show_fee": booking.agreed_no_show_fee if booking else Decimal("30.00"),
        "policy_version": "v1.0-standard",
        "consent_verified": case.consent_verified,
        "terms_hash": report.get("terms_text_hash", "UNVERIFIED"),
        "signature_prefix": report.get("signature_prefix", "NONE"),
        "ledger_chain_verified": case.ledger_chain_verified,
        "ledger_entries_checked": case.ledger_entries_checked,
        "terminal_ledger_hash": report.get("terminal_ledger_hash", "00000000"),
        "transcript_excerpt": case.transcript_excerpt_json,
        "advocate_summary": case.advocate_rebuttal_text or "",
        "skeptic_win_probability": case.skeptic_win_probability or 90,
    }

    pdf_bytes = generate_dispute_evidence_pdf(bundle)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=evidence_{case.paypal_dispute_id}.pdf"},
    )
