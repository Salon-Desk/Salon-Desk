from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.core.config import get_settings
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    MeResponse,
    OrgOwnerSignUpRequest,
    OrgOwnerSignUpResponse,
    ResetPasswordRequest,
    SignInRequest,
    SignUpRequest,
    TokenResponse,
)
from app.schemas.common import MessageOut
from app.schemas.user import ProfileOut, ProfileUpdate, UserOut
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_out(user) -> UserOut:
    return UserOut.model_validate(user)


@router.post("/sign-up", response_model=TokenResponse)
async def sign_up(body: SignUpRequest, db: DbSession) -> TokenResponse:
    try:
        user = await auth_service.signup_client(db, body)
    except ForbiddenError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=exc.message) from exc
    token = auth_service.issue_token(user)
    return TokenResponse(access_token=token, user=_user_out(user))


@router.post("/sign-up/org-owner", response_model=OrgOwnerSignUpResponse)
async def sign_up_org_owner(body: OrgOwnerSignUpRequest, db: DbSession) -> OrgOwnerSignUpResponse:
    try:
        user, org = await auth_service.signup_org_owner(db, body)
    except ForbiddenError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=exc.message) from exc
    token = auth_service.issue_token(user)
    return OrgOwnerSignUpResponse(
        access_token=token,
        user=_user_out(user),
        organization_id=org.id,
    )


@router.post("/sign-in", response_model=TokenResponse)
async def sign_in(body: SignInRequest, db: DbSession) -> TokenResponse:
    try:
        user = await auth_service.authenticate(db, body.email, body.password)
    except UnauthorizedError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail=exc.message) from exc
    except ForbiddenError as exc:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail=exc.message) from exc
    token = auth_service.issue_token(user)
    return TokenResponse(access_token=token, user=_user_out(user))


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(body: ForgotPasswordRequest, db: DbSession) -> ForgotPasswordResponse:
    raw = await auth_service.create_password_reset_token(db, body.email)
    settings = get_settings()
    return ForgotPasswordResponse(
        detail="If the email exists, a reset link was sent",
        reset_token=raw if settings.debug else None,
    )


@router.post("/reset-password", response_model=MessageOut)
async def reset_password(body: ResetPasswordRequest, db: DbSession) -> MessageOut:
    try:
        await auth_service.reset_password(db, body.token, body.new_password)
    except ForbiddenError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=exc.message) from exc
    return MessageOut(detail="Password updated")


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


@router.post("/demo", response_model=TokenResponse)
async def judge_demo_auth(db: DbSession) -> TokenResponse:
    user = await auth_service.ensure_demo_user(db)
    token = auth_service.issue_token(user)
    return TokenResponse(access_token=token, user=_user_out(user))
