from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.enums import UserRole, UserStatus
from app.models.user import User

security_scheme = HTTPBearer(auto_error=False)

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)],
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = UUID(str(payload["sub"]))
    except (ValueError, KeyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        ) from exc

    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active",
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: UserRole | str) -> Callable[..., User]:
    allowed = {r.value if isinstance(r, UserRole) else r for r in roles}

    async def _checker(user: CurrentUser) -> User:
        if user.role.value not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return _checker


async def require_org_member(user: CurrentUser) -> User:
    org_roles = {
        UserRole.ORG_OWNER.value,
        UserRole.RECEPTION.value,
        UserRole.STYLIST.value,
    }
    if user.role.value not in org_roles or user.org_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization membership required",
        )
    return user


OrgMember = Annotated[User, Depends(require_org_member)]

PlatformAdmin = Annotated[
    User,
    Depends(require_roles(UserRole.PLATFORM_ADMIN, UserRole.PLATFORM_STAFF)),
]

PlatformAdminOnly = Annotated[
    User,
    Depends(require_roles(UserRole.PLATFORM_ADMIN)),
]

ClientUser = Annotated[User, Depends(require_roles(UserRole.CLIENT))]

OrgOwner = Annotated[User, Depends(require_roles(UserRole.ORG_OWNER))]
