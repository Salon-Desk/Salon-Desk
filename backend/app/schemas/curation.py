from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel
from app.schemas.organization import CatalogHeroOut, CatalogOrganizationOut
from app.schemas.service import CatalogServiceOut


class HeroSettingsOut(BaseModel):
    eyebrow: str
    headline: str
    highlight: str
    subtitle: str
    image_url: str | None = None
    image_alt: str = "Salon services"
    organization_id: UUID | None = None
    organization_name: str | None = None
    physical_address: str | None = None
    salon_count: int = 0
    service_count: int = 0
    is_active: bool = True


class HeroSettingsUpdate(BaseModel):
    eyebrow: str | None = None
    headline: str | None = None
    highlight: str | None = None
    subtitle: str | None = None
    image_url: str | None = None
    image_alt: str | None = None
    organization_id: UUID | None = None
    is_active: bool | None = None


class PopularSettingsOut(BaseModel):
    min_rating: float = 4.0
    org_weight: float = 0.40
    service_weight: float = 0.60


class PopularSettingsUpdate(BaseModel):
    min_rating: float | None = Field(default=None, ge=1.0, le=5.0)
    org_weight: float | None = Field(default=None, ge=0.0, le=1.0)
    service_weight: float | None = Field(default=None, ge=0.0, le=1.0)


class FeaturedItemCreate(BaseModel):
    target_type: str = Field(..., pattern="^(organization|service)$")
    target_id: UUID
    badge_text: str = Field(default="Featured", max_length=128)
    display_order: int = Field(default=0, ge=0)
    is_active: bool = True


class FeaturedItemUpdate(BaseModel):
    badge_text: str | None = Field(default=None, max_length=128)
    display_order: int | None = Field(default=None, ge=0)
    is_active: bool | None = None


class FeaturedOrganizationOut(ORMModel):
    id: UUID
    item_id: UUID
    badge_text: str
    display_order: int
    is_active: bool
    organization: CatalogOrganizationOut


class FeaturedServiceOut(ORMModel):
    id: UUID
    item_id: UUID
    badge_text: str
    display_order: int
    is_active: bool
    service: CatalogServiceOut


class CatalogCurationOut(BaseModel):
    hero: CatalogHeroOut
    featured_organizations: list[FeaturedOrganizationOut]
    featured_services: list[FeaturedServiceOut]


class AdminCurationOut(BaseModel):
    hero: HeroSettingsOut
    popular_settings: PopularSettingsOut
    featured_organizations: list[FeaturedOrganizationOut]
    featured_services: list[FeaturedServiceOut]
