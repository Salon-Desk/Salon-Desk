from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import DbSession, PlatformAdmin
from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.enums import (
    ChangeRequestStatus,
)
from app.schemas.organization import (
    ChangeRequestOut,
    ChangeRequestReview,
)
from app.services import change_request_service

router = APIRouter(prefix="/admin", tags=["platform"])

# --- Change requests ---


@router.get("/change-requests", response_model=list[ChangeRequestOut])
async def list_change_requests(
    user: PlatformAdmin,
    db: DbSession,
    status_filter: str | None = Query(default="PENDING", alias="status"),
) -> list[ChangeRequestOut]:
    _ = user
    status_enum: ChangeRequestStatus | None = None
    if status_filter:
        try:
            status_enum = ChangeRequestStatus(status_filter)
        except ValueError as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid status") from exc
    rows = await change_request_service.list_admin_change_requests(db, status_enum)
    return [ChangeRequestOut.model_validate(r) for r in rows]


@router.post("/change-requests/{request_id}/approve", response_model=ChangeRequestOut)
async def approve_change_request(
    request_id: UUID,
    body: ChangeRequestReview,
    user: PlatformAdmin,
    db: DbSession,
) -> ChangeRequestOut:
    try:
        row = await change_request_service.review_change_request(
            db,
            request_id=request_id,
            reviewer_id=user.id,
            approve=True,
            review_notes=body.review_notes,
        )
    except (ForbiddenError, NotFoundError) as exc:
        code = (
            status.HTTP_403_FORBIDDEN
            if isinstance(exc, ForbiddenError)
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(code, detail=exc.message) from exc
    return ChangeRequestOut.model_validate(row)


@router.post("/change-requests/{request_id}/reject", response_model=ChangeRequestOut)
async def reject_change_request(
    request_id: UUID,
    body: ChangeRequestReview,
    user: PlatformAdmin,
    db: DbSession,
) -> ChangeRequestOut:
    try:
        row = await change_request_service.review_change_request(
            db,
            request_id=request_id,
            reviewer_id=user.id,
            approve=False,
            review_notes=body.review_notes,
        )
    except (ForbiddenError, NotFoundError) as exc:
        code = (
            status.HTTP_403_FORBIDDEN
            if isinstance(exc, ForbiddenError)
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(code, detail=exc.message) from exc
    return ChangeRequestOut.model_validate(row)
