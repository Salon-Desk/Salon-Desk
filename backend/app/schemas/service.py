from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class ServiceCategoryCreate(BaseModel):
    name: str
    description: str | None = None
    status: str = "ACTIVE"


class ServiceCategoryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None


class ServiceCategoryOut(ORMModel):
    id: UUID
    name: str
    description: str | None = None
    status: str = "ACTIVE"
    active_organizations_count: int = 0
    active_services_count: int = 0
    created_at: datetime


class TaxonomyMetricsOut(BaseModel):
    total_categories: int
    active_categories: int
    total_active_organizations: int
    total_active_services: int


class ServiceCreate(BaseModel):
    service_category_id: UUID
    name: str
    description: str | None = None
    images: dict = Field(default_factory=lambda: {"cover": None, "additional": []})
    base_price: Decimal = Field(ge=0)
    duration_minutes: int = Field(gt=0)
    simultaneous_capacity: int = Field(default=1, ge=1)
    cancellation_policy_id: UUID | None = None


class ServiceUpdate(BaseModel):
    service_category_id: UUID | None = None
    name: str | None = None
    description: str | None = None
    images: dict | None = None
    base_price: Decimal | None = Field(default=None, ge=0)
    duration_minutes: int | None = Field(default=None, gt=0)
    simultaneous_capacity: int | None = Field(default=None, ge=1)
    cancellation_policy_id: UUID | None = None
    status: str | None = None


class ServiceOut(ORMModel):
    id: UUID
    service_category_id: UUID
    organization_id: UUID
    name: str
    description: str | None = None
    images: dict
    base_price: Decimal
    duration_minutes: int
    status: str
    cancellation_policy_id: UUID | None = None
    simultaneous_capacity: int
    created_at: datetime


class ServiceGivingCreate(BaseModel):
    user_id: UUID


class ServiceGivingOut(ORMModel):
    id: UUID
    service_id: UUID
    user_id: UUID
    created_at: datetime


class CatalogServiceOut(ORMModel):
    id: UUID
    organization_id: UUID
    service_category_id: UUID
    name: str
    description: str | None = None
    images: dict
    base_price: Decimal
    duration_minutes: int
    simultaneous_capacity: int
    organization_name: str | None = None
    category_name: str | None = None
    distance_km: float | None = None
    platform_commission_amount: Decimal | None = None
    authorization_hold_amount: Decimal | None = None
    rating_avg: float = 4.8
    review_count: int = 0
    is_featured: bool = False
    featured_badge: str | None = None


class CatalogServicesPage(BaseModel):
    items: list[CatalogServiceOut]
    page: int
    page_size: int
    total: int
    has_more: bool
