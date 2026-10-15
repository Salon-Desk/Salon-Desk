"""Organization portal helpers."""

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.models.user import User


async def get_org_for_member(db: AsyncSession, user: User) -> Organization:
    assert user.org_id is not None
    org = await db.get(Organization, user.org_id)
    if org is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return org
