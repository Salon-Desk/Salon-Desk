import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Numeric, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampedModel
from app.models.enums import OrgAccountStatus, PaymentCaptureType, PaymentHoldStatus


class OrgAccount(TimestampedModel):
    __tablename__ = "org_account"
    __table_args__ = (
        Index(
            "uq_org_account_active",
            "org_id",
            unique=True,
            postgresql_where=text("status = 'approved'"),
        ),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organization.id"),
        nullable=False,
        index=True,
    )
    merchant_id: Mapped[str] = mapped_column(String(100), nullable=False)
    merchant_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    status: Mapped[OrgAccountStatus] = mapped_column(
        Enum(
            OrgAccountStatus,
            name="org_account_status",
            values_callable=lambda x: [e.value for e in x],
        ),
        default=OrgAccountStatus.PENDING,
        nullable=False,
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user.id"),
        nullable=True,
    )

    organization = relationship("Organization")
    approver = relationship("User", foreign_keys=[approved_by])


class PaymentHold(TimestampedModel):
    __tablename__ = "payment_hold"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("booking.id"),
        nullable=False,
        index=True,
    )
    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organization.id"),
        nullable=False,
        index=True,
    )
    paypal_order_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    paypal_authorization_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    status: Mapped[PaymentHoldStatus] = mapped_column(
        Enum(
            PaymentHoldStatus,
            name="payment_hold_status",
            values_callable=lambda x: [e.value for e in x],
        ),
        default=PaymentHoldStatus.AUTHORIZED,
        nullable=False,
    )
    honor_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    idempotency_key: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)

    booking = relationship("Booking")
    organization = relationship("Organization")
    captures = relationship("PaymentCapture", back_populates="hold")


class PaymentCapture(BaseModel):
    __tablename__ = "payment_capture"

    hold_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("payment_hold.id"),
        nullable=False,
        index=True,
    )
    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("booking.id"),
        nullable=False,
        index=True,
    )
    paypal_capture_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    capture_type: Mapped[PaymentCaptureType] = mapped_column(
        Enum(
            PaymentCaptureType,
            name="payment_capture_type",
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    paypal_debug_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    hold = relationship("PaymentHold", back_populates="captures")
    booking = relationship("Booking")


class PaypalWebhookEvent(BaseModel):
    __tablename__ = "paypal_webhook_event"

    paypal_event_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    verification_status: Mapped[str] = mapped_column(String(50), nullable=False)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
