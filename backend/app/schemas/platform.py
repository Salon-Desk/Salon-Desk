from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class PlatformCommissionCreate(BaseModel):
    service_category_id: UUID
    name: str
    type: str
    percentage: Decimal | None = Field(default=None, ge=0)
    flat: Decimal | None = Field(default=None, ge=0)


class PlatformCommissionUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    percentage: Decimal | None = Field(default=None, ge=0)
    flat: Decimal | None = Field(default=None, ge=0)


class PlatformCommissionOut(ORMModel):
    id: UUID
    service_category_id: UUID
    name: str
    type: str
    percentage: Decimal | None = None
    flat: Decimal | None = None
    created_at: datetime


class AdminDashboardOut(BaseModel):
    total_organizations: int
    pending_organizations: int
    approved_organizations: int
    suspended_organizations: int
    pending_change_requests: int
    pending_client_feedback: int = 0
    ledger_entry_count: int
    ledger_amount_sum: Decimal
