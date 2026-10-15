"""Populate realistic SalonDesk demo data (Selam Hair Studio + platform).

Usage (from backend/):
  uv run python -m scripts.seed
  uv run python -m scripts.seed --clear
"""

from __future__ import annotations

import argparse
import asyncio
import logging
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import app.models  # noqa: F401 — register all models on metadata
from app.core.config import get_settings
from app.core.database import Base
from app.core.database_url import resolve_database_url
from app.core.security import hash_password
from app.models.booking import Booking, BookingService
from app.models.enums import (
    BookingStatus,
    OrgAccountStatus,
    OrganizationStatus,
    OrgCancellationPolicyStatus,
    PaymentHoldStatus,
    PlatformCommissionType,
    ServiceStatus,
    UserRole,
    UserStatus,
)
from app.models.ledger import PlatformCommission
from app.models.organization import Organization, OrgEmployeeShift, OrgSettings, OrgShift
from app.models.payment import OrgAccount, PaymentHold
from app.models.policy import Consent, OrgCancellationPolicy
from app.models.service import Service, ServiceCategory, ServiceGiving
from app.models.user import Profile, User
from app.services.auth_service import DEFAULT_CANCELLATION_POLICY
from app.services.ledger_service import build_consent_signature

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("seed")

DEFAULT_PASSWORD = "Password123!"


async def ensure_schema(engine) -> None:
    async with engine.begin() as conn:
        # Best-effort: requires a pgvector-enabled Postgres image.
        try:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "Could not enable pgvector extension (RAG needs pgvector image): %s",
                exc,
            )
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Schema ensured (create_all)")


async def clear_database(session: AsyncSession) -> None:
    """Wipe all application tables (PostgreSQL TRUNCATE CASCADE)."""
    tables = list(Base.metadata.sorted_tables)
    if not tables:
        logger.warning("No tables registered on metadata; nothing to clear")
        return
    names = ", ".join(f'"{t.name}"' for t in tables)
    await session.execute(text(f"TRUNCATE {names} RESTART IDENTITY CASCADE"))
    await session.commit()
    logger.info("Cleared %s tables", len(tables))


def _user(
    *,
    email: str,
    role: UserRole,
    first_name: str,
    last_name: str,
    org_id=None,
    phone: str | None = None,
) -> User:
    user = User(
        email=email.lower(),
        password_hash=hash_password(DEFAULT_PASSWORD),
        role=role,
        status=UserStatus.ACTIVE,
        org_id=org_id,
    )
    user.profile = Profile(
        first_name=first_name,
        last_name=last_name,
        phone=phone,
    )
    return user


async def seed_platform(session: AsyncSession) -> dict:
    admin = _user(
        email="admin@salondesk.local",
        role=UserRole.PLATFORM_ADMIN,
        first_name="Platform",
        last_name="Admin",
        phone="+10000000001",
    )
    staff = _user(
        email="staff@salondesk.local",
        role=UserRole.PLATFORM_STAFF,
        first_name="Platform",
        last_name="Staff",
        phone="+10000000002",
    )
    session.add_all([admin, staff])
    await session.flush()

    categories = [
        ServiceCategory(name="Hair", description="Cuts, color, styling"),
        ServiceCategory(name="Nails", description="Manicure and pedicure"),
        ServiceCategory(name="Spa", description="Relaxation and facial treatments"),
    ]
    session.add_all(categories)
    await session.flush()

    commissions = [
        PlatformCommission(
            service_category_id=categories[0].id,
            name="Hair default",
            type=PlatformCommissionType.PERCENTAGE,
            percentage=Decimal("5.0000"),
            flat=None,
        ),
        PlatformCommission(
            service_category_id=categories[1].id,
            name="Nails default",
            type=PlatformCommissionType.PERCENTAGE,
            percentage=Decimal("6.0000"),
            flat=None,
        ),
        PlatformCommission(
            service_category_id=categories[2].id,
            name="Spa hybrid",
            type=PlatformCommissionType.HYBRID,
            percentage=Decimal("3.0000"),
            flat=Decimal("1.00"),
        ),
    ]
    session.add_all(commissions)
    await session.flush()

    logger.info("Seeded platform admin/staff, %s categories, commissions", len(categories))
    return {
        "admin": admin,
        "staff": staff,
        "categories": {c.name: c for c in categories},
        "commissions": commissions,
    }


async def seed_organization(session: AsyncSession, platform: dict) -> dict:
    owner = _user(
        email="owner@selam.local",
        role=UserRole.ORG_OWNER,
        first_name="Selam",
        last_name="Owner",
        phone="+251911000001",
    )
    session.add(owner)
    await session.flush()

    org = Organization(
        owner_id=owner.id,
        name="Selam Hair Studio",
        description="Full-service beauty salon in Bole, Addis Ababa.",
        status=OrganizationStatus.APPROVED,
    )
    session.add(org)
    await session.flush()

    owner.org_id = org.id

    session.add(
        OrgSettings(
            org_id=org.id,
            timezone="Africa/Addis_Ababa",
            physical_address="Bole Road, Addis Ababa",
            lat=Decimal("8.9806000"),
            lng=Decimal("38.7578000"),
            working_hours={
                "mon": [["09:00", "18:00"]],
                "tue": [["09:00", "18:00"]],
                "wed": [["09:00", "18:00"]],
                "thu": [["09:00", "18:00"]],
                "fri": [["09:00", "18:00"]],
                "sat": [["10:00", "16:00"]],
                "sun": [],
            },
        )
    )
    policy = OrgCancellationPolicy(
        org_id=org.id,
        name="Default policy",
        status=OrgCancellationPolicyStatus.ACTIVE,
        data=DEFAULT_CANCELLATION_POLICY,
    )
    session.add(policy)
    session.add(
        OrgAccount(
            org_id=org.id,
            merchant_id="SELAM-MERCHANT-DEMO",
            merchant_email="payments@selam.local",
            display_name="Selam Hair Studio PayPal",
            currency="USD",
            status=OrgAccountStatus.APPROVED,
            approved_at=datetime.now(UTC),
            approved_by=platform["admin"].id,
        )
    )

    reception = _user(
        email="reception@selam.local",
        role=UserRole.RECEPTION,
        first_name="Hanna",
        last_name="Reception",
        org_id=org.id,
        phone="+251911000002",
    )
    stylist_a = _user(
        email="stylist1@selam.local",
        role=UserRole.STYLIST,
        first_name="Meron",
        last_name="Stylist",
        org_id=org.id,
        phone="+251911000003",
    )
    stylist_b = _user(
        email="stylist2@selam.local",
        role=UserRole.STYLIST,
        first_name="Kidist",
        last_name="Stylist",
        org_id=org.id,
        phone="+251911000004",
    )
    session.add_all([reception, stylist_a, stylist_b])
    await session.flush()

    morning = OrgShift(
        org_id=org.id,
        name="Morning",
        data={"windows": [["09:00", "13:00"]], "breaks": [["11:00", "11:15"]]},
    )
    afternoon = OrgShift(
        org_id=org.id,
        name="Afternoon",
        data={"windows": [["13:00", "18:00"]], "breaks": [["15:30", "15:45"]]},
    )
    session.add_all([morning, afternoon])
    await session.flush()
    session.add_all(
        [
            OrgEmployeeShift(user_id=stylist_a.id, org_shift_id=morning.id),
            OrgEmployeeShift(user_id=stylist_b.id, org_shift_id=afternoon.id),
            OrgEmployeeShift(user_id=reception.id, org_shift_id=morning.id),
        ]
    )

    hair = platform["categories"]["Hair"]
    nails = platform["categories"]["Nails"]
    spa = platform["categories"]["Spa"]

    services = [
        Service(
            service_category_id=hair.id,
            organization_id=org.id,
            name="Women's Haircut",
            description="Wash, cut, and blow-dry",
            images={"cover": None, "additional": []},
            base_price=Decimal("45.00"),
            duration_minutes=60,
            status=ServiceStatus.ACTIVE,
            cancellation_policy_id=policy.id,
            simultaneous_capacity=1,
        ),
        Service(
            service_category_id=hair.id,
            organization_id=org.id,
            name="Men's Haircut",
            description="Classic cut and finish",
            images={"cover": None, "additional": []},
            base_price=Decimal("30.00"),
            duration_minutes=45,
            status=ServiceStatus.ACTIVE,
            cancellation_policy_id=policy.id,
            simultaneous_capacity=2,
        ),
        Service(
            service_category_id=hair.id,
            organization_id=org.id,
            name="Hair Color",
            description="Full color treatment",
            images={"cover": None, "additional": []},
            base_price=Decimal("120.00"),
            duration_minutes=120,
            status=ServiceStatus.ACTIVE,
            cancellation_policy_id=policy.id,
            simultaneous_capacity=1,
        ),
        Service(
            service_category_id=nails.id,
            organization_id=org.id,
            name="Manicure",
            description="Classic manicure",
            images={"cover": None, "additional": []},
            base_price=Decimal("25.00"),
            duration_minutes=40,
            status=ServiceStatus.ACTIVE,
            cancellation_policy_id=policy.id,
            simultaneous_capacity=2,
        ),
        Service(
            service_category_id=spa.id,
            organization_id=org.id,
            name="Express Facial",
            description="30-minute refresh facial",
            images={"cover": None, "additional": []},
            base_price=Decimal("55.00"),
            duration_minutes=30,
            status=ServiceStatus.ACTIVE,
            cancellation_policy_id=policy.id,
            simultaneous_capacity=1,
        ),
    ]
    session.add_all(services)
    await session.flush()

    session.add_all(
        [
            ServiceGiving(service_id=services[0].id, user_id=stylist_a.id),
            ServiceGiving(service_id=services[0].id, user_id=stylist_b.id),
            ServiceGiving(service_id=services[1].id, user_id=stylist_a.id),
            ServiceGiving(service_id=services[2].id, user_id=stylist_b.id),
            ServiceGiving(service_id=services[3].id, user_id=stylist_a.id),
            ServiceGiving(service_id=services[4].id, user_id=stylist_b.id),
        ]
    )

    logger.info("Seeded organization %s with %s services", org.name, len(services))
    return {
        "org": org,
        "owner": owner,
        "reception": reception,
        "stylists": [stylist_a, stylist_b],
        "services": services,
        "policy": policy,
    }


async def seed_clients_and_bookings(session: AsyncSession, org_data: dict) -> None:
    client_a = _user(
        email="client@example.com",
        role=UserRole.CLIENT,
        first_name="Ada",
        last_name="Client",
        phone="+15551230001",
    )
    client_b = _user(
        email="client2@example.com",
        role=UserRole.CLIENT,
        first_name="Baye",
        last_name="Client",
        phone="+15551230002",
    )
    session.add_all([client_a, client_b])
    await session.flush()

    org = org_data["org"]
    services = org_data["services"]
    stylist = org_data["stylists"][0]
    starts = datetime.now(UTC).replace(minute=0, second=0, microsecond=0) + timedelta(
        days=2, hours=2
    )

    pending = Booking(
        org_id=org.id,
        client_id=client_a.id,
        stylist_id=stylist.id,
        starts_at=starts,
        ends_at=starts + timedelta(minutes=services[0].duration_minutes),
        status=BookingStatus.PENDING,
        total_price=services[0].base_price,
        commission_snapshot={
            "type": "percentage",
            "percentage": "5.0000",
            "amount": "2.25",
        },
        customer_notes="First visit — prefer quiet station",
    )
    session.add(pending)
    await session.flush()
    session.add(
        BookingService(
            booking_id=pending.id,
            service_id=services[0].id,
            base_price=services[0].base_price,
        )
    )

    confirmed_start = starts + timedelta(days=1)
    confirmed = Booking(
        org_id=org.id,
        client_id=client_b.id,
        stylist_id=org_data["stylists"][1].id,
        starts_at=confirmed_start,
        ends_at=confirmed_start + timedelta(minutes=services[1].duration_minutes),
        status=BookingStatus.CONFIRMED,
        total_price=services[1].base_price,
        commission_snapshot={
            "type": "percentage",
            "percentage": "5.0000",
            "amount": "1.50",
        },
        customer_notes=None,
    )
    session.add(confirmed)
    await session.flush()
    session.add(
        BookingService(
            booking_id=confirmed.id,
            service_id=services[1].id,
            base_price=services[1].base_price,
        )
    )

    terms = "I authorize a PayPal hold for this booking under the salon cancellation policy."
    terms_hash, signature = build_consent_signature(terms)
    session.add(
        Consent(
            booking_id=confirmed.id,
            client_id=client_b.id,
            terms_version="v1",
            terms_text_hash=terms_hash,
            signature_b64=signature,
            signed_payload=f"booking={confirmed.id};accepted=true",
        )
    )
    session.add(
        PaymentHold(
            booking_id=confirmed.id,
            org_id=org.id,
            paypal_order_id=f"SEED-ORDER-{confirmed.id}",
            paypal_authorization_id=f"SEED-AUTH-{confirmed.id}",
            amount=confirmed.total_price,
            currency="USD",
            status=PaymentHoldStatus.AUTHORIZED,
            honor_expires_at=datetime.now(UTC) + timedelta(days=3),
            idempotency_key=f"seed-hold-{confirmed.id}",
        )
    )
    logger.info("Seeded clients and sample bookings (pending + confirmed/hold)")


async def already_seeded(session: AsyncSession) -> bool:
    result = await session.execute(
        select(User.id).where(User.email == "admin@salondesk.local").limit(1)
    )
    return result.scalar_one_or_none() is not None


async def run_seed(*, clear: bool, database_url: str | None = None) -> None:
    settings = get_settings()
    url = resolve_database_url(database_url or settings.database_url)
    logger.info("Connecting to database…")
    engine = create_async_engine(url, echo=False, pool_pre_ping=True)
    session_factory = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
    )

    try:
        await ensure_schema(engine)
        async with session_factory() as session:
            if clear:
                await clear_database(session)
            elif await already_seeded(session):
                logger.info(
                    "Demo data already present (admin@salondesk.local). "
                    "Use --clear to wipe and re-seed."
                )
                return

            platform = await seed_platform(session)
            org_data = await seed_organization(session, platform)
            await seed_clients_and_bookings(session, org_data)
            await session.commit()

        logger.info("Seed complete. Default password for all users: %s", DEFAULT_PASSWORD)
        logger.info(
            "Accounts: admin@salondesk.local, owner@selam.local, "
            "reception@selam.local, stylist1@selam.local, client@example.com"
        )
    finally:
        await engine.dispose()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Seed SalonDesk demo data")
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Truncate all tables before seeding",
    )
    parser.add_argument(
        "--database-url",
        default=None,
        help="Override DATABASE_URL (useful when seeding from host against localhost)",
    )
    return parser


def main(argv: list[str] | None = None) -> None:
    args = build_parser().parse_args(argv)
    asyncio.run(run_seed(clear=args.clear, database_url=args.database_url))


if __name__ == "__main__":
    main()
