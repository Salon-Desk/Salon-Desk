"""Organization portal and employee management service."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, NotFoundError, PolicyViolationException
from app.core.security import hash_password
from app.models.enums import UserRole, UserStatus
from app.models.organization import Organization
from app.models.service import OrgEmployeeCategory, ServiceCategory
from app.models.user import Profile, User
from app.schemas.user import EmployeeUpdate


async def get_org_for_member(db: AsyncSession, user: User) -> Organization:
    assert user.org_id is not None
    org = await db.get(Organization, user.org_id)
    if org is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return org


def build_employees_query(
    org_id: UUID,
    status_filter: str | None = None,
    role: str | None = None,
    q: str | None = None,
) -> Select:
    stmt = (
        select(User)
        .options(selectinload(User.profile), selectinload(User.employee_categories))
        .where(
            User.org_id == org_id,
            User.role.in_([UserRole.RECEPTION, UserRole.STYLIST, UserRole.ORG_OWNER]),
        )
    )
    if status_filter:
        try:
            target_status = UserStatus(status_filter.lower())
            stmt = stmt.where(User.status == target_status)
        except ValueError:
            pass

    if role:
        try:
            target_role = UserRole(role.lower())
            stmt = stmt.where(User.role == target_role)
        except ValueError:
            pass

    if q and q.strip():
        term = f"%{q.strip()}%"
        stmt = stmt.outerjoin(Profile, Profile.user_id == User.id).where(
            User.email.ilike(term)
            | Profile.first_name.ilike(term)
            | Profile.last_name.ilike(term)
            | Profile.phone.ilike(term)
        )

    return stmt.order_by(User.created_at)


async def get_employee_categories(
    db: AsyncSession,
    *,
    org_id: UUID,
    employee_id: UUID,
) -> list[ServiceCategory]:
    res = await db.execute(select(User).where(User.id == employee_id, User.org_id == org_id))
    if not res.scalar_one_or_none():
        raise NotFoundError("Employee not found")
    stmt = (
        select(ServiceCategory)
        .join(OrgEmployeeCategory, OrgEmployeeCategory.service_category_id == ServiceCategory.id)
        .where(OrgEmployeeCategory.user_id == employee_id)
        .order_by(ServiceCategory.name)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def set_employee_categories(
    db: AsyncSession,
    *,
    org_id: UUID,
    employee_id: UUID,
    category_ids: list[UUID],
) -> list[ServiceCategory]:
    res = await db.execute(select(User).where(User.id == employee_id, User.org_id == org_id))
    if not res.scalar_one_or_none():
        raise NotFoundError("Employee not found")

    if category_ids:
        cat_res = await db.execute(
            select(ServiceCategory.id).where(ServiceCategory.id.in_(category_ids))
        )
        existing_ids = set(cat_res.scalars().all())
        invalid = [cid for cid in category_ids if cid not in existing_ids]
        if invalid:
            raise NotFoundError(f"Category {invalid[0]} not found")

    await db.execute(delete(OrgEmployeeCategory).where(OrgEmployeeCategory.user_id == employee_id))
    for cat_id in set(category_ids):
        db.add(OrgEmployeeCategory(user_id=employee_id, service_category_id=cat_id))

    await db.flush()
    return await get_employee_categories(db, org_id=org_id, employee_id=employee_id)


async def create_employee(
    db: AsyncSession,
    *,
    org_id: UUID,
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    role: str,
    middle_name: str | None = None,
    phone: str | None = None,
    picture_url: str | None = None,
    handle: str | None = None,
    category_ids: list[UUID] | None = None,
) -> User:
    if role not in {UserRole.RECEPTION.value, UserRole.STYLIST.value}:
        raise PolicyViolationException("role must be reception or stylist")
    existing = await db.execute(select(User).where(User.email == email.lower()))
    if existing.scalar_one_or_none():
        raise ConflictError("Email already registered")

    cleaned_handle = handle.strip().lstrip("@").lower() if handle else None
    if cleaned_handle:
        stmt = select(Profile).where(Profile.handle == cleaned_handle)
        existing_handle = await db.execute(stmt)
        if existing_handle.scalar_one_or_none():
            raise ConflictError(f"Handle '@{cleaned_handle}' is already in use")

    employee = User(
        email=email.lower(),
        password_hash=hash_password(password),
        role=UserRole(role),
        status=UserStatus.ACTIVE,
        org_id=org_id,
    )
    db.add(employee)
    await db.flush()

    db.add(
        Profile(
            user_id=employee.id,
            first_name=first_name,
            last_name=last_name,
            middle_name=middle_name,
            phone=phone,
            picture=picture_url,
            handle=cleaned_handle,
        )
    )
    await db.flush()

    if category_ids:
        for cat_id in set(category_ids):
            db.add(OrgEmployeeCategory(user_id=employee.id, service_category_id=cat_id))
        await db.flush()

    result = await db.execute(
        select(User)
        .options(selectinload(User.profile), selectinload(User.employee_categories))
        .where(User.id == employee.id)
    )
    return result.scalar_one()


async def update_employee(
    db: AsyncSession,
    *,
    org_id: UUID,
    employee_id: UUID,
    body: EmployeeUpdate,
) -> User:
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile), selectinload(User.employee_categories))
        .where(User.id == employee_id, User.org_id == org_id)
    )
    employee = result.scalar_one_or_none()
    if employee is None:
        raise NotFoundError("Employee not found")

    if body.role is not None:
        if body.role not in {UserRole.RECEPTION.value, UserRole.STYLIST.value}:
            raise PolicyViolationException("role must be reception or stylist")
        if employee.role == UserRole.ORG_OWNER:
            raise PolicyViolationException("Cannot change role of organization owner")
        employee.role = UserRole(body.role)

    cleaned_handle = None
    if body.handle is not None:
        cleaned_handle = body.handle.strip().lstrip("@").lower() if body.handle else None
        if cleaned_handle:
            stmt = select(Profile).where(
                Profile.handle == cleaned_handle, Profile.user_id != employee.id
            )
            existing_handle = await db.execute(stmt)
            if existing_handle.scalar_one_or_none():
                raise ConflictError(f"Handle '@{cleaned_handle}' is already in use")

    if employee.profile is None:
        profile = Profile(
            user_id=employee.id,
            first_name=body.first_name or "",
            last_name=body.last_name or "",
            middle_name=body.middle_name,
            phone=body.phone,
            picture=body.picture,
            handle=cleaned_handle if body.handle is not None else None,
        )
        db.add(profile)
    else:
        if body.first_name is not None:
            employee.profile.first_name = body.first_name
        if body.last_name is not None:
            employee.profile.last_name = body.last_name
        if body.middle_name is not None:
            employee.profile.middle_name = body.middle_name
        if body.phone is not None:
            employee.profile.phone = body.phone
        if body.picture is not None:
            employee.profile.picture = body.picture
        if body.handle is not None:
            employee.profile.handle = cleaned_handle

    if body.category_ids is not None:
        await db.execute(
            delete(OrgEmployeeCategory).where(OrgEmployeeCategory.user_id == employee_id)
        )
        for cat_id in set(body.category_ids):
            db.add(OrgEmployeeCategory(user_id=employee_id, service_category_id=cat_id))

    await db.flush()
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile), selectinload(User.employee_categories))
        .where(User.id == employee.id)
    )
    return result.scalar_one()


async def deactivate_employee(
    db: AsyncSession,
    *,
    org_id: UUID,
    employee_id: UUID,
) -> None:
    result = await db.execute(select(User).where(User.id == employee_id, User.org_id == org_id))
    employee = result.scalar_one_or_none()
    if employee is None:
        raise NotFoundError("Employee not found")
    if employee.role == UserRole.ORG_OWNER:
        raise PolicyViolationException("Cannot remove organization owner")
    employee.status = UserStatus.INACTIVE
    await db.flush()


async def update_employee_avatar(
    db: AsyncSession,
    *,
    org_id: UUID,
    employee_id: UUID,
    picture_url: str,
) -> User:
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(User.id == employee_id, User.org_id == org_id)
    )
    employee = result.scalar_one_or_none()
    if employee is None:
        raise NotFoundError("Employee not found")

    if employee.profile is None:
        profile = Profile(
            user_id=employee.id,
            first_name="",
            last_name="",
            picture=picture_url,
        )
        db.add(profile)
    else:
        employee.profile.picture = picture_url

    await db.flush()
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == employee_id)
    )
    return result.scalar_one()
