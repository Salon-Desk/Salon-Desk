import secrets
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.crypto import sha256_hex
from app.core.exceptions import ForbiddenError, NotFoundError, UnauthorizedError
from app.core.security import create_access_token, hash_password, verify_password
from app.models.enums import (
    OrganizationStatus,
    OrgCancellationPolicyStatus,
    UserRole,
    UserStatus,
)
from app.models.organization import Organization, OrgSettings
from app.models.policy import OrgCancellationPolicy
from app.models.user import EmailVerificationToken, PasswordResetToken, Profile, User
from app.schemas.auth import OrgOwnerSignUpRequest, SignUpRequest
from app.services import email_service

DEFAULT_CANCELLATION_POLICY = {
    "free_cancel_hours": 24,
    "no_show_fee_percent": 50,
    "late_cancel_fee_percent": 25,
}


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.email == email.lower())
    )
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> User | None:
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == user_id)
    )
    return result.scalar_one_or_none()


def issue_token(user: User) -> str:
    return create_access_token(
        str(user.id),
        extra_claims={
            "role": user.role.value,
            "org_id": str(user.org_id) if user.org_id else None,
        },
    )


async def signup_client(db: AsyncSession, data: SignUpRequest) -> User:
    existing = await get_user_by_email(db, data.email)
    if existing:
        raise ForbiddenError("Email already registered")

    user = User(
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        role=UserRole.CLIENT,
        status=UserStatus.ACTIVE,
    )
    db.add(user)
    await db.flush()
    db.add(
        Profile(
            user_id=user.id,
            first_name=data.first_name,
            last_name=data.last_name,
            middle_name=data.middle_name,
            phone=data.phone,
        )
    )
    await db.flush()
    created = await get_user_by_id(db, user.id)  # type: ignore[return-value]
    await issue_and_send_verification(db, created)
    return created


async def signup_org_owner(
    db: AsyncSession, data: OrgOwnerSignUpRequest
) -> tuple[User, Organization]:
    existing = await get_user_by_email(db, data.email)
    if existing:
        raise ForbiddenError("Email already registered")

    user = User(
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        role=UserRole.ORG_OWNER,
        status=UserStatus.ACTIVE,
    )
    db.add(user)
    await db.flush()

    org = Organization(
        owner_id=user.id,
        name=data.organization_name,
        description=data.organization_description,
        status=OrganizationStatus.PENDING,
    )
    db.add(org)
    await db.flush()

    user.org_id = org.id
    db.add(
        Profile(
            user_id=user.id,
            first_name=data.first_name,
            last_name=data.last_name,
            middle_name=data.middle_name,
            phone=data.phone,
        )
    )
    db.add(
        OrgSettings(
            org_id=org.id,
            timezone=data.timezone,
            physical_address=data.physical_address,
            lat=Decimal(str(data.lat)) if data.lat is not None else None,
            lng=Decimal(str(data.lng)) if data.lng is not None else None,
            working_hours=data.working_hours,
        )
    )
    db.add(
        OrgCancellationPolicy(
            org_id=org.id,
            name="Default policy",
            status=OrgCancellationPolicyStatus.ACTIVE,
            data=DEFAULT_CANCELLATION_POLICY,
        )
    )
    await db.flush()
    loaded = await get_user_by_id(db, user.id)
    assert loaded is not None
    await issue_and_send_verification(db, loaded)
    return loaded, org


async def authenticate(db: AsyncSession, email: str, password: str) -> User:
    user = await get_user_by_email(db, email)
    if user is None or not user.password_hash:
        raise UnauthorizedError("Invalid email or password")
    if not verify_password(password, user.password_hash):
        raise UnauthorizedError("Invalid email or password")
    if user.status != UserStatus.ACTIVE:
        raise ForbiddenError("Account is not active")
    return user


async def create_password_reset_token(db: AsyncSession, email: str) -> str | None:
    user = await get_user_by_email(db, email)
    if user is None:
        return None
    raw = secrets.token_urlsafe(32)
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=sha256_hex(raw),
            expires_at=datetime.now(UTC) + timedelta(hours=1),
        )
    )
    await db.flush()
    first_name = user.profile.first_name if user.profile else "there"
    await email_service.send_password_reset_email(
        to_address=user.email,
        first_name=first_name,
        token=raw,
    )
    return raw


async def issue_and_send_verification(db: AsyncSession, user: User) -> str | None:
    if user.email_verified_at is not None:
        return None
    raw = secrets.token_urlsafe(32)
    db.add(
        EmailVerificationToken(
            user_id=user.id,
            token_hash=sha256_hex(raw),
            expires_at=datetime.now(UTC) + timedelta(hours=24),
        )
    )
    await db.flush()
    first_name = user.profile.first_name if user.profile else "there"
    await email_service.send_verification_email(
        to_address=user.email,
        first_name=first_name,
        token=raw,
    )
    return raw


async def verify_email_token(db: AsyncSession, token: str) -> User:
    token_hash = sha256_hex(token)
    result = await db.execute(
        select(EmailVerificationToken).where(
            EmailVerificationToken.token_hash == token_hash,
            EmailVerificationToken.used_at.is_(None),
        )
    )
    row = result.scalar_one_or_none()
    if row is None or row.expires_at < datetime.now(UTC):
        raise ForbiddenError("Invalid or expired verification token")

    user = await get_user_by_id(db, row.user_id)
    if user is None:
        raise NotFoundError("User not found")

    user.email_verified_at = datetime.now(UTC)
    row.used_at = datetime.now(UTC)
    await db.flush()
    return user


async def resend_verification_email(db: AsyncSession, email: str) -> bool:
    user = await get_user_by_email(db, email)
    if user is None:
        return False
    if user.email_verified_at is not None:
        return True
    await issue_and_send_verification(db, user)
    return True


async def reset_password(db: AsyncSession, token: str, new_password: str) -> None:
    token_hash = sha256_hex(token)
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used_at.is_(None),
        )
    )
    row = result.scalar_one_or_none()
    if row is None or row.expires_at < datetime.now(UTC):
        raise ForbiddenError("Invalid or expired reset token")

    user = await get_user_by_id(db, row.user_id)
    if user is None:
        raise NotFoundError("User not found")

    user.password_hash = hash_password(new_password)
    row.used_at = datetime.now(UTC)
    await db.flush()


async def change_password(
    db: AsyncSession, user: User, current_password: str, new_password: str
) -> None:
    """Change password for an authenticated user after verifying current password."""
    if not user.password_hash:
        raise ForbiddenError("User has no password set")
    if not verify_password(current_password, user.password_hash):
        raise ForbiddenError("Current password is incorrect")
    user.password_hash = hash_password(new_password)
    await db.flush()


async def ensure_demo_user(db: AsyncSession) -> User:
    """Create or return a demo client for judge demos."""
    settings = get_settings()
    email = "demo@salondesk.local"
    user = await get_user_by_email(db, email)
    if user:
        return user
    data = SignUpRequest(
        email=email,
        password=settings.secret_key[:12] + "Demo1!",
        first_name="Demo",
        last_name="Client",
    )
    return await signup_client(db, data)
