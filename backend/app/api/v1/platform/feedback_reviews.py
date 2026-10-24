from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import DbSession, PlatformAdmin
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.pagination import paginate_items
from app.models.booking import BookingService
from app.models.enums import FeedbackModerationStatus
from app.schemas.common import PageOut
from app.schemas.feedback import ClientFeedbackModerationReview, ClientFeedbackOut
from app.services import feedback_service

router = APIRouter(prefix="/admin", tags=["platform"])


def _service_name(feedback) -> str | None:
    booking = getattr(feedback, "booking", None)
    if booking is None:
        return None
    services = getattr(booking, "booking_services", None) or []
    if not services:
        return None
    first: BookingService = services[0]
    service = getattr(first, "service", None)
    return service.name if service is not None else None


@router.get("/client-feedback", response_model=PageOut[ClientFeedbackOut])
async def list_client_feedback_for_moderation(
    user: PlatformAdmin,
    db: DbSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status_filter: str | None = Query(default="pending", alias="status"),
) -> PageOut[ClientFeedbackOut]:
    _ = user
    status_enum: FeedbackModerationStatus | None = None
    if status_filter and status_filter.lower() != "all":
        try:
            status_enum = FeedbackModerationStatus(status_filter.lower())
        except ValueError as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid status") from exc

    rows = await feedback_service.list_admin_feedback(db, status=status_enum)
    items = [
        ClientFeedbackOut.model_validate(
            feedback_service.feedback_to_out(
                row,
                service_name=_service_name(row),
                include_moderation=True,
            )
        )
        for row in rows
    ]
    return paginate_items(items, page=page, page_size=page_size)


@router.post("/client-feedback/{feedback_id}/approve", response_model=ClientFeedbackOut)
async def approve_client_feedback(
    feedback_id: UUID,
    body: ClientFeedbackModerationReview,
    user: PlatformAdmin,
    db: DbSession,
) -> ClientFeedbackOut:
    try:
        row = await feedback_service.moderate_feedback(
            db,
            feedback_id=feedback_id,
            moderator_id=user.id,
            approve=True,
            notes=body.moderation_notes,
        )
    except (ForbiddenError, NotFoundError) as exc:
        code = (
            status.HTTP_403_FORBIDDEN
            if isinstance(exc, ForbiddenError)
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(code, detail=exc.message) from exc
    return ClientFeedbackOut.model_validate(
        feedback_service.feedback_to_out(row, include_moderation=True)
    )


@router.post("/client-feedback/{feedback_id}/reject", response_model=ClientFeedbackOut)
async def reject_client_feedback(
    feedback_id: UUID,
    body: ClientFeedbackModerationReview,
    user: PlatformAdmin,
    db: DbSession,
) -> ClientFeedbackOut:
    try:
        row = await feedback_service.moderate_feedback(
            db,
            feedback_id=feedback_id,
            moderator_id=user.id,
            approve=False,
            notes=body.moderation_notes,
        )
    except (ForbiddenError, NotFoundError) as exc:
        code = (
            status.HTTP_403_FORBIDDEN
            if isinstance(exc, ForbiddenError)
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(code, detail=exc.message) from exc
    return ClientFeedbackOut.model_validate(
        feedback_service.feedback_to_out(row, include_moderation=True)
    )
