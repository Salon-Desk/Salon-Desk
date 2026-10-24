from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.api.deps import DbSession, PlatformAdmin
from app.models.curation import FeaturedItem
from app.models.enums import OrganizationStatus, ServiceStatus
from app.models.organization import Organization
from app.models.service import Service
from app.schemas.curation import (
    AdminCurationOut,
    FeaturedItemCreate,
    FeaturedItemUpdate,
    HeroImageUploadOut,
    HeroSettingsOut,
    HeroSettingsUpdate,
    PopularSettingsOut,
    PopularSettingsUpdate,
)
from app.services.cache_service import cache_service
from app.services.curation_service import build_admin_curation, get_or_create_settings
from app.services.storage_service import StorageUnavailableError, storage_service

router = APIRouter(prefix="/admin/curation", tags=["platform-curation"])


@router.get("", response_model=AdminCurationOut)
async def get_curation(user: PlatformAdmin, db: DbSession) -> AdminCurationOut:
    _ = user
    return await build_admin_curation(db)


@router.put("/hero", response_model=HeroSettingsOut)
async def update_hero_settings(
    body: HeroSettingsUpdate, user: PlatformAdmin, db: DbSession
) -> HeroSettingsOut:
    _ = user
    setting = await get_or_create_settings(db)

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

    return (await build_admin_curation(db)).hero


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

    setting = await get_or_create_settings(db)
    setting.hero_image_url = url
    await db.flush()
    await cache_service.delete("catalog:hero")
    await cache_service.delete("catalog:curation")

    curation_res = await build_admin_curation(db)
    return HeroImageUploadOut(image_url=url, hero=curation_res.hero)


@router.put("/popular-algorithm", response_model=PopularSettingsOut)
async def update_popular_settings(
    body: PopularSettingsUpdate, user: PlatformAdmin, db: DbSession
) -> PopularSettingsOut:
    _ = user
    setting = await get_or_create_settings(db)
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
