from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import DbSession
from app.core.exceptions import NotFoundError
from app.schemas.common import PageOut
from app.schemas.curation import CatalogCurationOut
from app.schemas.feedback import CatalogStaffOut, ClientFeedbackOut, OrgFeedbackSummaryOut
from app.schemas.organization import (
    CatalogCancellationPolicyOut,
    CatalogHeroOut,
    CatalogOrganizationOut,
)
from app.schemas.service import CatalogServiceOut, CatalogServicesPage, ServiceCategoryOut
from app.services import catalog_service

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/hero", response_model=CatalogHeroOut)
async def get_catalog_hero(db: DbSession) -> CatalogHeroOut:
    """Landing hero content derived from approved salons and active services, with admin curation overrides."""
    return await catalog_service.get_catalog_hero(db)


@router.get("/curation", response_model=CatalogCurationOut)
async def get_catalog_curation(db: DbSession) -> CatalogCurationOut:
    """Public discovery payload containing hero banner and featured salons and services."""
    return await catalog_service.get_catalog_curation(db)


@router.get("/organizations", response_model=PageOut[CatalogOrganizationOut])
async def list_organizations(
    db: DbSession,
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    q: str | None = Query(default=None, description="Search query"),
    sort: str = Query(default="name", pattern="^(name|distance|rating)$"),
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
    max_distance_km: float | None = Query(default=None, gt=0, le=500),
) -> PageOut[CatalogOrganizationOut]:
    wants_distance = sort == "distance" or max_distance_km is not None
    if wants_distance and (lat is None or lng is None):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="lat and lng are required for nearby / distance sorting",
        )
    return await catalog_service.list_organizations(
        db,
        page=page,
        page_size=page_size,
        q=q,
        sort=sort,
        lat=lat,
        lng=lng,
        max_distance_km=max_distance_km,
    )


@router.get("/organizations/{org_id}", response_model=CatalogOrganizationOut)
async def get_organization(org_id: UUID, db: DbSession) -> CatalogOrganizationOut:
    try:
        return await catalog_service.get_organization(db, org_id)
    except NotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=exc.message) from exc


@router.get("/organizations/{org_id}/staff", response_model=PageOut[CatalogStaffOut])
async def list_organization_staff(org_id: UUID, db: DbSession) -> PageOut[CatalogStaffOut]:
    try:
        return await catalog_service.list_organization_staff(db, org_id)
    except NotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=exc.message) from exc


@router.get("/organizations/{org_id}/feedback-summary", response_model=OrgFeedbackSummaryOut)
async def get_organization_feedback_summary(org_id: UUID, db: DbSession) -> OrgFeedbackSummaryOut:
    return await catalog_service.get_organization_feedback_summary(db, org_id)


@router.get("/organizations/{org_id}/feedback", response_model=PageOut[ClientFeedbackOut])
async def list_organization_feedback(
    org_id: UUID,
    db: DbSession,
    stylist_id: UUID | None = Query(default=None, description="Stylist-specific reviews"),
    page_size: int = Query(default=12, ge=1, le=50),
) -> PageOut[ClientFeedbackOut]:
    try:
        return await catalog_service.list_organization_feedback(
            db, org_id=org_id, stylist_id=stylist_id, page_size=page_size
        )
    except NotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=exc.message) from exc


@router.get(
    "/organizations/{org_id}/cancellation-policy",
    response_model=CatalogCancellationPolicyOut,
)
async def get_organization_cancellation_policy(
    org_id: UUID, db: DbSession
) -> CatalogCancellationPolicyOut:
    try:
        return await catalog_service.get_organization_cancellation_policy(db, org_id)
    except NotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=exc.message) from exc


@router.get("/categories", response_model=PageOut[ServiceCategoryOut])
async def list_categories(
    db: DbSession,
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    q: str | None = Query(default=None, description="Search query"),
) -> PageOut[ServiceCategoryOut]:
    return await catalog_service.list_categories(db, page=page, page_size=page_size, q=q)


@router.get("/services", response_model=CatalogServicesPage)
async def list_services(
    db: DbSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=6, ge=1, le=50),
    org_id: UUID | None = None,
    category_id: UUID | None = None,
    q: str | None = Query(default=None, max_length=100),
    sort: str = Query(
        default="name",
        pattern="^(name|popular|rating|price_asc|price_desc|duration|distance)$",
    ),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    min_rating: float | None = Query(default=None, ge=1.0, le=5.0),
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
    max_distance_km: float | None = Query(default=None, gt=0, le=500),
) -> CatalogServicesPage:
    wants_distance = sort == "distance" or max_distance_km is not None
    if wants_distance and (lat is None or lng is None):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="lat and lng are required for nearby / distance sorting",
        )

    return await catalog_service.list_services(
        db,
        page=page,
        page_size=page_size,
        org_id=org_id,
        category_id=category_id,
        q=q,
        sort=sort,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        lat=lat,
        lng=lng,
        max_distance_km=max_distance_km,
    )


@router.get("/services/{service_id}", response_model=CatalogServiceOut)
async def get_service(service_id: UUID, db: DbSession) -> CatalogServiceOut:
    try:
        return await catalog_service.get_service(db, service_id)
    except NotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=exc.message) from exc
