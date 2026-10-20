import uuid
from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampedModel


class PlatformCurationSetting(TimestampedModel):
    __tablename__ = "platform_curation_setting"

    key: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, default="default")
    hero_eyebrow: Mapped[str] = mapped_column(
        String(255), nullable=False, default="SalonDesk marketplace"
    )
    hero_headline: Mapped[str] = mapped_column(
        String(255), nullable=False, default="Book salon services with"
    )
    hero_highlight: Mapped[str] = mapped_column(
        String(255), nullable=False, default="zero upfront charge."
    )
    hero_subtitle: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="Reserve salon appointments with PayPal authorization holds. $0 is debited today.",
    )
    hero_image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    hero_image_alt: Mapped[str] = mapped_column(
        String(255), nullable=False, default="Salon services"
    )
    hero_featured_org_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organization.id", ondelete="SET NULL"),
        nullable=True,
    )
    popular_min_rating: Mapped[Decimal] = mapped_column(
        Numeric(3, 2), nullable=False, default=Decimal("4.00")
    )
    popular_org_weight: Mapped[Decimal] = mapped_column(
        Numeric(3, 2), nullable=False, default=Decimal("0.40")
    )
    popular_service_weight: Mapped[Decimal] = mapped_column(
        Numeric(3, 2), nullable=False, default=Decimal("0.60")
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    hero_featured_org = relationship("Organization")


class FeaturedItem(TimestampedModel):
    __tablename__ = "featured_item"

    # 'organization' or 'service'
    target_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    org_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organization.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    service_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("service.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    badge_text: Mapped[str] = mapped_column(String(128), nullable=False, default="Featured")
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    organization = relationship("Organization")
    service = relationship("Service")
