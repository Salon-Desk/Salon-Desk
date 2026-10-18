from datetime import datetime

from fastapi import APIRouter, Query

from app.api.deps import DbSession, OrgMember
from app.core.pagination import paginate_items
from app.schemas.booking import BookingOut, booking_to_out
from app.schemas.common import PageOut
from app.services import booking_service

router = APIRouter(prefix="/organizations", tags=["org-bookings"])


@router.get("/me/bookings", response_model=PageOut[BookingOut])
async def org_bookings(
    user: OrgMember,
    db: DbSession,
    starts_at: datetime | None = None,
    ends_at: datetime | None = None,
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    q: str | None = Query(default=None, description="Search query"),
    status: str | None = Query(default=None, description="Filter by status"),
) -> PageOut[BookingOut]:
    assert user.org_id is not None
    rows = await booking_service.list_org_bookings(
        db, user.org_id, starts_at=starts_at, ends_at=ends_at
    )
    items = [booking_to_out(b) for b in rows]
    if status:
        sf = status.upper()
        items = [b for b in items if b.status.upper() == sf]
    if q and q.strip():
        term = q.strip().lower()
        items = [
            b
            for b in items
            if term in str(b.id).lower()
            or (b.client_name and term in b.client_name.lower())
            or (b.client_email and term in b.client_email.lower())
            or (b.stylist_name and term in b.stylist_name.lower())
            or (b.service_name and term in b.service_name.lower())
        ]
    return paginate_items(items, page=page, page_size=page_size)
