from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import DbSession, PlatformAdmin
from app.models.enums import (
    OrganizationStatus,
)
from app.models.organization import Organization
from app.schemas.organization import (
    OrganizationOut,
)

router = APIRouter(prefix="/admin", tags=["platform"])


@router.get("/organizations", response_model=list[OrganizationOut])
async def list_organizations(
    user: PlatformAdmin,
    db: DbSession,
    status_filter: str | None = Query(default=None, alias="status"),
) -> list[OrganizationOut]:
    _ = user
    stmt = select(Organization).order_by(Organization.created_at.desc())
    if status_filter:
        try:
            stmt = stmt.where(Organization.status == OrganizationStatus(status_filter))
        except ValueError as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid status") from exc
    result = await db.execute(stmt)
    return [OrganizationOut.model_validate(o) for o in result.scalars().all()]


@router.get("/salons/pending", response_model=list[OrganizationOut])
async def list_pending_salons(user: PlatformAdmin, db: DbSession) -> list[OrganizationOut]:
    _ = user
    result = await db.execute(
        select(Organization)
        .where(Organization.status == OrganizationStatus.PENDING)
        .order_by(Organization.created_at)
    )
    return [OrganizationOut.model_validate(o) for o in result.scalars().all()]


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
