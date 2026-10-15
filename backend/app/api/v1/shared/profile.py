from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.auth import MeResponse
from app.schemas.user import ProfileOut, ProfileUpdate, UserOut

router = APIRouter(prefix="/auth", tags=["profile"])


def _user_out(user) -> UserOut:
    return UserOut.model_validate(user)


@router.get("/me", response_model=MeResponse)
async def me(user: CurrentUser) -> MeResponse:
    profile = ProfileOut.model_validate(user.profile) if user.profile else None
    return MeResponse(user=_user_out(user), profile=profile)


@router.get("/me/profile", response_model=ProfileOut)
async def get_profile(user: CurrentUser) -> ProfileOut:
    if user.profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return ProfileOut.model_validate(user.profile)


@router.patch("/me/profile", response_model=ProfileOut)
async def update_profile(body: ProfileUpdate, user: CurrentUser, db: DbSession) -> ProfileOut:
    if user.profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Profile not found")
    data = body.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(user.profile, key, value)
    await db.flush()
    return ProfileOut.model_validate(user.profile)
