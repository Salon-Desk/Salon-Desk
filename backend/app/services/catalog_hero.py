"""Public catalog hero and featured-item reads."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.curation import FeaturedItem, PlatformCurationSetting
from app.models.enums import OrganizationStatus, ServiceStatus
from app.models.organization import Organization, OrgSettings
from app.models.service import Service
from app.schemas.curation import CatalogCurationOut, FeaturedOrganizationOut, FeaturedServiceOut
from app.schemas.organization import CatalogHeroOut
from app.services import feedback_service
from app.services.cache_service import cache_service
from app.services.catalog_mapping import organization_to_out, service_to_out
from app.services.catalog_queries import count_active_services, count_approved_organizations


async def get_catalog_hero(db: AsyncSession) -> CatalogHeroOut:
    """Landing hero content derived from approved salons and active services, with admin curation overrides."""
    cache_key = "catalog:hero"
    cached = await cache_service.get_json(cache_key)
    if cached is not None:
        try:
            return CatalogHeroOut.model_validate(cached)
        except Exception:
            pass

    curation_result = await db.execute(
        select(PlatformCurationSetting).where(PlatformCurationSetting.key == "default").limit(1)
    )
    curation_setting = curation_result.scalar_one_or_none()

    featured_org: Organization | None = None
    featured_settings: OrgSettings | None = None

    if curation_setting and curation_setting.hero_featured_org_id:
        target_res = await db.execute(
            select(Organization, OrgSettings)
            .outerjoin(OrgSettings, OrgSettings.org_id == Organization.id)
            .where(
                Organization.id == curation_setting.hero_featured_org_id,
                Organization.status == OrganizationStatus.APPROVED,
            )
        )
        target_row = target_res.first()
        if target_row:
            featured_org = target_row[0]
            featured_settings = target_row[1]

    if featured_org is None:
        org_result = await db.execute(
            select(Organization, OrgSettings)
            .outerjoin(OrgSettings, OrgSettings.org_id == Organization.id)
            .where(Organization.status == OrganizationStatus.APPROVED)
            .order_by(Organization.name)
            .limit(1)
        )
        row = org_result.first()
        featured_org = row[0] if row else None
        featured_settings = row[1] if row else None

    salon_count = await count_approved_organizations(db)
    service_count = await count_active_services(db)

    fallback_name = featured_org.name if featured_org else "SalonDesk"
    fallback_desc = (
        featured_org.description if featured_org and featured_org.description else None
    ) or "Reserve salon appointments with PayPal authorization holds. $0 is debited today."
    fallback_pic = featured_org.picture if featured_org else None
    address = featured_settings.physical_address if featured_settings else None

    if curation_setting and curation_setting.is_active:
        eyebrow = curation_setting.hero_eyebrow or fallback_name
        headline = curation_setting.hero_headline or "Book salon services with"
        highlight = curation_setting.hero_highlight or "zero upfront charge."
        subtitle = curation_setting.hero_subtitle or fallback_desc
        image_url = curation_setting.hero_image_url or fallback_pic
        image_alt = curation_setting.hero_image_alt or fallback_name
    else:
        eyebrow = fallback_name if featured_org else "SalonDesk marketplace"
        headline = "Book salon services with"
        highlight = "zero upfront charge."
        subtitle = fallback_desc
        image_url = fallback_pic
        image_alt = fallback_name

    hero = CatalogHeroOut(
        eyebrow=eyebrow,
        headline=headline,
        highlight=highlight,
        subtitle=subtitle,
        image_url=image_url,
        image_alt=image_alt,
        organization_id=featured_org.id if featured_org else None,
        organization_name=featured_org.name if featured_org else None,
        physical_address=address,
        salon_count=salon_count,
        service_count=service_count,
    )
    await cache_service.set_json(cache_key, hero.model_dump(mode="json"), ttl_seconds=120)
    return hero


async def get_catalog_curation(db: AsyncSession) -> CatalogCurationOut:
    """Public discovery payload containing hero banner and featured salons and services."""
    hero = await get_catalog_hero(db)

    items_res = await db.execute(
        select(FeaturedItem)
        .options(
            selectinload(FeaturedItem.organization).selectinload(Organization.settings),
            selectinload(FeaturedItem.service).selectinload(Service.organization),
            selectinload(FeaturedItem.service).selectinload(Service.category),
        )
        .where(FeaturedItem.is_active.is_(True))
        .order_by(FeaturedItem.display_order.asc(), FeaturedItem.created_at.desc())
    )
    items = list(items_res.scalars().all())

    featured_orgs: list[FeaturedOrganizationOut] = []
    featured_services: list[FeaturedServiceOut] = []

    for item in items:
        if (
            item.target_type == "organization"
            and item.organization
            and item.organization.status == OrganizationStatus.APPROVED
        ):
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
        elif (
            item.target_type == "service"
            and item.service
            and item.service.status == ServiceStatus.ACTIVE
        ):
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

    return CatalogCurationOut(
        hero=hero,
        featured_organizations=featured_orgs,
        featured_services=featured_services,
    )
