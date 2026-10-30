import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampedModel
from app.models.enums import (
    ChangeRequestStatus,
    ChangeRequestType,
    OrgCancellationPolicyStatus,
)


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

    @property
    def org_name(self) -> str | None:
        if "organization" in self.__dict__ and self.organization:
            return self.organization.name
        return None


class ChangeRequest(BaseModel):
    __tablename__ = "change_request"

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organization.id"),
        nullable=False,
        index=True,
    )
    request_type: Mapped[ChangeRequestType] = mapped_column(
        Enum(
            ChangeRequestType,
            name="change_request_type",
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
    )
    payload_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    current_snapshot_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[ChangeRequestStatus] = mapped_column(
        Enum(
            ChangeRequestStatus,
            name="change_request_status",
            values_callable=lambda x: [e.value for e in x],
        ),
        default=ChangeRequestStatus.PENDING,
        nullable=False,
    )
    submitted_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user.id"),
        nullable=False,
    )
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user.id"),
        nullable=True,
    )
    review_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    organization = relationship("Organization")
    submitter = relationship("User", foreign_keys=[submitted_by])
    reviewer = relationship("User", foreign_keys=[reviewed_by])

    @property
    def org_name(self) -> str | None:
        if "organization" in self.__dict__ and self.organization:
            return self.organization.name
        return None

    @property
    def submitter_name(self) -> str | None:
        if "submitter" in self.__dict__ and self.submitter:
            sub = self.submitter
            if "profile" in sub.__dict__ and sub.profile:
                return sub.profile.full_name
            return sub.email
        return None


class Consent(BaseModel):
    __tablename__ = "consent"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("booking.id"),
        nullable=False,
        index=True,
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user.id"),
        nullable=False,
        index=True,
    )
    terms_version: Mapped[str] = mapped_column(String(50), nullable=False)
    terms_text_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    signature_b64: Mapped[str] = mapped_column(Text, nullable=False)
    signed_payload: Mapped[str] = mapped_column(Text, nullable=False)

    booking = relationship("Booking", back_populates="consents")
    client = relationship("User")
