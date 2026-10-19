"""SaaS commission accrual and periodic org invoice billing."""

from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.booking import Booking
from app.models.enums import (
    CommissionRecordStatus,
    OrgCommissionInvoiceStatus,
    PaymentCaptureType,
)
from app.models.ledger import CommissionRecord, OrgCommissionInvoice
from app.models.payment import PaymentCapture
from app.services.payment_service import append_ledger


def _commission_from_snapshot(gross: Decimal, snapshot: dict) -> Decimal:
    """Calculate platform fee strictly from booking-time commission_snapshot."""
    amount = Decimal("0")
    pct = snapshot.get("percentage")
    if pct is not None:
        amount += (gross * Decimal(str(pct)) / Decimal("100")).quantize(Decimal("0.01"))
    flat = snapshot.get("flat")
    if flat is not None:
        amount += Decimal(str(flat))
    # Prefer precomputed amount when present and no percentage/flat (legacy seed)
    if amount == 0 and snapshot.get("amount") is not None and pct is None and flat is None:
        amount = Decimal(str(snapshot["amount"]))
    return amount.quantize(Decimal("0.01"))


async def accrue_commission_for_capture(
    db: AsyncSession,
    *,
    booking: Booking,
    capture: PaymentCapture,
) -> CommissionRecord:
    existing = await db.execute(
        select(CommissionRecord).where(CommissionRecord.capture_id == capture.id)
    )
    found = existing.scalar_one_or_none()
    if found:
        return found

    applied = dict(booking.commission_snapshot or {})
    gross_service_base = booking.total_price or Decimal("0")
    if applied.get("amount") is not None and gross_service_base > 0:
        full_platform = Decimal(str(applied["amount"]))
        if capture.capture_type == PaymentCaptureType.FULL and capture.amount >= (
            gross_service_base + full_platform
        ).quantize(Decimal("0.01")):
            platform_fee = full_platform
        else:
            ratio = capture.amount / gross_service_base
            platform_fee = (full_platform * ratio).quantize(Decimal("0.01"))
    elif applied.get("percentage") is not None or applied.get("flat") is not None:
        platform_fee = _commission_from_snapshot(gross_service_base, applied)
        if gross_service_base > 0 and capture.amount < gross_service_base:
            ratio = capture.amount / gross_service_base
            platform_fee = (platform_fee * ratio).quantize(Decimal("0.01"))
    else:
        platform_fee = Decimal("0.00")

    net = (capture.amount - platform_fee).quantize(Decimal("0.01"))
    record = CommissionRecord(
        org_id=booking.org_id,
        booking_id=booking.id,
        capture_id=capture.id,
        gross_captured_amount=capture.amount,
        applied_rate_json=applied,
        platform_commission_amount=platform_fee,
        net_org_amount=net,
        currency=capture.currency,
        status=CommissionRecordStatus.ACCRUED,
    )
    db.add(record)
    await db.flush()

    await append_ledger(
        db,
        event_type="COMMISSION_ACCRUED",
        payload={
            "commission_record_id": str(record.id),
            "capture_id": str(capture.id),
            "applied_rate_json": applied,
            "platform_commission_amount": str(platform_fee),
        },
        org_id=booking.org_id,
        booking_id=booking.id,
        hold_id=capture.hold_id,
        amount=platform_fee,
        currency=capture.currency,
    )
    return record


async def list_org_commission_records(
    db: AsyncSession,
    org_id: UUID,
    *,
    status: str | None = None,
) -> list[CommissionRecord]:
    stmt = select(CommissionRecord).where(CommissionRecord.org_id == org_id)
    if status:
        stmt = stmt.where(CommissionRecord.status == CommissionRecordStatus(status.upper()))
    stmt = stmt.order_by(CommissionRecord.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def list_org_invoices(
    db: AsyncSession,
    org_id: UUID,
    *,
    status: str | None = None,
) -> list[OrgCommissionInvoice]:
    stmt = select(OrgCommissionInvoice).where(OrgCommissionInvoice.org_id == org_id)
    if status:
        stmt = stmt.where(OrgCommissionInvoice.status == OrgCommissionInvoiceStatus(status.upper()))
    stmt = stmt.order_by(OrgCommissionInvoice.period_end.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def list_all_invoices(
    db: AsyncSession,
    *,
    status: str | None = None,
    org_id: UUID | None = None,
) -> list[OrgCommissionInvoice]:
    stmt = select(OrgCommissionInvoice)
    if org_id is not None:
        stmt = stmt.where(OrgCommissionInvoice.org_id == org_id)
    if status:
        stmt = stmt.where(OrgCommissionInvoice.status == OrgCommissionInvoiceStatus(status.upper()))
    stmt = stmt.order_by(OrgCommissionInvoice.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def generate_invoice(
    db: AsyncSession,
    *,
    org_id: UUID,
    period_start: date,
    period_end: date,
    due_date: date | None = None,
    currency: str = "USD",
) -> OrgCommissionInvoice:
    if period_end < period_start:
        raise ForbiddenError("period_end must be on or after period_start")

    result = await db.execute(
        select(CommissionRecord).where(
            CommissionRecord.org_id == org_id,
            CommissionRecord.status == CommissionRecordStatus.ACCRUED,
            CommissionRecord.created_at
            >= datetime.combine(period_start, datetime.min.time(), tzinfo=UTC),
            CommissionRecord.created_at
            < datetime.combine(period_end + timedelta(days=1), datetime.min.time(), tzinfo=UTC),
        )
    )
    records = list(result.scalars().all())
    total_gross = sum((r.gross_captured_amount for r in records), Decimal("0"))
    total_commission = sum((r.platform_commission_amount for r in records), Decimal("0"))

    invoice = OrgCommissionInvoice(
        org_id=org_id,
        period_start=period_start,
        period_end=period_end,
        total_gross_volume=total_gross,
        total_commission_due=total_commission,
        currency=currency,
        status=OrgCommissionInvoiceStatus.DRAFT,
        due_date=due_date or (period_end + timedelta(days=14)),
    )
    db.add(invoice)
    await db.flush()

    for record in records:
        record.invoice_id = invoice.id
        record.status = CommissionRecordStatus.INVOICED

    await db.flush()
    return invoice


async def get_invoice(db: AsyncSession, invoice_id: UUID) -> OrgCommissionInvoice:
    invoice = await db.get(OrgCommissionInvoice, invoice_id)
    if invoice is None:
        raise NotFoundError("Commission invoice not found")
    return invoice


async def issue_invoice(db: AsyncSession, *, invoice_id: UUID) -> OrgCommissionInvoice:
    invoice = await get_invoice(db, invoice_id)
    if invoice.status != OrgCommissionInvoiceStatus.DRAFT:
        raise ForbiddenError("Only DRAFT invoices can be issued")
    invoice.status = OrgCommissionInvoiceStatus.ISSUED
    await db.flush()
    return invoice


async def void_invoice(db: AsyncSession, *, invoice_id: UUID) -> OrgCommissionInvoice:
    invoice = await get_invoice(db, invoice_id)
    if invoice.status in {OrgCommissionInvoiceStatus.PAID, OrgCommissionInvoiceStatus.VOID}:
        raise ForbiddenError("Invoice cannot be voided")
    invoice.status = OrgCommissionInvoiceStatus.VOID

    result = await db.execute(
        select(CommissionRecord).where(CommissionRecord.invoice_id == invoice.id)
    )
    for record in result.scalars().all():
        if record.status == CommissionRecordStatus.INVOICED:
            record.status = CommissionRecordStatus.ACCRUED
            record.invoice_id = None

    await db.flush()
    return invoice


async def pay_invoice(
    db: AsyncSession,
    *,
    invoice_id: UUID,
    org_id: UUID | None = None,
    paypal_invoice_or_order_id: str | None = None,
) -> OrgCommissionInvoice:
    invoice = await get_invoice(db, invoice_id)
    if org_id is not None and invoice.org_id != org_id:
        raise ForbiddenError("Invoice belongs to another organization")
    if invoice.status not in {
        OrgCommissionInvoiceStatus.ISSUED,
        OrgCommissionInvoiceStatus.OVERDUE,
    }:
        raise ForbiddenError("Only ISSUED or OVERDUE invoices can be paid")

    invoice.status = OrgCommissionInvoiceStatus.PAID
    invoice.paid_at = datetime.now(UTC)
    if paypal_invoice_or_order_id:
        invoice.paypal_invoice_or_order_id = paypal_invoice_or_order_id

    result = await db.execute(
        select(CommissionRecord).where(CommissionRecord.invoice_id == invoice.id)
    )
    for record in result.scalars().all():
        record.status = CommissionRecordStatus.PAID

    await db.flush()
    await append_ledger(
        db,
        event_type="COMMISSION_INVOICE_PAID",
        payload={
            "invoice_id": str(invoice.id),
            "paypal_invoice_or_order_id": invoice.paypal_invoice_or_order_id,
        },
        org_id=invoice.org_id,
        amount=invoice.total_commission_due,
        currency=invoice.currency,
    )
    return invoice
