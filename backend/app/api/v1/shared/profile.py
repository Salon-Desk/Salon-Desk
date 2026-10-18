from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.auth import MeResponse
from app.schemas.user import ProfileOut, ProfileUpdate, UserOut
from app.services.storage_service import StorageUnavailableError, storage_service

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


@router.post("/me/avatar", response_model=ProfileOut)
@router.post("/me/profile/avatar", response_model=ProfileOut)
async def upload_avatar(
    file: UploadFile = File(...),
    user: CurrentUser = None,
    db: DbSession = None,
) -> ProfileOut:
    if user.profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Profile not found")
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Uploaded file must be an image")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Image exceeds 10MB limit")
    try:
        _key, url = await storage_service.async_upload_bytes(
            data=data,
            filename=file.filename or "avatar.jpg",
            content_type=file.content_type,
            folder="avatars",
        )
    except StorageUnavailableError as exc:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, detail="File storage is unavailable"
        ) from exc
    user.profile.picture = url
    await db.flush()
    return ProfileOut.model_validate(user.profile)
