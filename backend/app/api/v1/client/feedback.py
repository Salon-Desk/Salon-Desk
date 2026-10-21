from fastapi import APIRouter, HTTPException, status

from app.api.deps import ClientUser, DbSession
from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.booking import BookingService
from app.schemas.feedback import ClientFeedbackOut, CreateClientFeedbackRequest
from app.services import feedback_service

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.get("/me", response_model=list[ClientFeedbackOut])
async def list_my_feedback(user: ClientUser, db: DbSession) -> list[ClientFeedbackOut]:
    rows = await feedback_service.list_client_feedback(db, client_id=user.id)
    return [
        ClientFeedbackOut.model_validate(
            feedback_service.feedback_to_out(
                row,
                organization_name=row.organization.name if row.organization else None,
            )
        )
        for row in rows
    ]


def _service_name_from_booking(feedback) -> str | None:
    booking = getattr(feedback, "booking", None)
    if booking is None:
        return None
    services = getattr(booking, "booking_services", None) or []
    if not services:
        return None
    first: BookingService = services[0]
    service = getattr(first, "service", None)
    if service is not None and getattr(service, "name", None):
        return service.name
    return None


@router.post("", response_model=ClientFeedbackOut, status_code=status.HTTP_201_CREATED)
async def submit_client_feedback(
    body: CreateClientFeedbackRequest,
    user: ClientUser,
    db: DbSession,
) -> ClientFeedbackOut:
    try:
        feedback = await feedback_service.create_client_feedback(
            db,
            client_id=user.id,
            booking_id=body.booking_id,
            rating=body.rating,
            comment=body.comment,
            stylist_id=body.stylist_id,
        )
    except (ForbiddenError, NotFoundError) as exc:
        code = (
            status.HTTP_403_FORBIDDEN
            if isinstance(exc, ForbiddenError)
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(code, detail=exc.message) from exc

    return ClientFeedbackOut.model_validate(
        feedback_service.feedback_to_out(
            feedback,
            service_name=_service_name_from_booking(feedback),
        )
    )
