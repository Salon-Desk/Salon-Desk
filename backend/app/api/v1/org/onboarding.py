"""Organization owner signup and initial org setup."""

from fastapi import APIRouter, HTTPException, status

from app.api.deps import DbSession
from app.core.exceptions import ForbiddenError
from app.schemas.auth import OrgOwnerSignUpRequest, OrgOwnerSignUpResponse
from app.schemas.user import UserOut
from app.services import auth_service

router = APIRouter(prefix="/organizations", tags=["org-onboarding"])


def _user_out(user) -> UserOut:
    return UserOut.model_validate(user)


@router.post("/sign-up", response_model=OrgOwnerSignUpResponse, status_code=status.HTTP_201_CREATED)
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
