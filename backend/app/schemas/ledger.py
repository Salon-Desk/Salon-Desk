from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

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


class CommissionRecordOut(ORMModel):
    id: UUID
    org_id: UUID
    booking_id: UUID
    capture_id: UUID
    invoice_id: UUID | None = None
    gross_captured_amount: Decimal
    applied_rate_json: dict
    platform_commission_amount: Decimal
    net_org_amount: Decimal
    currency: str
    status: str
    created_at: datetime
    updated_at: datetime


class OrgCommissionInvoiceOut(ORMModel):
    id: UUID
    org_id: UUID
    period_start: date
    period_end: date
    total_gross_volume: Decimal
    total_commission_due: Decimal
    currency: str
    paypal_invoice_or_order_id: str | None = None
    status: str
    due_date: date
    paid_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class GenerateCommissionInvoiceRequest(BaseModel):
    org_id: UUID
    period_start: date
    period_end: date
    due_date: date | None = None
    currency: str = "USD"


class PayCommissionInvoiceRequest(BaseModel):
    paypal_invoice_or_order_id: str | None = Field(default=None, max_length=100)
