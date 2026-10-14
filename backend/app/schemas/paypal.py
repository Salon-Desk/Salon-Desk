from decimal import Decimal

from pydantic import BaseModel


class CreateOrderRequest(BaseModel):
    booking_id: str
    amount: Decimal
    currency: str = "USD"


class CaptureResponse(BaseModel):
    authorization_id: str
    status: str
    debug_id: str | None = None


class PayPalWebhookEvent(BaseModel):
    id: str
    event_type: str
    resource: dict
    create_time: str | None = None
