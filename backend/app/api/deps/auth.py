from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps.database import DbSession
from app.core.security import decode_access_token
from app.models.enums import UserStatus
from app.models.user import User

security_scheme = HTTPBearer(auto_error=False)


def _extract_raw_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None,
) -> str | None:
    """Extract bearer token from Authorization header, query parameter, or cookie."""
    if credentials and credentials.credentials:
        return credentials.credentials
    # Query parameter for file downloads, iframes, and new-tab views
    token_param = request.query_params.get("token")
    if token_param:
        return token_param
    # Cookie
    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        return cookie_token
    return None


async def get_current_user(
    request: Request,
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)],
) -> User:
    raw_token = _extract_raw_token(request, credentials)
    if raw_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        payload = decode_access_token(raw_token)
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


async def get_optional_current_user(
    request: Request,
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)],
) -> User | None:
    raw_token = _extract_raw_token(request, credentials)
    if raw_token is None:
        return None
    try:
        payload = decode_access_token(raw_token)
        user_id = UUID(str(payload["sub"]))
    except (ValueError, KeyError):
        return None

    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None or user.status != UserStatus.ACTIVE:
        return None
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_current_user)]
