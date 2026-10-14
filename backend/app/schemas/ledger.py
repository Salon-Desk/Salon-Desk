from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import ORMModel


class LedgerEntryOut(ORMModel):
    id: UUID
    org_id: UUID | None = None
    booking_id: UUID | None = None
    hold_id: UUID | None = None
    event_type: str
    amount: Decimal | None = None
    currency: str | None = None
    payload_json: dict
    previous_hash: str
    entry_hash: str
    paypal_debug_id: str | None = None
    created_at: datetime


class ConsentVerifyRequest(BaseModel):
    booking_id: UUID
    signed_payload: str
    signature_b64: str
