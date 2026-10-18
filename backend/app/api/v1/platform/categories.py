from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import DbSession, PlatformAdmin
from app.core.pagination import paginate_query
from app.models.service import ServiceCategory
from app.schemas.common import PageOut
from app.schemas.service import (
    ServiceCategoryCreate,
    ServiceCategoryOut,
    ServiceCategoryUpdate,
)

router = APIRouter(prefix="/admin", tags=["platform"])

# --- Service categories ---


@router.get("/service-categories", response_model=PageOut[ServiceCategoryOut])
async def list_categories(
    user: PlatformAdmin,
    db: DbSession,
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    q: str | None = Query(default=None, description="Search query"),
) -> PageOut[ServiceCategoryOut]:
    _ = user
    stmt = select(ServiceCategory)
    if q and q.strip():
        term = f"%{q.strip()}%"
        stmt = stmt.where(
            ServiceCategory.name.ilike(term) | ServiceCategory.description.ilike(term)
        )
    stmt = stmt.order_by(ServiceCategory.name)
    return await paginate_query(db, stmt, page=page, page_size=page_size, schema=ServiceCategoryOut)


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
