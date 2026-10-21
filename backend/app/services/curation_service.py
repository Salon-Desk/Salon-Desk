"""Admin curation reads and the singleton hero settings row."""

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.curation import FeaturedItem, PlatformCurationSetting
from app.models.organization import Organization, OrgSettings
from app.models.service import Service
from app.schemas.curation import (
    AdminCurationOut,
    FeaturedOrganizationOut,
    FeaturedServiceOut,
    HeroSettingsOut,
    PopularSettingsOut,
)
from app.services import feedback_service
from app.services.catalog_mapping import organization_to_out, service_to_out
from app.services.catalog_queries import count_active_services, count_approved_organizations


async def get_or_create_settings(db: AsyncSession) -> PlatformCurationSetting:
    result = await db.execute(
        select(PlatformCurationSetting)
        .options(selectinload(PlatformCurationSetting.hero_featured_org))
        .where(PlatformCurationSetting.key == "default")
    )
    setting = result.scalar_one_or_none()
    if setting is None:
        setting = PlatformCurationSetting(
            key="default",
            hero_eyebrow="SalonDesk marketplace",
            hero_headline="Book salon services with",
            hero_highlight="zero upfront charge.",
            hero_subtitle=(
                "Reserve salon appointments with PayPal authorization holds. $0 is debited today."
            ),
            hero_image_url=None,
            hero_image_alt="Salon services",
            hero_featured_org_id=None,
            popular_min_rating=Decimal("4.00"),
            popular_org_weight=Decimal("0.40"),
            popular_service_weight=Decimal("0.60"),
            is_active=True,
        )
        db.add(setting)
        await db.flush()
    return setting


async def build_admin_curation(db: AsyncSession) -> AdminCurationOut:
    """Assemble hero, popular-algorithm, and featured-item cards for the admin console."""
    setting = await get_or_create_settings(db)
    salon_count = await count_approved_organizations(db)
    service_count = await count_active_services(db)

    featured_org_name = None
    featured_org_address = None
    if setting.hero_featured_org_id:
        org_res = await db.execute(
            select(Organization, OrgSettings)
            .outerjoin(OrgSettings, OrgSettings.org_id == Organization.id)
            .where(Organization.id == setting.hero_featured_org_id)
        )
        row = org_res.first()
        if row:
            featured_org_name = row[0].name
            if row[1]:
                featured_org_address = row[1].physical_address

    hero_out = HeroSettingsOut(
        eyebrow=setting.hero_eyebrow,
        headline=setting.hero_headline,
        highlight=setting.hero_highlight,
        subtitle=setting.hero_subtitle,
        image_url=setting.hero_image_url,
        image_alt=setting.hero_image_alt,
        organization_id=setting.hero_featured_org_id,
        organization_name=featured_org_name,
        physical_address=featured_org_address,
        salon_count=salon_count,
        service_count=service_count,
        is_active=setting.is_active,
    )
    popular_out = PopularSettingsOut(
        min_rating=float(setting.popular_min_rating),
        org_weight=float(setting.popular_org_weight),
        service_weight=float(setting.popular_service_weight),
    )

    items_res = await db.execute(
        select(FeaturedItem)
        .options(
            selectinload(FeaturedItem.organization).selectinload(Organization.settings),
            selectinload(FeaturedItem.service).selectinload(Service.organization),
            selectinload(FeaturedItem.service).selectinload(Service.category),
        )
        .order_by(FeaturedItem.display_order.asc(), FeaturedItem.created_at.desc())
    )
    featured_orgs: list[FeaturedOrganizationOut] = []
    featured_services: list[FeaturedServiceOut] = []
    for item in items_res.scalars().all():
        if item.target_type == "organization" and item.organization:
            org = item.organization
            rating_avg, review_count = await feedback_service.org_feedback_summary(db, org.id)
            featured_orgs.append(
                FeaturedOrganizationOut(
                    id=item.id,
                    item_id=org.id,
                    badge_text=item.badge_text,
                    display_order=item.display_order,
                    is_active=item.is_active,
                    organization=organization_to_out(org, org.settings, rating_avg, review_count),
                )
            )
        elif item.target_type == "service" and item.service:
            svc = item.service
            rating_avg, review_count = 4.8, 0
            if svc.organization_id:
                rating_avg, review_count = await feedback_service.org_feedback_summary(
                    db, svc.organization_id
                )
            featured_services.append(
                FeaturedServiceOut(
                    id=item.id,
                    item_id=svc.id,
                    badge_text=item.badge_text,
                    display_order=item.display_order,
                    is_active=item.is_active,
                    service=service_to_out(
                        svc,
                        rating_avg=rating_avg,
                        review_count=review_count,
                        is_featured=True,
                        featured_badge=item.badge_text,
                    ),
                )
            )

    return AdminCurationOut(
        hero=hero_out,
        popular_settings=popular_out,
        featured_organizations=featured_orgs,
        featured_services=featured_services,
    )
