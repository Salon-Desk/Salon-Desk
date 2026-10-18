from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import DbSession, PlatformAdmin
from app.core.pagination import paginate_query
from app.models.ledger import PlatformCommission
from app.schemas.common import PageOut
from app.schemas.platform import (
    PlatformCommissionCreate,
    PlatformCommissionOut,
    PlatformCommissionUpdate,
)

router = APIRouter(prefix="/admin", tags=["platform"])

# --- Commissions ---


@router.get("/commissions", response_model=PageOut[PlatformCommissionOut])
async def list_commissions(
    user: PlatformAdmin,
    db: DbSession,
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    q: str | None = Query(default=None, description="Search query"),
) -> PageOut[PlatformCommissionOut]:
    _ = user
    stmt = select(PlatformCommission)
    if q and q.strip():
        term = f"%{q.strip()}%"
        stmt = stmt.where(PlatformCommission.name.ilike(term))
    stmt = stmt.order_by(PlatformCommission.created_at.desc())
    return await paginate_query(
        db, stmt, page=page, page_size=page_size, schema=PlatformCommissionOut
    )


@router.post(
    "/commissions",
    response_model=PlatformCommissionOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_commission(
    body: PlatformCommissionCreate, user: PlatformAdmin, db: DbSession
) -> PlatformCommissionOut:
    _ = user
    from app.models.enums import PlatformCommissionType

    try:
        ctype = PlatformCommissionType(body.type)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid type") from exc
    row = PlatformCommission(
        service_category_id=body.service_category_id,
        name=body.name,
        type=ctype,
        percentage=body.percentage,
        flat=body.flat,
    )
    db.add(row)
    await db.flush()
    return PlatformCommissionOut.model_validate(row)


@router.patch("/commissions/{commission_id}", response_model=PlatformCommissionOut)
async def update_commission(
    commission_id: UUID,
    body: PlatformCommissionUpdate,
    user: PlatformAdmin,
    db: DbSession,
) -> PlatformCommissionOut:
    _ = user
    from app.models.enums import PlatformCommissionType

    row = await db.get(PlatformCommission, commission_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Commission not found")
    data = body.model_dump(exclude_unset=True)
    if "type" in data and data["type"] is not None:
        try:
            data["type"] = PlatformCommissionType(data["type"])
        except ValueError as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid type") from exc
    for key, value in data.items():
        setattr(row, key, value)
    await db.flush()
    return PlatformCommissionOut.model_validate(row)
