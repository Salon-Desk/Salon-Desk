from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DbSession, OrgMember, OrgOwner
from app.core.exceptions import ForbiddenError
from app.models.payment import OrgAccount
from app.models.policy import OrgCancellationPolicy
from app.schemas.organization import (
    CancellationPolicyOut,
    ChangeRequestCreate,
    ChangeRequestOut,
    OrgAccountOut,
)
from app.services import change_request_service

router = APIRouter(prefix="/organizations", tags=["org"])

# --- Policies / account / change requests ---


@router.get("/me/cancellation-policies", response_model=list[CancellationPolicyOut])
async def list_policies(user: OrgMember, db: DbSession) -> list[CancellationPolicyOut]:
    result = await db.execute(
        select(OrgCancellationPolicy)
        .where(OrgCancellationPolicy.org_id == user.org_id)
        .order_by(OrgCancellationPolicy.created_at.desc())
    )
    return [CancellationPolicyOut.model_validate(p) for p in result.scalars().all()]


@router.get("/me/account", response_model=OrgAccountOut | None)
async def get_account(user: OrgMember, db: DbSession) -> OrgAccountOut | None:
    result = await db.execute(
        select(OrgAccount)
        .where(OrgAccount.org_id == user.org_id)
        .order_by(OrgAccount.created_at.desc())
        .limit(1)
    )
    account = result.scalar_one_or_none()
    return OrgAccountOut.model_validate(account) if account else None


@router.get("/me/change-requests", response_model=list[ChangeRequestOut])
async def list_change_requests(user: OrgMember, db: DbSession) -> list[ChangeRequestOut]:
    assert user.org_id is not None
    rows = await change_request_service.list_org_change_requests(db, user.org_id)
    return [ChangeRequestOut.model_validate(r) for r in rows]


@router.post(
    "/me/change-requests",
    response_model=ChangeRequestOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_change_request(
    body: ChangeRequestCreate, user: OrgOwner, db: DbSession
) -> ChangeRequestOut:
    assert user.org_id is not None
    try:
        row = await change_request_service.submit_change_request(
            db,
            org_id=user.org_id,
            submitted_by=user.id,
            request_type=body.request_type,
            payload_json=body.payload_json,
            current_snapshot_json=body.current_snapshot_json,
        )
    except ForbiddenError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=exc.message) from exc
    return ChangeRequestOut.model_validate(row)
