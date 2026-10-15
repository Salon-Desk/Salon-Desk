"""FastAPI dependency injection and RBAC guards."""

from app.api.deps.auth import CurrentUser, get_current_user
from app.api.deps.database import DbSession
from app.api.deps.permissions import (
    ClientUser,
    OrgMember,
    OrgOwner,
    PlatformAdmin,
    PlatformAdminOnly,
    require_org_member,
    require_roles,
)

__all__ = [
    "DbSession",
    "get_current_user",
    "CurrentUser",
    "require_roles",
    "require_org_member",
    "OrgMember",
    "PlatformAdmin",
    "PlatformAdminOnly",
    "ClientUser",
    "OrgOwner",
]
