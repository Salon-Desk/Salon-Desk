from uuid import UUID

from pydantic import BaseModel


class LedgerEntryOut(BaseModel):
    id: UUID
    event_type: str
    entry_hash: str
    previous_hash: str
    paypal_debug_id: str | None = None

    model_config = {"from_attributes": True}


class ConsentVerifyRequest(BaseModel):
    booking_id: UUID
    signed_payload: str
    signature_b64: str
