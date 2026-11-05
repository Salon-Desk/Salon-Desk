"""DisputeCase model for closed-loop PayPal Disputes v1 defense agent."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampedModel
from app.models.enums import DisputeCaseStatus, DisputeRecommendation


class DisputeCase(TimestampedModel):
    __tablename__ = "dispute_case"

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
    capture_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("payment_capture.id"),
        nullable=True,
        index=True,
    )
    paypal_dispute_id: Mapped[str] = mapped_column(
        String(128),
        unique=True,
        nullable=False,
        index=True,
    )
    paypal_transaction_id: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
    )
    reason: Mapped[str] = mapped_column(
        String(255),
        default="MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
        nullable=False,
    )
    dispute_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    status: Mapped[DisputeCaseStatus] = mapped_column(
        Enum(
            DisputeCaseStatus,
            name="dispute_case_status",
            values_callable=lambda x: [e.value for e in x],
        ),
        default=DisputeCaseStatus.OPEN,
        nullable=False,
        index=True,
    )
    consent_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    ledger_chain_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    ledger_entries_checked: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    transcript_excerpt_json: Mapped[list[dict] | None] = mapped_column(
        JSONB,
        nullable=True,
    )
    investigator_report_json: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )
    advocate_rebuttal_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    skeptic_win_probability: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    skeptic_critique: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    recommended_action: Mapped[DisputeRecommendation | None] = mapped_column(
        Enum(
            DisputeRecommendation,
            name="dispute_recommendation",
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=True,
    )
    recommended_offer_amount: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )
    paypal_debug_id: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
    )
    adjudication_outcome: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    booking = relationship("Booking", lazy="selectin")
    organization = relationship("Organization", lazy="selectin")
    capture = relationship("PaymentCapture", lazy="selectin")
