from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import DbSession, PlatformAdmin
from app.core.pagination import paginate_query
from app.models.enums import (
    OrganizationStatus,
)
from app.models.organization import Organization
from app.schemas.common import PageOut
from app.schemas.organization import (
    OrganizationOut,
)

router = APIRouter(prefix="/admin", tags=["platform"])


@router.get("/organizations", response_model=PageOut[OrganizationOut])
async def list_organizations(
    user: PlatformAdmin,
    db: DbSession,
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    q: str | None = Query(default=None, description="Search query"),
    status_filter: str | None = Query(default=None, alias="status"),
) -> PageOut[OrganizationOut]:
    _ = user
    stmt = select(Organization)
    if status_filter:
        try:
            stmt = stmt.where(Organization.status == OrganizationStatus(status_filter))
        except ValueError as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid status") from exc
    if q and q.strip():
        term = f"%{q.strip()}%"
        stmt = stmt.where(Organization.name.ilike(term) | Organization.description.ilike(term))
    stmt = stmt.order_by(Organization.created_at.desc())
    return await paginate_query(db, stmt, page=page, page_size=page_size, schema=OrganizationOut)


@router.get("/salons/pending", response_model=PageOut[OrganizationOut])
async def list_pending_salons(
    user: PlatformAdmin,
    db: DbSession,
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    q: str | None = Query(default=None, description="Search query"),
) -> PageOut[OrganizationOut]:
    _ = user
    stmt = select(Organization).where(Organization.status == OrganizationStatus.PENDING)
    if q and q.strip():
        term = f"%{q.strip()}%"
        stmt = stmt.where(Organization.name.ilike(term) | Organization.description.ilike(term))
    stmt = stmt.order_by(Organization.created_at)
    return await paginate_query(db, stmt, page=page, page_size=page_size, schema=OrganizationOut)


@router.post("/organizations/{org_id}/approve", response_model=OrganizationOut)
async def approve_organization(org_id: UUID, user: PlatformAdmin, db: DbSession) -> OrganizationOut:
    _ = user
    org = await db.get(Organization, org_id)
    if org is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Organization not found")
    org.status = OrganizationStatus.APPROVED
    await db.flush()
    return OrganizationOut.model_validate(org)


@router.post("/organizations/{org_id}/suspend", response_model=OrganizationOut)
async def suspend_organization(org_id: UUID, user: PlatformAdmin, db: DbSession) -> OrganizationOut:
    _ = user
    org = await db.get(Organization, org_id)
    if org is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Organization not found")
    org.status = OrganizationStatus.SUSPENDED
    await db.flush()
    return OrganizationOut.model_validate(org)
