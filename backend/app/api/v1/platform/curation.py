from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, PlatformAdmin
from app.models.curation import FeaturedItem, PlatformCurationSetting
from app.models.enums import OrganizationStatus, ServiceStatus
from app.models.organization import Organization, OrgSettings
from app.models.service import Service
from app.schemas.curation import (
    AdminCurationOut,
    FeaturedItemCreate,
    FeaturedItemUpdate,
    FeaturedOrganizationOut,
    FeaturedServiceOut,
    HeroImageUploadOut,
    HeroSettingsOut,
    HeroSettingsUpdate,
    PopularSettingsOut,
    PopularSettingsUpdate,
)
from app.schemas.organization import CatalogOrganizationOut
from app.schemas.service import CatalogServiceOut
from app.services import feedback_service
from app.services.cache_service import cache_service
from app.services.storage_service import StorageUnavailableError, storage_service

router = APIRouter(prefix="/admin/curation", tags=["platform-curation"])


async def _get_or_create_settings(db: DbSession) -> PlatformCurationSetting:
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
            hero_subtitle="Reserve salon appointments with PayPal authorization holds. $0 is debited today.",
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


@router.get("", response_model=AdminCurationOut)
async def get_curation(user: PlatformAdmin, db: DbSession) -> AdminCurationOut:
    _ = user
    setting = await _get_or_create_settings(db)

    # Count approved salons and active services
    salon_count = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Organization)
                .where(Organization.status == OrganizationStatus.APPROVED)
            )
        ).scalar_one()
    )
    service_count = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Service)
                .join(Organization, Organization.id == Service.organization_id)
                .where(
                    Service.status == ServiceStatus.ACTIVE,
                    Organization.status == OrganizationStatus.APPROVED,
                )
            )
        ).scalar_one()
    )

    # Featured organization name/address if any
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

    # Load featured items
    items_res = await db.execute(
        select(FeaturedItem)
        .options(
            selectinload(FeaturedItem.organization).selectinload(Organization.settings),
            selectinload(FeaturedItem.service).selectinload(Service.organization),
            selectinload(FeaturedItem.service).selectinload(Service.category),
        )
        .order_by(FeaturedItem.display_order.asc(), FeaturedItem.created_at.desc())
    )
    items = list(items_res.scalars().all())

    featured_orgs: list[FeaturedOrganizationOut] = []
    featured_services: list[FeaturedServiceOut] = []

    for item in items:
        if item.target_type == "organization" and item.organization:
            org = item.organization
            settings = org.settings
            rating_avg, review_count = await feedback_service.org_feedback_summary(db, org.id)
            featured_orgs.append(
                FeaturedOrganizationOut(
                    id=item.id,
                    item_id=org.id,
                    badge_text=item.badge_text,
                    display_order=item.display_order,
                    is_active=item.is_active,
                    organization=CatalogOrganizationOut(
                        id=org.id,
                        name=org.name,
                        description=org.description,
                        picture=org.picture,
                        physical_address=settings.physical_address if settings else None,
                        lat=settings.lat if settings else None,
                        lng=settings.lng if settings else None,
                        timezone=settings.timezone if settings else None,
                        rating_avg=rating_avg,
                        review_count=review_count,
                    ),
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
                    service=CatalogServiceOut(
                        id=svc.id,
                        organization_id=svc.organization_id,
                        service_category_id=svc.service_category_id,
                        name=svc.name,
                        description=svc.description,
                        images=svc.images,
                        base_price=svc.base_price,
                        duration_minutes=svc.duration_minutes,
                        simultaneous_capacity=svc.simultaneous_capacity,
                        organization_name=svc.organization.name if svc.organization else None,
                        category_name=svc.category.name if svc.category else None,
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


@router.put("/hero", response_model=HeroSettingsOut)
async def update_hero_settings(
    body: HeroSettingsUpdate, user: PlatformAdmin, db: DbSession
) -> HeroSettingsOut:
    _ = user
    setting = await _get_or_create_settings(db)

    if body.eyebrow is not None:
        setting.hero_eyebrow = body.eyebrow
    if body.headline is not None:
        setting.hero_headline = body.headline
    if body.highlight is not None:
        setting.hero_highlight = body.highlight
    if body.subtitle is not None:
        setting.hero_subtitle = body.subtitle
    if body.image_url is not None:
        setting.hero_image_url = body.image_url.strip() or None
    if body.image_alt is not None:
        setting.hero_image_alt = body.image_alt
    if body.organization_id is not None:
        if body.organization_id:
            org = await db.get(Organization, body.organization_id)
            if not org or org.status != OrganizationStatus.APPROVED:
                raise HTTPException(
                    status.HTTP_404_NOT_FOUND, detail="Approved organization not found"
                )
            setting.hero_featured_org_id = body.organization_id
        else:
            setting.hero_featured_org_id = None
    if body.is_active is not None:
        setting.is_active = body.is_active

    await db.flush()
    await cache_service.delete("catalog:hero")
    await cache_service.delete("catalog:curation")

    return (await get_curation(user, db)).hero


@router.post("/hero/image", response_model=HeroImageUploadOut)
async def upload_hero_image(
    file: UploadFile = File(...),
    user: PlatformAdmin = None,
    db: DbSession = None,
) -> HeroImageUploadOut:
    _ = user
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Uploaded file must be an image")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Image exceeds 10MB limit")
    try:
        _key, url = await storage_service.async_upload_bytes(
            data=data,
            filename=file.filename or "hero-banner.jpg",
            content_type=file.content_type,
            folder="hero",
        )
    except StorageUnavailableError as exc:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, detail="File storage is unavailable"
        ) from exc

    setting = await _get_or_create_settings(db)
    setting.hero_image_url = url
    await db.flush()
    await cache_service.delete("catalog:hero")
    await cache_service.delete("catalog:curation")

    curation_res = await get_curation(user, db)
    return HeroImageUploadOut(image_url=url, hero=curation_res.hero)


@router.put("/popular-algorithm", response_model=PopularSettingsOut)
async def update_popular_settings(
    body: PopularSettingsUpdate, user: PlatformAdmin, db: DbSession
) -> PopularSettingsOut:
    _ = user
    setting = await _get_or_create_settings(db)
    if body.min_rating is not None:
        setting.popular_min_rating = Decimal(str(body.min_rating))
    if body.org_weight is not None:
        setting.popular_org_weight = Decimal(str(body.org_weight))
    if body.service_weight is not None:
        setting.popular_service_weight = Decimal(str(body.service_weight))

    await db.flush()
    await cache_service.delete("catalog:hero")
    await cache_service.delete("catalog:curation")

    return PopularSettingsOut(
        min_rating=float(setting.popular_min_rating),
        org_weight=float(setting.popular_org_weight),
        service_weight=float(setting.popular_service_weight),
    )


@router.post("/featured", status_code=status.HTTP_201_CREATED)
async def create_featured_item(
    body: FeaturedItemCreate, user: PlatformAdmin, db: DbSession
) -> dict:
    _ = user
    if body.target_type == "organization":
        org = await db.get(Organization, body.target_id)
        if not org or org.status != OrganizationStatus.APPROVED:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Approved organization not found")
        item = FeaturedItem(
            target_type="organization",
            org_id=body.target_id,
            service_id=None,
            badge_text=body.badge_text,
            display_order=body.display_order,
            is_active=body.is_active,
        )
    elif body.target_type == "service":
        svc = await db.get(Service, body.target_id)
        if not svc or svc.status != ServiceStatus.ACTIVE:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Active service not found")
        item = FeaturedItem(
            target_type="service",
            org_id=svc.organization_id,
            service_id=body.target_id,
            badge_text=body.badge_text,
            display_order=body.display_order,
            is_active=body.is_active,
        )
    else:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid target type")

    db.add(item)
    await db.flush()
    await cache_service.delete("catalog:curation")
    return {"id": item.id, "message": "Featured item created successfully"}


@router.patch("/featured/{item_id}")
async def update_featured_item(
    item_id: UUID, body: FeaturedItemUpdate, user: PlatformAdmin, db: DbSession
) -> dict:
    _ = user
    item = await db.get(FeaturedItem, item_id)
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Featured item not found")

    if body.badge_text is not None:
        item.badge_text = body.badge_text
    if body.display_order is not None:
        item.display_order = body.display_order
    if body.is_active is not None:
        item.is_active = body.is_active

    await db.flush()
    await cache_service.delete("catalog:curation")
    return {"id": item.id, "message": "Featured item updated successfully"}


@router.delete("/featured/{item_id}")
async def delete_featured_item(item_id: UUID, user: PlatformAdmin, db: DbSession) -> dict:
    _ = user
    item = await db.get(FeaturedItem, item_id)
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Featured item not found")

    await db.delete(item)
    await db.flush()
    await cache_service.delete("catalog:curation")
    return {"id": item.id, "message": "Featured item removed successfully"}
