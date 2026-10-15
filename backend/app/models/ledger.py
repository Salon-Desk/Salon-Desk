import uuid
from decimal import Decimal

from sqlalchemy import Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampedModel
from app.models.enums import PlatformCommissionType


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
