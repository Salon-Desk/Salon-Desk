from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DbSession, PlatformAdmin
from app.models.service import ServiceCategory
from app.schemas.service import (
    ServiceCategoryCreate,
    ServiceCategoryOut,
    ServiceCategoryUpdate,
)

router = APIRouter(prefix="/admin", tags=["platform"])

# --- Service categories ---


@router.get("/service-categories", response_model=list[ServiceCategoryOut])
async def list_categories(user: PlatformAdmin, db: DbSession) -> list[ServiceCategoryOut]:
    _ = user
    result = await db.execute(select(ServiceCategory).order_by(ServiceCategory.name))
    return [ServiceCategoryOut.model_validate(c) for c in result.scalars().all()]


@router.post(
    "/service-categories",
    response_model=ServiceCategoryOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_category(
    body: ServiceCategoryCreate, user: PlatformAdmin, db: DbSession
) -> ServiceCategoryOut:
    _ = user
    cat = ServiceCategory(name=body.name, description=body.description)
    db.add(cat)
    await db.flush()
    return ServiceCategoryOut.model_validate(cat)


@router.patch("/service-categories/{category_id}", response_model=ServiceCategoryOut)
async def update_category(
    category_id: UUID,
    body: ServiceCategoryUpdate,
    user: PlatformAdmin,
    db: DbSession,
) -> ServiceCategoryOut:
    _ = user
    cat = await db.get(ServiceCategory, category_id)
    if cat is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Category not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(cat, key, value)
    await db.flush()
    return ServiceCategoryOut.model_validate(cat)
