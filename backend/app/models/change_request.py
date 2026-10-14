import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import ChangeRequestStatus, ChangeRequestType


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
