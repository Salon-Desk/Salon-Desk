from datetime import date
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import ClientUser, CurrentUser, DbSession
from app.core.exceptions import ForbiddenError, NotFoundError, PolicyViolationException
from app.core.pagination import paginate_items
from app.models.enums import UserRole
from app.schemas.booking import (
    AvailabilityOut,
    BookingCancelRequest,
    BookingCreate,
    BookingOut,
    BookingRescheduleRequest,
    ConsentCreate,
    ConsentOut,
    booking_to_out,
)
from app.schemas.common import PageOut
from app.services import booking_service
from app.services.payment_service import create_consent

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
@router.post(
    "/", response_model=BookingOut, status_code=status.HTTP_201_CREATED, include_in_schema=False
)
async def create_booking(body: BookingCreate, user: ClientUser, db: DbSession) -> BookingOut:
    """Accept both `/bookings` and `/bookings/` — trailing-slash redirects drop some clients."""
    try:
        booking = await booking_service.create_booking(
            db,
            client_id=user.id,
            org_id=body.org_id,
            service_ids=body.service_ids,
            service_stylists=body.service_stylists,
            starts_at=body.starts_at,
            stylist_id=body.stylist_id,
            customer_notes=body.customer_notes,
            party_size=body.party_size,
        )
    except (ForbiddenError, NotFoundError) as exc:
        # Slot conflicts are client errors, not auth failures.
        if isinstance(exc, ForbiddenError) and "not available" in exc.message.lower():
            raise HTTPException(status.HTTP_409_CONFLICT, detail=exc.message) from exc
        code = (
            status.HTTP_403_FORBIDDEN
            if isinstance(exc, ForbiddenError)
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(code, detail=exc.message) from exc
    return booking_to_out(booking)


@router.get("/me", response_model=PageOut[BookingOut])
async def my_bookings(
    user: ClientUser,
    db: DbSession,
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    status: str | None = Query(default=None, description="Filter by status"),
    q: str | None = Query(
        default=None, description="Search query (service name, salon name, stylist name)"
    ),
    sort: str = Query(
        default="starts_at_desc",
        description="Sort order: starts_at_asc, starts_at_desc, created_at_asc, created_at_desc, total_price_asc, total_price_desc",
    ),
) -> PageOut[BookingOut]:
    rows = await booking_service.list_client_bookings(db, user.id, sort=sort)
    items = [booking_to_out(b) for b in rows]

    # Filter by status
    if status:
        sf = status.upper()
        items = [b for b in items if b.status.upper() == sf]

    # Filter by search query
    if q:
        query_lower = q.lower()
        items = [
            b
            for b in items
            if (b.service_name and query_lower in b.service_name.lower())
            or (b.organization_name and query_lower in b.organization_name.lower())
            or (b.stylist_name and query_lower in b.stylist_name.lower())
        ]

    return paginate_items(items, page=page, page_size=page_size)


@router.get("/availability", response_model=AvailabilityOut)
async def availability(
    db: DbSession,
    service_id: UUID,
    day: date = Query(..., description="Calendar day in the salon's timezone (YYYY-MM-DD)"),
    slot_minutes: int = Query(default=30, ge=5, le=120),
    stylist_id: UUID | None = Query(default=None, description="Optional stylist filter"),
    duration_minutes: int | None = Query(
        default=None,
        ge=5,
        le=600,
        description="Optional total duration in minutes for multiple selected services",
    ),
) -> AvailabilityOut:
    try:
        return await booking_service.get_availability(
            db,
            service_id=service_id,
            day=day,
            slot_minutes=slot_minutes,
            stylist_id=stylist_id,
            duration_minutes=duration_minutes,
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
    return booking_to_out(booking)


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
    return booking_to_out(booking)


@router.post("/{booking_id}/reschedule", response_model=BookingOut)
@router.patch("/{booking_id}/reschedule", response_model=BookingOut)
async def reschedule_booking(
    booking_id: UUID,
    body: BookingRescheduleRequest,
    user: CurrentUser,
    db: DbSession,
) -> BookingOut:
    """Reschedule an existing booking (new starts_at, ends_at, and/or stylist_id)."""
    try:
        booking = await booking_service.get_booking(db, booking_id)
        is_org = user.org_id == booking.org_id and user.role in {
            UserRole.ORG_OWNER,
            UserRole.RECEPTION,
            UserRole.PLATFORM_ADMIN,
            UserRole.PLATFORM_STAFF,
        }
        rescheduled = await booking_service.reschedule_booking(
            db,
            booking=booking,
            actor_id=user.id,
            starts_at=body.starts_at,
            ends_at=body.ends_at,
            stylist_id=body.stylist_id,
            is_org=is_org,
        )
    except (ForbiddenError, NotFoundError, PolicyViolationException) as exc:
        code = (
            status.HTTP_409_CONFLICT
            if isinstance(exc, ForbiddenError) and "not available" in exc.message.lower()
            else (
                status.HTTP_403_FORBIDDEN
                if isinstance(exc, ForbiddenError)
                else (
                    status.HTTP_404_NOT_FOUND
                    if isinstance(exc, NotFoundError)
                    else status.HTTP_400_BAD_REQUEST
                )
            )
        )
        raise HTTPException(code, detail=exc.message) from exc
    return booking_to_out(rescheduled)
