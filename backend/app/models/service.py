import uuid
from decimal import Decimal

from sqlalchemy import Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampedModel
from app.models.enums import ServiceStatus


class ServiceCategory(TimestampedModel):
    __tablename__ = "service_category"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), default="ACTIVE", server_default="ACTIVE", nullable=False
    )

    services = relationship("Service", back_populates="category")
    commissions = relationship("PlatformCommission", back_populates="service_category")


class Service(TimestampedModel):
    __tablename__ = "service"

    service_category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("service_category.id"),
        nullable=False,
        index=True,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organization.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    images: Mapped[dict] = mapped_column(JSONB, nullable=False)
    base_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[ServiceStatus] = mapped_column(
        Enum(
            ServiceStatus,
            name="service_status",
            values_callable=lambda x: [e.value for e in x],
        ),
        default=ServiceStatus.ACTIVE,
        nullable=False,
    )
    cancellation_policy_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("org_cancellation_policy.id"),
        nullable=True,
    )
    simultaneous_capacity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    category = relationship("ServiceCategory", back_populates="services")
    organization = relationship("Organization", back_populates="services")
    cancellation_policy = relationship("OrgCancellationPolicy")
    givers = relationship("ServiceGiving", back_populates="service")


class ServiceGiving(BaseModel):
    __tablename__ = "service_giving"

    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("service.id"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user.id"),
        nullable=False,
        index=True,
    )

    service = relationship("Service", back_populates="givers")
    user = relationship("User")


class OrgEmployeeCategory(BaseModel):
    __tablename__ = "org_employee_category"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user.id"),
        nullable=False,
        index=True,
    )
    service_category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("service_category.id"),
        nullable=False,
        index=True,
    )

    user = relationship("User", back_populates="employee_categories")
    service_category = relationship("ServiceCategory")
