"""Map catalog models onto public response schemas."""

from app.models.organization import Organization, OrgSettings
from app.models.service import Service
from app.schemas.organization import CatalogOrganizationOut
from app.schemas.service import CatalogServiceOut


def organization_to_out(
    org: Organization,
    settings: OrgSettings | None,
    rating_avg: float,
    review_count: int,
    distance_km: float | None = None,
) -> CatalogOrganizationOut:
    return CatalogOrganizationOut(
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
        working_hours=settings.working_hours if settings else None,
        distance_km=distance_km,
    )


def service_to_out(
    service: Service,
    distance_km: float | None = None,
    rating_avg: float = 4.8,
    review_count: int = 0,
    is_featured: bool = False,
    featured_badge: str | None = None,
) -> CatalogServiceOut:
    return CatalogServiceOut(
        id=service.id,
        organization_id=service.organization_id,
        service_category_id=service.service_category_id,
        name=service.name,
        description=service.description,
        images=service.images,
        base_price=service.base_price,
        duration_minutes=service.duration_minutes,
        simultaneous_capacity=service.simultaneous_capacity,
        organization_name=service.organization.name if service.organization else None,
        category_name=service.category.name if service.category else None,
        distance_km=distance_km,
        rating_avg=rating_avg,
        review_count=review_count,
        is_featured=is_featured,
        featured_badge=featured_badge,
    )
