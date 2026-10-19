from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class CreateHoldRequest(BaseModel):
    booking_id: UUID
    idempotency_key: str = Field(min_length=8, max_length=128)
    currency: str = "USD"


class PaymentHoldOut(ORMModel):
    id: UUID
    booking_id: UUID
    org_id: UUID
    paypal_order_id: str | None = None
    parent_authorization_id: str | None = None
    latest_authorization_id: str | None = None
    amount: Decimal
    captured_amount: Decimal
    currency: str
    status: str
    honor_expires_at: datetime | None = None
    reauthorization_count: int
    idempotency_key: str
    created_at: datetime
    # Present when status=PENDING — client opens this to approve the AUTHORIZE hold.
    approval_url: str | None = None


class CompleteHoldRequest(BaseModel):
    """Finalize a PENDING hold after PayPal buyer approval (token from return URL)."""

    paypal_order_token: str | None = None


class PaymentCaptureOut(ORMModel):
    id: UUID
    hold_id: UUID
    booking_id: UUID
    paypal_capture_id: str | None = None
    amount: Decimal
    currency: str
    capture_type: str
    final_capture: bool
    status: str
    paypal_debug_id: str | None = None
    created_at: datetime
