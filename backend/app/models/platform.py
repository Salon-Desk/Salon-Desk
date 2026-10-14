import uuid
from decimal import Decimal

from sqlalchemy import Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampedModel
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
