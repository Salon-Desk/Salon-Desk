from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel, PageOut


class CatalogStaffOut(ORMModel):
    id: UUID
    org_id: UUID
    role: str
    display_name: str
    picture: str | None = None
    rating_avg: float = 0.0
    review_count: int = 0
    specialties: list[str] = Field(default_factory=list)


class ClientFeedbackOut(ORMModel):
    id: UUID
    booking_id: UUID
    org_id: UUID
    organization_name: str | None = None
    stylist_id: UUID | None = None
    rating: int
    comment: str | None = None
    status: str = "pending"
    created_at: datetime
    client_name: str | None = None
    stylist_name: str | None = None
    service_name: str | None = None
    moderation_notes: str | None = None
    moderated_at: datetime | None = None


class ClientFeedbackModerationReview(BaseModel):
    moderation_notes: str | None = Field(default=None, max_length=2000)


class OrgFeedbackSummaryOut(BaseModel):
    org_id: UUID
    rating_avg: float = 0.0
    review_count: int = 0


class CreateClientFeedbackRequest(BaseModel):
    booking_id: UUID
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)
    # When omitted, feedback is for the salon. When set, must match booking.stylist_id.
    stylist_id: UUID | None = None


CatalogStaffPage = PageOut[CatalogStaffOut]
ClientFeedbackPage = PageOut[ClientFeedbackOut]
