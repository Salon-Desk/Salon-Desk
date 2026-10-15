from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, status

from app.api.deps.auth import CurrentUser
from app.models.enums import UserRole
from app.models.user import User


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
