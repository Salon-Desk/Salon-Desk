import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampedModel
from app.models.enums import BookingStatus


class Booking(TimestampedModel):
    __tablename__ = "booking"

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organization.id"),
        nullable=False,
        index=True,
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user.id"),
        nullable=False,
        index=True,
    )
    stylist_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user.id"),
        nullable=True,
        index=True,
    )
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[BookingStatus] = mapped_column(
        Enum(
            BookingStatus,
            name="booking_status",
            values_callable=lambda x: [e.value for e in x],
        ),
        default=BookingStatus.PENDING_PAYMENT,
        nullable=False,
    )
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    agreed_hold_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    agreed_no_show_fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    agreed_late_cancel_fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    free_cancel_deadline_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    reminder_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    policy_snapshot_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    commission_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    cancellation_fee_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    customer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    organization = relationship("Organization")
    client = relationship("User", foreign_keys=[client_id])
    stylist = relationship("User", foreign_keys=[stylist_id])
    booking_services = relationship("BookingService", back_populates="booking")
    payment_holds = relationship(
        "PaymentHold", back_populates="booking", order_by="desc(PaymentHold.created_at)"
    )
    consents = relationship(
        "Consent", back_populates="booking", order_by="desc(Consent.created_at)"
    )
    payment_holds = relationship(
        "PaymentHold", back_populates="booking", order_by="desc(PaymentHold.created_at)"
    )
    consents = relationship(
        "Consent", back_populates="booking", order_by="desc(Consent.created_at)"
    )


class BookingService(BaseModel):
    __tablename__ = "booking_service"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("booking.id"),
        nullable=False,
        index=True,
    )
    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("service.id"),
        nullable=False,
        index=True,
    )
    base_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    service_policy_snapshot_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    commission_rule_snapshot_json: Mapped[dict] = mapped_column(JSONB, nullable=False)

    booking = relationship("Booking", back_populates="booking_services")
    service = relationship("Service")
