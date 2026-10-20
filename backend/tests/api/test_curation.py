import uuid

from app.schemas.curation import (
    AdminCurationOut,
    CatalogCurationOut,
    FeaturedItemCreate,
    HeroSettingsOut,
    PopularSettingsOut,
)
from app.schemas.organization import CatalogHeroOut


def test_curation_schemas():
    hero = CatalogHeroOut(
        eyebrow="Test Eyebrow",
        headline="Test Headline",
        highlight="Zero Cost",
        subtitle="Test Subtitle",
        image_url=None,
        image_alt="Salon",
        salon_count=2,
        service_count=5,
    )
    assert hero.headline == "Test Headline"

    cat_curation = CatalogCurationOut(
        hero=hero,
        featured_organizations=[],
        featured_services=[],
    )
    assert cat_curation.hero.salon_count == 2
    assert len(cat_curation.featured_organizations) == 0

    hero_settings = HeroSettingsOut(
        eyebrow="Eyebrow",
        headline="Headline",
        highlight="Highlight",
        subtitle="Subtitle",
        image_url="https://example.com/hero.jpg",
        image_alt="Hero Alt",
        organization_id=None,
        organization_name=None,
        physical_address=None,
        salon_count=3,
        service_count=10,
        is_active=True,
    )
    admin_curation = AdminCurationOut(
        hero=hero_settings,
        popular_settings=PopularSettingsOut(min_rating=4.5, org_weight=0.4, service_weight=0.6),
        featured_organizations=[],
        featured_services=[],
    )
    assert admin_curation.hero.is_active is True
    assert admin_curation.popular_settings.min_rating == 4.5

    feat_create = FeaturedItemCreate(
        target_type="organization",
        target_id=uuid.uuid4(),
        badge_text="Premier Partner",
        display_order=1,
    )
    assert feat_create.badge_text == "Premier Partner"

    from app.schemas.curation import HeroImageUploadOut

    img_out = HeroImageUploadOut(image_url="https://example.com/banner.jpg", hero=hero_settings)
    assert img_out.image_url == "https://example.com/banner.jpg"
    assert img_out.hero.headline == "Headline"
