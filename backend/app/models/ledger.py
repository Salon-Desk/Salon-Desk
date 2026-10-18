import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampedModel
from app.models.enums import (
    CommissionRecordStatus,
    OrgCommissionInvoiceStatus,
    PlatformCommissionType,
)


class PlatformCommission(TimestampedModel):
    __tablename__ = "platform_commission"

    service_category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("service_category.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[PlatformCommissionType] = mapped_column(
        Enum(
            PlatformCommissionType,
            name="platform_commission_type",
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
    )
    percentage: Mapped[Decimal | None] = mapped_column(Numeric(7, 4), nullable=True)
    flat: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    service_category = relationship("ServiceCategory", back_populates="commissions")


class OrgCommissionInvoice(TimestampedModel):
    __tablename__ = "org_commission_invoice"

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organization.id"),
        nullable=False,
        index=True,
    )
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    total_gross_volume: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_commission_due: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    paypal_invoice_or_order_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[OrgCommissionInvoiceStatus] = mapped_column(
        Enum(
            OrgCommissionInvoiceStatus,
            name="org_commission_invoice_status",
            values_callable=lambda x: [e.value for e in x],
        ),
        default=OrgCommissionInvoiceStatus.DRAFT,
        nullable=False,
    )
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    organization = relationship("Organization")
    commission_records = relationship("CommissionRecord", back_populates="invoice")


class CommissionRecord(TimestampedModel):
    __tablename__ = "commission_record"

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organization.id"),
        nullable=False,
        index=True,
    )
    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("booking.id"),
        nullable=False,
        index=True,
    )
    capture_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("payment_capture.id"),
        unique=True,
        nullable=False,
    )
    invoice_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("org_commission_invoice.id"),
        nullable=True,
        index=True,
    )
    gross_captured_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    applied_rate_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    platform_commission_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    net_org_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    status: Mapped[CommissionRecordStatus] = mapped_column(
        Enum(
            CommissionRecordStatus,
            name="commission_record_status",
            values_callable=lambda x: [e.value for e in x],
        ),
        default=CommissionRecordStatus.ACCRUED,
        nullable=False,
    )

    organization = relationship("Organization")
    booking = relationship("Booking")
    capture = relationship("PaymentCapture")
    invoice = relationship("OrgCommissionInvoice", back_populates="commission_records")


class LedgerEntry(BaseModel):
    __tablename__ = "ledger_entry"

    org_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organization.id"),
        nullable=True,
        index=True,
    )
    booking_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("booking.id"),
        nullable=True,
        index=True,
    )
    hold_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("payment_hold.id"),
        nullable=True,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    currency: Mapped[str | None] = mapped_column(String(3), nullable=True)
    payload_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    previous_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    entry_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    paypal_debug_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    organization = relationship("Organization")
    booking = relationship("Booking")
    hold = relationship("PaymentHold")
