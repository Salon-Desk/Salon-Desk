from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, OrgMember, OrgOwner
from app.core.security import hash_password
from app.models.enums import (
    UserRole,
    UserStatus,
)
from app.models.user import Profile, User
from app.schemas.common import MessageOut
from app.schemas.user import EmployeeCreate, UserOut

router = APIRouter(prefix="/organizations", tags=["org"])

# --- Employees ---


@router.get("/me/employees", response_model=list[UserOut])
async def list_employees(user: OrgMember, db: DbSession) -> list[UserOut]:
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(
            User.org_id == user.org_id,
            User.role.in_([UserRole.RECEPTION, UserRole.STYLIST, UserRole.ORG_OWNER]),
        )
        .order_by(User.created_at)
    )
    return [UserOut.model_validate(u) for u in result.scalars().all()]


@router.post(
    "/me/employees",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_employee(body: EmployeeCreate, user: OrgOwner, db: DbSession) -> UserOut:
    if body.role not in {UserRole.RECEPTION.value, UserRole.STYLIST.value}:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="role must be reception or stylist",
        )
    existing = await db.execute(select(User).where(User.email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Email already registered")

    employee = User(
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        role=UserRole(body.role),
        status=UserStatus.ACTIVE,
        org_id=user.org_id,
    )
    db.add(employee)
    await db.flush()
    db.add(
        Profile(
            user_id=employee.id,
            first_name=body.first_name,
            last_name=body.last_name,
            middle_name=body.middle_name,
            phone=body.phone,
        )
    )
    await db.flush()
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == employee.id)
    )
    return UserOut.model_validate(result.scalar_one())


@router.delete("/me/employees/{employee_id}", response_model=MessageOut)
async def remove_employee(employee_id: UUID, user: OrgOwner, db: DbSession) -> MessageOut:
    result = await db.execute(
        select(User).where(User.id == employee_id, User.org_id == user.org_id)
    )
    employee = result.scalar_one_or_none()
    if employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Employee not found")
    if employee.role == UserRole.ORG_OWNER:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Cannot remove organization owner")
    employee.status = UserStatus.INACTIVE
    await db.flush()
    return MessageOut(detail="Employee deactivated")
