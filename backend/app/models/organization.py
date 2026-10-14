from decimal import Decimal

from sqlalchemy import Boolean, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Organization(BaseModel):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    paypal_merchant_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    commission_rate: Mapped[Decimal] = mapped_column(
        Numeric(5, 4),
        default=Decimal("0.0500"),
    )
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)

    users = relationship("User", back_populates="organization")
    services = relationship("Service", back_populates="organization")
