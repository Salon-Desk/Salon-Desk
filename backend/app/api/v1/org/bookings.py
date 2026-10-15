from datetime import datetime

from fastapi import APIRouter

from app.api.deps import DbSession, OrgMember
from app.schemas.booking import BookingOut
from app.services import booking_service

router = APIRouter(prefix="/organizations", tags=["org-bookings"])


@router.get("/me/bookings", response_model=list[BookingOut])
async def org_bookings(
    user: OrgMember,
    db: DbSession,
    starts_at: datetime | None = None,
    ends_at: datetime | None = None,
) -> list[BookingOut]:
    assert user.org_id is not None
    rows = await booking_service.list_org_bookings(
        db, user.org_id, starts_at=starts_at, ends_at=ends_at
    )
    return [BookingOut.model_validate(b) for b in rows]
