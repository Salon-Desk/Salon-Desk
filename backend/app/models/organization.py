import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampedModel
from app.models.enums import (
    OrgAccountStatus,
    OrganizationStatus,
    OrgCancellationPolicyStatus,
)


class Organization(TimestampedModel):
    __tablename__ = "organization"

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[OrganizationStatus] = mapped_column(
        Enum(
            OrganizationStatus,
            name="organization_status",
            values_callable=lambda x: [e.value for e in x],
        ),
        default=OrganizationStatus.PENDING,
        nullable=False,
    )
    picture: Mapped[str | None] = mapped_column(String(512), nullable=True)

    owner = relationship("User", foreign_keys=[owner_id])
    users = relationship(
        "User",
        back_populates="organization",
        foreign_keys="User.org_id",
    )
    settings = relationship(
        "OrgSettings",
        back_populates="organization",
        uselist=False,
    )
    services = relationship("Service", back_populates="organization")


class OrgSettings(TimestampedModel):
    __tablename__ = "org_settings"

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organization.id"),
        unique=True,
        nullable=False,
    )
    timezone: Mapped[str] = mapped_column(String(64), nullable=False)
    physical_address: Mapped[str] = mapped_column(String(512), nullable=False)
    lat: Mapped[Decimal | None] = mapped_column(Numeric(10, 7), nullable=True)
    lng: Mapped[Decimal | None] = mapped_column(Numeric(10, 7), nullable=True)
    working_hours: Mapped[dict] = mapped_column(JSONB, nullable=False)

    organization = relationship("Organization", back_populates="settings")


class OrgShift(TimestampedModel):
    __tablename__ = "org_shift"

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organization.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    data: Mapped[dict] = mapped_column(JSONB, nullable=False)

    organization = relationship("Organization")
    employee_shifts = relationship("OrgEmployeeShift", back_populates="org_shift")


class OrgEmployeeShift(BaseModel):
    __tablename__ = "org_employee_shift"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user.id"),
        nullable=False,
        index=True,
    )
    org_shift_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("org_shift.id"),
        nullable=False,
        index=True,
    )

    user = relationship("User")
    org_shift = relationship("OrgShift", back_populates="employee_shifts")


class OrgCancellationPolicy(TimestampedModel):
    __tablename__ = "org_cancellation_policy"

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organization.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[OrgCancellationPolicyStatus] = mapped_column(
        Enum(
            OrgCancellationPolicyStatus,
            name="org_cancellation_policy_status",
            values_callable=lambda x: [e.value for e in x],
        ),
        default=OrgCancellationPolicyStatus.DRAFT,
        nullable=False,
    )
    data: Mapped[dict] = mapped_column(JSONB, nullable=False)

    organization = relationship("Organization")


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
