import uuid
from decimal import Decimal

from sqlalchemy import Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampedModel
from app.models.enums import OrganizationStatus


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
