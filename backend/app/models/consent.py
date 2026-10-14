import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Consent(BaseModel):
    __tablename__ = "consents"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bookings.id"), index=True
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    terms_version: Mapped[str] = mapped_column(String(50))
    terms_text_hash: Mapped[str] = mapped_column(String(64))
    signature_b64: Mapped[str] = mapped_column(Text)
    signed_payload: Mapped[str] = mapped_column(Text)
