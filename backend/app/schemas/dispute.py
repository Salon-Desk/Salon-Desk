"""Pydantic v2 schemas for Dispute Counsel and Slot Rescue."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import DisputeCaseStatus, DisputeRecommendation, WaitlistStatus


class DisputeCaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    booking_id: UUID
    org_id: UUID
    capture_id: UUID | None = None
    paypal_dispute_id: str
    paypal_transaction_id: str | None = None
    reason: str | None = "MERCHANDISE_OR_SERVICE_NOT_RECEIVED"
    dispute_amount: Decimal
    status: DisputeCaseStatus | None = DisputeCaseStatus.OPEN
    consent_verified: bool | None = False
    ledger_chain_verified: bool | None = False
    ledger_entries_checked: int | None = 0
    transcript_excerpt_json: list[dict[str, Any]] | None = None
    investigator_report_json: dict[str, Any] | None = None
    advocate_rebuttal_text: str | None = None
    skeptic_win_probability: int | None = None
    skeptic_critique: str | None = None
    recommended_action: DisputeRecommendation | None = None
    recommended_offer_amount: Decimal | None = None
    paypal_debug_id: str | None = None
    adjudication_outcome: str | None = None
    resolved_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class DisputeKPIs(BaseModel):
    total_disputes: int = 0
    disputed_volume_usd: Decimal = Decimal("0.00")
    evidence_ready_count: int = 0
    resolved_seller_favor_count: int = 0
    average_win_probability: int = 0


class DisputeListResponse(BaseModel):
    items: list[DisputeCaseOut]
    kpis: DisputeKPIs


class DisputeSimulateRequest(BaseModel):
    reason: str = "MERCHANDISE_OR_SERVICE_NOT_RECEIVED"
    dispute_amount: Decimal | None = None


class DisputeOfferRequest(BaseModel):
    offer_amount: Decimal = Field(gt=Decimal("0.00"), description="Partial refund offer amount")
    note: str = Field(default="Goodwill settlement offer for customer satisfaction.")


class DisputeAdjudicateRequest(BaseModel):
    outcome: str = Field(default="SELLER_FAVOR", description="SELLER_FAVOR or BUYER_FAVOR")


class WaitlistEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    service_id: UUID
    client_id: UUID | None = None
    client_name: str
    client_email: str
    preferred_starts_at: datetime
    status: WaitlistStatus
    rescued_booking_id: UUID | None = None
    created_at: datetime


class SlotRescueResponse(BaseModel):
    status: str
    action: str
    waived_amount: Decimal
    refund_amount: Decimal
    original_booking_id: UUID
    replacement_booking_id: UUID
    waitlist_entry_id: UUID
    replacement_client_name: str
    paypal_result: dict[str, Any]
    negotiation_rounds: list[dict[str, Any]]
