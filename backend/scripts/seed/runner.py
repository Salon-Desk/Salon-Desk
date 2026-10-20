"""Load demo rows and expose the seed CLI."""

from __future__ import annotations

import argparse
import asyncio
import logging
from copy import deepcopy
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.core.database_url import resolve_database_url
from app.models.booking import Booking, BookingService
from app.models.curation import FeaturedItem, PlatformCurationSetting
from app.models.enums import (
    BookingStatus,
    OrgAccountStatus,
    OrganizationStatus,
    OrgCancellationPolicyStatus,
    PaymentHoldStatus,
    PlatformCommissionType,
    ServiceStatus,
    UserRole,
)
from app.models.ledger import PlatformCommission
from app.models.organization import Organization, OrgEmployeeShift, OrgSettings, OrgShift
from app.models.payment import OrgAccount, PaymentHold
from app.models.policy import Consent, OrgCancellationPolicy
from app.models.service import Service, ServiceCategory, ServiceGiving
from app.models.user import User
from app.services.auth_service import DEFAULT_CANCELLATION_POLICY
from app.services.ledger_service import build_consent_signature

from .catalog import ORGANIZATION_DEFINITIONS
from .constants import (
    AFTERNOON_SHIFT_DATA,
    AFTERNOON_SHIFT_NAME,
    CANCELLATION_POLICY_NAME,
    CATEGORY_DEFINITIONS,
    COMMISSION_FRACTION,
    CONSENT_TERMS,
    CONSENT_TERMS_VERSION,
    DEFAULT_COMMISSION_RATE,
    DEFAULT_PASSWORD,
    DEFAULT_WORKING_HOURS,
    FALLBACK_SERVICE_CATEGORY,
    MORNING_SHIFT_DATA,
    MORNING_SHIFT_NAME,
    PLATFORM_ADMIN_EMAIL,
    PLATFORM_STAFF_EMAIL,
)
from .helpers import CoverAllocator, already_seeded, build_user, clear_database, ensure_schema
from .images import AVATAR_IMAGES

logger = logging.getLogger("seed")


async def seed_platform(session: AsyncSession) -> dict:
    admin = build_user(
        email=PLATFORM_ADMIN_EMAIL,
        role=UserRole.PLATFORM_ADMIN,
        first_name="Platform",
        last_name="Admin",
        phone="+10000000001",
        picture=AVATAR_IMAGES[0],
    )
    staff = build_user(
        email=PLATFORM_STAFF_EMAIL,
        role=UserRole.PLATFORM_STAFF,
        first_name="Platform",
        last_name="Staff",
        phone="+10000000002",
        picture=AVATAR_IMAGES[1],
    )
    session.add_all([admin, staff])
    await session.flush()

    categories = [
        ServiceCategory(name=name, description=description)
        for name, description in CATEGORY_DEFINITIONS
    ]
    session.add_all(categories)
    await session.flush()

    commissions = [
        PlatformCommission(
            service_category_id=category.id,
            name=f"{category.name} default",
            type=PlatformCommissionType.PERCENTAGE,
            percentage=DEFAULT_COMMISSION_RATE,
            flat=None,
        )
        for category in categories
    ]
    session.add_all(commissions)
    await session.flush()

    logger.info("Seeded platform admin/staff, %s categories, commissions", len(categories))
    return {
        "admin": admin,
        "staff": staff,
        "categories": {category.name: category for category in categories},
        "commissions": commissions,
    }


async def seed_organizations(
    session: AsyncSession,
    platform: dict,
    *,
    limit_orgs: int | None = None,
    limit_services: int | None = None,
) -> list[dict]:
    org_data_list = []
    categories = platform["categories"]
    covers = CoverAllocator()

    org_defs = ORGANIZATION_DEFINITIONS
    if limit_orgs is not None and limit_orgs > 0:
        org_defs = org_defs[:limit_orgs]

    services_per_org = None
    if limit_services is not None and limit_services > 0 and org_defs:
        services_per_org = max(1, limit_services // len(org_defs))

    total_services_count = 0
    for org_def in org_defs:
        owner = build_user(
            email=org_def["owner_email"],
            role=UserRole.ORG_OWNER,
            first_name=org_def["owner_name"][0],
            last_name=org_def["owner_name"][1],
            phone=org_def["owner_phone"],
            picture=org_def["owner_picture"],
        )
        session.add(owner)
        await session.flush()

        org = Organization(
            owner_id=owner.id,
            name=org_def["name"],
            description=org_def["description"],
            picture=org_def["picture"],
            status=OrganizationStatus.APPROVED,
        )
        session.add(org)
        await session.flush()

        owner.org_id = org.id

        session.add(
            OrgSettings(
                org_id=org.id,
                timezone=org_def["timezone"],
                physical_address=org_def["address"],
                lat=org_def["lat"],
                lng=org_def["lng"],
                working_hours=deepcopy(DEFAULT_WORKING_HOURS),
            )
        )

        policy = OrgCancellationPolicy(
            org_id=org.id,
            name=CANCELLATION_POLICY_NAME,
            status=OrgCancellationPolicyStatus.ACTIVE,
            data=DEFAULT_CANCELLATION_POLICY,
        )
        session.add(policy)

        session.add(
            OrgAccount(
                org_id=org.id,
                merchant_id=org_def["merchant_id"],
                merchant_email=org_def["merchant_email"],
                display_name=f"{org.name} PayPal Account",
                currency=org_def["currency"],
                status=OrgAccountStatus.APPROVED,
                approved_at=datetime.now(UTC),
                approved_by=platform["admin"].id,
            )
        )

        reception = build_user(
            email=org_def["reception_email"],
            role=UserRole.RECEPTION,
            first_name=org_def["reception_name"][0],
            last_name=org_def["reception_name"][1],
            phone=org_def["reception_phone"],
            picture=org_def["reception_picture"],
            org_id=org.id,
        )
        session.add(reception)

        stylist_objs = []
        for stylist_email, stylist_name, stylist_phone, stylist_picture in org_def["stylists"]:
            stylist = build_user(
                email=stylist_email,
                role=UserRole.STYLIST,
                first_name=stylist_name[0],
                last_name=stylist_name[1],
                phone=stylist_phone,
                picture=stylist_picture,
                org_id=org.id,
            )
            session.add(stylist)
            stylist_objs.append(stylist)

        await session.flush()

        morning = OrgShift(
            org_id=org.id, name=MORNING_SHIFT_NAME, data=deepcopy(MORNING_SHIFT_DATA)
        )
        afternoon = OrgShift(
            org_id=org.id, name=AFTERNOON_SHIFT_NAME, data=deepcopy(AFTERNOON_SHIFT_DATA)
        )
        session.add_all([morning, afternoon])
        await session.flush()

        session.add_all(
            [
                OrgEmployeeShift(user_id=stylist_objs[0].id, org_shift_id=morning.id),
                OrgEmployeeShift(user_id=stylist_objs[1].id, org_shift_id=afternoon.id),
                OrgEmployeeShift(user_id=reception.id, org_shift_id=morning.id),
            ]
        )

        services_to_seed = org_def["services"]
        if services_per_org is not None:
            remaining = (
                limit_services - total_services_count
                if limit_services is not None
                else len(services_to_seed)
            )
            if remaining <= 0:
                services_to_seed = services_to_seed[:1]
            else:
                services_to_seed = services_to_seed[: min(services_per_org, remaining)]

        services = []
        for category_name, name, description, price, duration, image_url in services_to_seed:
            category = categories.get(category_name) or categories[FALLBACK_SERVICE_CATEGORY]
            cover = covers.allocate(image_url)
            service = Service(
                service_category_id=category.id,
                organization_id=org.id,
                name=name,
                description=description,
                images={
                    "cover": cover,
                    "additional": [cover, covers.secondary(cover)],
                },
                base_price=price,
                duration_minutes=duration,
                status=ServiceStatus.ACTIVE,
                cancellation_policy_id=policy.id,
                simultaneous_capacity=1,
            )
            session.add(service)
            services.append(service)

        total_services_count += len(services)
        await session.flush()

        for service in services:
            session.add(ServiceGiving(service_id=service.id, user_id=stylist_objs[0].id))
            session.add(ServiceGiving(service_id=service.id, user_id=stylist_objs[1].id))

        org_data_list.append(
            {
                "org": org,
                "owner": owner,
                "reception": reception,
                "stylists": stylist_objs,
                "services": services,
                "policy": policy,
            }
        )
        logger.info("Seeded organization %s with %s services", org.name, len(services))

    return org_data_list


async def _add_authorized_booking(
    session: AsyncSession,
    *,
    org: Organization,
    client: User,
    stylist: User,
    service: Service,
    starts_at: datetime,
    customer_notes: str | None,
    currency: str,
) -> None:
    policy_snapshot = {
        "name": "Default",
        **DEFAULT_CANCELLATION_POLICY,
    }
    no_show_pct = Decimal(str(DEFAULT_CANCELLATION_POLICY.get("no_show_fee_percent", 50)))
    late_pct = Decimal(
        str(
            DEFAULT_CANCELLATION_POLICY.get("late_cancel_fee_percent")
            or DEFAULT_CANCELLATION_POLICY.get("no_show_fee_percent", 50)
        )
    )
    agreed_no_show = (service.base_price * no_show_pct / Decimal("100")).quantize(Decimal("0.01"))
    agreed_late_cancel = (service.base_price * late_pct / Decimal("100")).quantize(Decimal("0.01"))
    commission_rule = {
        "type": "percentage",
        "percentage": str(DEFAULT_COMMISSION_RATE),
        "flat": None,
        "amount": str(round(service.base_price * COMMISSION_FRACTION, 2)),
    }
    booking = Booking(
        org_id=org.id,
        client_id=client.id,
        stylist_id=stylist.id,
        starts_at=starts_at,
        ends_at=starts_at + timedelta(minutes=service.duration_minutes),
        status=BookingStatus.CONFIRMED,
        total_price=service.base_price,
        agreed_hold_amount=(
            service.base_price + Decimal(str(commission_rule.get("amount") or "0"))
        ).quantize(Decimal("0.01")),
        agreed_no_show_fee=agreed_no_show,
        agreed_late_cancel_fee=agreed_late_cancel,
        free_cancel_deadline_at=starts_at
        - timedelta(hours=int(DEFAULT_CANCELLATION_POLICY.get("free_cancel_hours", 24))),
        policy_snapshot_json=policy_snapshot,
        commission_snapshot=commission_rule,
        customer_notes=customer_notes,
    )
    session.add(booking)
    await session.flush()
    session.add(
        BookingService(
            booking_id=booking.id,
            service_id=service.id,
            base_price=service.base_price,
            service_policy_snapshot_json=policy_snapshot,
            commission_rule_snapshot_json={
                "type": "percentage",
                "percentage": str(DEFAULT_COMMISSION_RATE),
                "flat": None,
            },
        )
    )

    terms_hash, signature = build_consent_signature(CONSENT_TERMS)
    session.add(
        Consent(
            booking_id=booking.id,
            client_id=client.id,
            terms_version=CONSENT_TERMS_VERSION,
            terms_text_hash=terms_hash,
            signature_b64=signature,
            signed_payload=f"booking={booking.id};accepted=true",
        )
    )
    auth_id = f"SEED-AUTH-{booking.id}"
    session.add(
        PaymentHold(
            booking_id=booking.id,
            org_id=org.id,
            paypal_order_id=f"SEED-ORDER-{booking.id}",
            parent_authorization_id=auth_id,
            latest_authorization_id=auth_id,
            amount=booking.agreed_hold_amount,
            captured_amount=Decimal("0.00"),
            currency=currency,
            status=PaymentHoldStatus.AUTHORIZED,
            honor_expires_at=datetime.now(UTC) + timedelta(days=3),
            reauthorization_count=0,
            idempotency_key=f"seed-hold-{booking.id}",
        )
    )


async def seed_clients_and_bookings(session: AsyncSession, org_data_list: list[dict]) -> None:
    client_a = build_user(
        email="client@example.com",
        role=UserRole.CLIENT,
        first_name="Ada",
        last_name="Client",
        phone="+15551230001",
        picture=AVATAR_IMAGES[0],
    )
    client_b = build_user(
        email="client2@example.com",
        role=UserRole.CLIENT,
        first_name="Baye",
        last_name="Client",
        phone="+15551230002",
        picture=AVATAR_IMAGES[1],
    )
    session.add_all([client_a, client_b])
    await session.flush()

    primary = org_data_list[0]
    org = primary["org"]
    services = primary["services"]
    starts = datetime.now(UTC).replace(minute=0, second=0, microsecond=0) + timedelta(
        days=2, hours=2
    )

    await _add_authorized_booking(
        session,
        org=org,
        client=client_a,
        stylist=primary["stylists"][0],
        service=services[0],
        starts_at=starts,
        customer_notes="First visit — prefer quiet station",
        currency=ORGANIZATION_DEFINITIONS[0]["currency"],
    )
    await _add_authorized_booking(
        session,
        org=org,
        client=client_b,
        stylist=primary["stylists"][1],
        service=services[1],
        starts_at=starts + timedelta(days=1),
        customer_notes=None,
        currency=ORGANIZATION_DEFINITIONS[0]["currency"],
    )
    logger.info("Seeded clients and sample bookings (pending + confirmed/hold)")


async def seed_curation(session: AsyncSession, org_data_list: list[dict]) -> None:
    if not org_data_list:
        return
    primary = org_data_list[0]
    primary_org = primary["org"]
    primary_services = primary["services"]

    curation_setting = PlatformCurationSetting(
        key="default",
        hero_eyebrow="Premier Salon Network",
        hero_headline="Book signature salon treatments with",
        hero_highlight="zero upfront charge.",
        hero_subtitle="Reserve top-rated stylists and salons with seamless PayPal authorization holds. Enjoy flexible rescheduling and transparent policies.",
        hero_image_url=primary_org.picture,
        hero_image_alt=primary_org.name,
        hero_featured_org_id=primary_org.id,
        popular_min_rating=Decimal("4.00"),
        popular_org_weight=Decimal("0.40"),
        popular_service_weight=Decimal("0.60"),
        is_active=True,
    )
    session.add(curation_setting)

    # Feature primary salon
    session.add(
        FeaturedItem(
            target_type="organization",
            org_id=primary_org.id,
            service_id=None,
            badge_text="Premier Partner",
            display_order=1,
            is_active=True,
        )
    )

    # Feature second salon if available
    if len(org_data_list) > 1:
        second_org = org_data_list[1]["org"]
        session.add(
            FeaturedItem(
                target_type="organization",
                org_id=second_org.id,
                service_id=None,
                badge_text="Trending Salon",
                display_order=2,
                is_active=True,
            )
        )

    # Feature single services
    if primary_services:
        session.add(
            FeaturedItem(
                target_type="service",
                org_id=primary_org.id,
                service_id=primary_services[0].id,
                badge_text="Editor's Choice",
                display_order=1,
                is_active=True,
            )
        )
    if len(org_data_list) > 1 and org_data_list[1]["services"]:
        session.add(
            FeaturedItem(
                target_type="service",
                org_id=org_data_list[1]["org"].id,
                service_id=org_data_list[1]["services"][0].id,
                badge_text="Must Try",
                display_order=2,
                is_active=True,
            )
        )

    logger.info("Seeded platform curation hero and featured items")


async def run_seed(
    *,
    clear: bool,
    database_url: str | None = None,
    seed_all: bool = False,
    limit_orgs: int | None = None,
    limit_services: int | None = None,
) -> None:
    settings = get_settings()
    url = resolve_database_url(database_url or settings.database_url)
    logger.info("Connecting to database…")
    engine = create_async_engine(url, echo=False, pool_pre_ping=True)
    session_factory = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
    )

    if seed_all:
        eff_limit_orgs = None
        eff_limit_services = None
    else:
        eff_limit_orgs = limit_orgs if limit_orgs is not None else 20
        eff_limit_services = limit_services if limit_services is not None else 100

    try:
        # --clear drops + recreates tables so model changes (e.g. booking snapshots) apply.
        # Truncate alone cannot add columns; create_all also skips existing tables.
        await ensure_schema(engine, recreate=clear)
        async with session_factory() as session:
            if clear:
                # Safety: empty any leftover rows if drop/create was skipped somehow.
                await clear_database(session)
            elif await already_seeded(session):
                logger.info(
                    "Demo data already present (%s). Schema columns patched; "
                    "use --clear (or SEED_CLEAR=1) to wipe and re-seed.",
                    PLATFORM_ADMIN_EMAIL,
                )
                return

            platform = await seed_platform(session)
            org_data_list = await seed_organizations(
                session,
                platform,
                limit_orgs=eff_limit_orgs,
                limit_services=eff_limit_services,
            )
            await seed_clients_and_bookings(session, org_data_list)
            await seed_curation(session, org_data_list)
            await session.commit()

        logger.info(
            "Seed complete! Created %s organizations and %s services%s.",
            len(org_data_list),
            sum(len(org_data["services"]) for org_data in org_data_list),
            " (full dataset)"
            if seed_all
            else " (demo subset: 20 orgs, ~100 services; use --all for full catalog)",
        )
        logger.info("Default password for all users: %s", DEFAULT_PASSWORD)
    finally:
        await engine.dispose()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m scripts.seed",
        description="Seed SalonDesk demo data",
    )
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Drop and recreate all tables, then seed fresh demo data",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Seed full dataset (all ~432 organizations and ~9,100 services). Default is demo mode (20 orgs, 100 services).",
    )
    parser.add_argument(
        "--limit-orgs",
        type=int,
        default=None,
        help="Custom number of organizations to seed (overrides default of 20 when not --all)",
    )
    parser.add_argument(
        "--limit-services",
        type=int,
        default=None,
        help="Custom total number of services to seed (overrides default of 100 when not --all)",
    )
    parser.add_argument(
        "--database-url",
        default=None,
        help="Override DATABASE_URL (useful when seeding from host against localhost)",
    )
    return parser


def main(argv: list[str] | None = None) -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    args = build_parser().parse_args(argv)
    asyncio.run(
        run_seed(
            clear=args.clear,
            database_url=args.database_url,
            seed_all=args.all,
            limit_orgs=args.limit_orgs,
            limit_services=args.limit_services,
        )
    )
