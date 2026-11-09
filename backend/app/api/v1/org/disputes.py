"""FastAPI endpoints for Dispute Counsel (PayPal Disputes v1 closed-loop defense agent)."""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import or_, select

from app.api.deps import DbSession, OptionalUser, OrgMember
from app.core.exceptions import ForbiddenError, NotFoundError, PolicyViolationException
from app.models.booking import Booking
from app.models.dispute import DisputeCase
from app.models.enums import DisputeCaseStatus, UserRole
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


def _http_for(exc: Exception) -> int:
    if isinstance(exc, ForbiddenError):
        return status.HTTP_403_FORBIDDEN
    if isinstance(exc, NotFoundError):
        return status.HTTP_404_NOT_FOUND
    if isinstance(exc, PolicyViolationException):
        return status.HTTP_400_BAD_REQUEST
    return status.HTTP_400_BAD_REQUEST


async def _resolve_dispute_case(db: DbSession, dispute_id: str | UUID) -> DisputeCase:
    """Helper to locate DisputeCase by UUID primary key or paypal_dispute_id."""
    if isinstance(dispute_id, UUID):
        stmt = select(DisputeCase).where(DisputeCase.id == dispute_id)
    else:
        try:
            parsed_uuid = UUID(str(dispute_id))
            stmt = select(DisputeCase).where(
                or_(DisputeCase.id == parsed_uuid, DisputeCase.paypal_dispute_id == str(dispute_id))
            )
        except ValueError:
            stmt = select(DisputeCase).where(DisputeCase.paypal_dispute_id == str(dispute_id))

    res = await db.execute(stmt)
    case = res.scalar_one_or_none()
    if not case:
        raise NotFoundError(f"Dispute {dispute_id} not found")
    return case


@router.get("", response_model=DisputeListResponse)
async def list_disputes(user: OrgMember, db: DbSession) -> DisputeListResponse:
    """List disputes for the current salon organization along with summary KPIs."""
    stmt = select(DisputeCase).order_by(DisputeCase.created_at.desc())
    if user.role not in {UserRole.PLATFORM_ADMIN, UserRole.PLATFORM_STAFF}:
        stmt = stmt.where(DisputeCase.org_id == user.org_id)

    res = await db.execute(stmt)
    cases = list(res.scalars().all())

    total_disputes = len(cases)
    disputed_volume = sum((c.dispute_amount for c in cases), Decimal("0.00"))
    ready_count = sum(1 for c in cases if c.status == DisputeCaseStatus.EVIDENCE_READY)
    seller_favor_count = sum(
        1 for c in cases if c.status == DisputeCaseStatus.RESOLVED_SELLER_FAVOR
    )
    probs = [c.skeptic_win_probability for c in cases if c.skeptic_win_probability is not None]
    avg_prob = int(sum(probs) / len(probs)) if probs else 0

    return DisputeListResponse(
        items=[DisputeCaseOut.model_validate(c) for c in cases],
        kpis=DisputeKPIs(
            total_disputes=total_disputes,
            disputed_volume_usd=disputed_volume,
            evidence_ready_count=ready_count,
            resolved_seller_favor_count=seller_favor_count,
            average_win_probability=avg_prob,
        ),
    )


@router.get("/booking/{booking_id}", response_model=DisputeCaseOut)
async def get_or_create_dispute_for_booking(
    booking_id: UUID,
    user: OrgMember,
    db: DbSession,
) -> DisputeCaseOut:
    """Get active Dispute Counsel dossier for a booking or initialize it."""
    try:
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
    except (ForbiddenError, NotFoundError, PolicyViolationException) as exc:
        raise HTTPException(_http_for(exc), detail=exc.message) from exc


@router.get("/{dispute_id}", response_model=DisputeCaseOut)
async def get_dispute(
    dispute_id: str,
    user: OrgMember,
    db: DbSession,
) -> DisputeCaseOut:
    """Get dispute details by UUID or PayPal dispute ID."""
    try:
        case = await _resolve_dispute_case(db, dispute_id)
        if (
            user.role not in {UserRole.PLATFORM_ADMIN, UserRole.PLATFORM_STAFF}
            and case.org_id != user.org_id
        ):
            raise ForbiddenError("You do not have access to this dispute")
        await db.refresh(case)
        return DisputeCaseOut.model_validate(case)
    except (ForbiddenError, NotFoundError, PolicyViolationException) as exc:
        raise HTTPException(_http_for(exc), detail=exc.message) from exc


@router.post("/booking/{booking_id}/simulate", response_model=DisputeCaseOut)
async def simulate_dispute_chargeback(
    booking_id: UUID,
    body: DisputeSimulateRequest,
    user: OrgMember,
    db: DbSession,
) -> DisputeCaseOut:
    """Simulate a CUSTOMER.DISPUTE.CREATED chargeback and run the 3-role AI pipeline."""
    try:
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
    except (ForbiddenError, NotFoundError, PolicyViolationException) as exc:
        raise HTTPException(_http_for(exc), detail=exc.message) from exc


@router.post("/{dispute_id}/submit-evidence", response_model=DisputeCaseOut)
async def submit_dispute_evidence(
    dispute_id: str,
    user: OrgMember,
    db: DbSession,
) -> DisputeCaseOut:
    """HITL Execution: Approve and file cryptographic multipart PDF dossier to PayPal."""
    try:
        case = await _resolve_dispute_case(db, dispute_id)
        service = DisputeService()
        updated = await service.submit_dispute_defense(
            db,
            dispute_case_id=case.id,
            actor_user=user,
        )
        await db.refresh(updated)
        return DisputeCaseOut.model_validate(updated)
    except (ForbiddenError, NotFoundError, PolicyViolationException) as exc:
        raise HTTPException(_http_for(exc), detail=exc.message) from exc


@router.post("/{dispute_id}/make-offer", response_model=DisputeCaseOut)
async def make_dispute_settlement_offer(
    dispute_id: str,
    body: DisputeOfferRequest,
    user: OrgMember,
    db: DbSession,
) -> DisputeCaseOut:
    """HITL Execution: Submit partial refund settlement offer to the cardholder."""
    try:
        case = await _resolve_dispute_case(db, dispute_id)
        service = DisputeService()
        updated = await service.submit_dispute_offer(
            db,
            dispute_case_id=case.id,
            offer_amount=body.offer_amount,
            note=body.note,
            actor_user=user,
        )
        await db.refresh(updated)
        return DisputeCaseOut.model_validate(updated)
    except (ForbiddenError, NotFoundError, PolicyViolationException) as exc:
        raise HTTPException(_http_for(exc), detail=exc.message) from exc


@router.post("/{dispute_id}/adjudicate-sandbox", response_model=DisputeCaseOut)
async def adjudicate_sandbox_dispute(
    dispute_id: str,
    body: DisputeAdjudicateRequest,
    user: OrgMember,
    db: DbSession,
) -> DisputeCaseOut:
    """Adjudicate dispute in PayPal sandbox (SELLER_FAVOR or BUYER_FAVOR)."""
    try:
        case = await _resolve_dispute_case(db, dispute_id)
        service = DisputeService()
        updated = await service.adjudicate_sandbox_dispute(
            db,
            dispute_case_id=case.id,
            outcome=body.outcome,
            actor_user=user,
        )
        await db.refresh(updated)
        return DisputeCaseOut.model_validate(updated)
    except (ForbiddenError, NotFoundError, PolicyViolationException) as exc:
        raise HTTPException(_http_for(exc), detail=exc.message) from exc


@router.get("/{dispute_id}/evidence.pdf")
async def get_dispute_evidence_pdf(
    dispute_id: str,
    db: DbSession,
    user: OptionalUser = None,
) -> Response:
    """Generate and download/preview the cryptographic dispute PDF dossier."""
    try:
        case = await _resolve_dispute_case(db, dispute_id)
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
            headers={
                "Content-Disposition": f"inline; filename=evidence_{case.paypal_dispute_id}.pdf"
            },
        )
    except (ForbiddenError, NotFoundError, PolicyViolationException) as exc:
        raise HTTPException(_http_for(exc), detail=exc.message) from exc
