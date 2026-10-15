from datetime import date
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import ClientUser, CurrentUser, DbSession
from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.enums import UserRole
from app.schemas.booking import (
    BookingCancelRequest,
    BookingCreate,
    BookingOut,
    ConsentCreate,
    ConsentOut,
    TimeSlot,
)
from app.services import booking_service
from app.services.payment_service import create_consent

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("/", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
async def create_booking(body: BookingCreate, user: ClientUser, db: DbSession) -> BookingOut:
    try:
        booking = await booking_service.create_booking(
            db,
            client_id=user.id,
            org_id=body.org_id,
            service_ids=body.service_ids,
            starts_at=body.starts_at,
            stylist_id=body.stylist_id,
            customer_notes=body.customer_notes,
        )
    except (ForbiddenError, NotFoundError) as exc:
        code = (
            status.HTTP_403_FORBIDDEN
            if isinstance(exc, ForbiddenError)
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(code, detail=exc.message) from exc
    return BookingOut.model_validate(booking)


@router.get("/me", response_model=list[BookingOut])
async def my_bookings(user: ClientUser, db: DbSession) -> list[BookingOut]:
    rows = await booking_service.list_client_bookings(db, user.id)
    return [BookingOut.model_validate(b) for b in rows]


@router.get("/availability", response_model=list[TimeSlot])
async def availability(
    db: DbSession,
    service_id: UUID,
    day: date = Query(...),
    slot_minutes: int = Query(default=30, ge=5, le=120),
) -> list[TimeSlot]:
    try:
        return await booking_service.get_availability(
            db, service_id=service_id, day=day, slot_minutes=slot_minutes
        )
    except NotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=exc.message) from exc


@router.get("/{booking_id}", response_model=BookingOut)
async def get_booking(booking_id: UUID, user: CurrentUser, db: DbSession) -> BookingOut:
    try:
        booking = await booking_service.get_booking(db, booking_id)
    except NotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=exc.message) from exc

    is_client = booking.client_id == user.id
    is_org = user.org_id == booking.org_id and user.role in {
        UserRole.ORG_OWNER,
        UserRole.RECEPTION,
        UserRole.STYLIST,
    }
    is_platform = user.role in {
        UserRole.PLATFORM_ADMIN,
        UserRole.PLATFORM_STAFF,
    }
    if not (is_client or is_org or is_platform):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return BookingOut.model_validate(booking)


@router.post("/{booking_id}/consent", response_model=ConsentOut)
async def consent_booking(
    booking_id: UUID,
    body: ConsentCreate,
    user: ClientUser,
    db: DbSession,
) -> ConsentOut:
    try:
        booking = await booking_service.get_booking(db, booking_id)
        consent = await create_consent(
            db,
            booking=booking,
            client_id=user.id,
            terms_version=body.terms_version,
            terms_text=body.terms_text,
            signed_payload=body.signed_payload,
        )
    except (ForbiddenError, NotFoundError) as exc:
        code = (
            status.HTTP_403_FORBIDDEN
            if isinstance(exc, ForbiddenError)
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(code, detail=exc.message) from exc
    return ConsentOut.model_validate(consent)


@router.post("/{booking_id}/cancel", response_model=BookingOut)
async def cancel_booking(
    booking_id: UUID,
    body: BookingCancelRequest,
    user: CurrentUser,
    db: DbSession,
) -> BookingOut:
    try:
        booking = await booking_service.get_booking(db, booking_id)
        is_org = user.org_id == booking.org_id and user.role in {
            UserRole.ORG_OWNER,
            UserRole.RECEPTION,
        }
        booking = await booking_service.cancel_booking(
            db,
            booking=booking,
            reason=body.reason,
            actor_id=user.id,
            is_org=is_org,
        )
    except (ForbiddenError, NotFoundError) as exc:
        code = (
            status.HTTP_403_FORBIDDEN
            if isinstance(exc, ForbiddenError)
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(code, detail=exc.message) from exc
    return BookingOut.model_validate(booking)
