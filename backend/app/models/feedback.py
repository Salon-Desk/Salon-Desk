import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Index, Integer, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampedModel
from app.models.enums import FeedbackModerationStatus


class ClientFeedback(TimestampedModel):
    """Post-visit client rating for a salon and/or a specific stylist."""

    __tablename__ = "client_feedback"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="client_feedback_rating_range"),
        Index(
            "uq_client_feedback_booking_org",
            "booking_id",
            unique=True,
            postgresql_where=text("stylist_id IS NULL"),
        ),
        Index(
            "uq_client_feedback_booking_stylist",
            "booking_id",
            "stylist_id",
            unique=True,
            postgresql_where=text("stylist_id IS NOT NULL"),
        ),
    )

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
    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organization.id"),
        nullable=False,
        index=True,
    )
    # NULL = salon / organization feedback; set = stylist-specific feedback for the same visit.
    stylist_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user.id"),
        nullable=True,
        index=True,
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[FeedbackModerationStatus] = mapped_column(
        Enum(
            FeedbackModerationStatus,
            name="feedback_moderation_status",
            values_callable=lambda x: [e.value for e in x],
        ),
        default=FeedbackModerationStatus.PENDING,
        nullable=False,
    )
    moderated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user.id"),
        nullable=True,
    )
    moderation_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    moderated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    booking = relationship("Booking", foreign_keys=[booking_id])
    moderator = relationship("User", foreign_keys=[moderated_by])
    client = relationship("User", foreign_keys=[client_id])
    organization = relationship("Organization")
    stylist = relationship("User", foreign_keys=[stylist_id])
