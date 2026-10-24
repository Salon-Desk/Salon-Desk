from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, PlatformAdminOnly
from app.core.security import hash_password
from app.models.enums import (
    UserRole,
    UserStatus,
)
from app.models.user import Profile, User
from app.schemas.common import MessageOut
from app.schemas.user import StaffCreate, UserOut

router = APIRouter(prefix="/admin", tags=["platform"])

# --- Platform staff ---


@router.get("/staff", response_model=list[UserOut])
async def list_staff(
    user: PlatformAdminOnly,
    db: DbSession,
    role: str | None = Query(default=None, description="Filter by staff role"),
    q: str | None = Query(default=None, description="Search staff by name or email"),
) -> list[UserOut]:
    _ = user
    stmt = (
        select(User)
        .options(selectinload(User.profile))
        .where(User.role.in_([UserRole.PLATFORM_ADMIN, UserRole.PLATFORM_STAFF]))
    )
    if role and role != "all":
        try:
            target_role = UserRole(role)
            stmt = stmt.where(User.role == target_role)
        except ValueError:
            pass
    if q and q.strip():
        search_pattern = f"%{q.strip()}%"
        stmt = stmt.outerjoin(User.profile).where(
            or_(
                User.email.ilike(search_pattern),
                Profile.first_name.ilike(search_pattern),
                Profile.last_name.ilike(search_pattern),
            )
        )
    stmt = stmt.order_by(User.created_at.desc())
    result = await db.execute(stmt)
    return [UserOut.model_validate(u) for u in result.scalars().all()]


@router.post("/staff", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register_staff(body: StaffCreate, user: PlatformAdminOnly, db: DbSession) -> UserOut:
    _ = user
    existing = await db.execute(select(User).where(User.email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Email already registered")
    staff = User(
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        role=UserRole.PLATFORM_STAFF,
        status=UserStatus.ACTIVE,
    )
    db.add(staff)
    await db.flush()
    db.add(
        Profile(
            user_id=staff.id,
            first_name=body.first_name,
            last_name=body.last_name,
            middle_name=body.middle_name,
            phone=body.phone,
        )
    )
    await db.flush()
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == staff.id)
    )
    return UserOut.model_validate(result.scalar_one())


@router.delete("/staff/{staff_id}", response_model=MessageOut)
async def remove_staff(staff_id: UUID, user: PlatformAdminOnly, db: DbSession) -> MessageOut:
    _ = user
    staff = await db.get(User, staff_id)
    if staff is None or staff.role != UserRole.PLATFORM_STAFF:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Staff not found")
    staff.status = UserStatus.INACTIVE
    await db.flush()
    return MessageOut(detail="Platform staff deactivated")
