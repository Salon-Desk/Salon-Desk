"""Load demo rows and expose the seed CLI."""

from __future__ import annotations

import argparse
import asyncio
import logging
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.core.database_url import resolve_database_url
from app.models.booking import Booking, BookingService, WaitlistEntry
from app.models.curation import FeaturedItem, PlatformCurationSetting
from app.models.dispute import DisputeCase
from app.models.enums import (
    BookingStatus,
    DisputeCaseStatus,
    DisputeRecommendation,
    OrgCancellationPolicyStatus,
    PaymentCaptureType,
    PaymentHoldStatus,
    UserRole,
    WaitlistStatus,
)
from app.models.organization import Organization
from app.models.payment import PaymentCapture, PaymentHold
from app.models.policy import Consent, OrgCancellationPolicy
from app.models.service import Service
from app.models.user import User
from app.services.auth_service import DEFAULT_CANCELLATION_POLICY

from .catalog import ORGANIZATION_DEFINITIONS
from .constants import (
    CANCELLATION_POLICY_NAME,
    CATEGORY_DEFINITIONS,
    DEFAULT_PASSWORD,
    PLATFORM_ADMIN_EMAIL,
    PRIMARY_DEMO_CLIENT_EMAIL,
    SECONDARY_DEMO_CLIENT_EMAIL,
)
from .helpers import (
    CoverAllocator,
    already_seeded,
    build_user,
    clear_database,
    ensure_schema,
    reset_allocated_handles,
)
from .images import AVATAR_IMAGES

logger = logging.getLogger("seed")


async def seed_platform(session: AsyncSession) -> dict:
    from .factories import create_categories_and_commissions, create_platform_users

    admin, staff = await create_platform_users(session)
    categories, commissions = await create_categories_and_commissions(session, CATEGORY_DEFINITIONS)

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
    from .factories import (
        create_organization_employees,
        create_organization_services,
        create_organization_with_settings,
    )

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

        policy = OrgCancellationPolicy(
            name=CANCELLATION_POLICY_NAME,
            status=OrgCancellationPolicyStatus.ACTIVE,
            data=DEFAULT_CANCELLATION_POLICY,
        )

        org = await create_organization_with_settings(session, org_def, owner, policy)
        policy.org_id = org.id
        await session.flush()

        reception, stylist_objs = await create_organization_employees(session, org, org_def, policy)

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

        services = await create_organization_services(
            session, org, org_def, policy, stylist_objs, categories, covers, services_to_seed
        )

        total_services_count += len(services)

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
    from .factories import create_booking_with_hold

    await create_booking_with_hold(
        session, org, client, stylist, service, starts_at, customer_notes, currency
    )


async def seed_clients_and_bookings(session: AsyncSession, org_data_list: list[dict]) -> None:
    client_a = build_user(
        email=PRIMARY_DEMO_CLIENT_EMAIL,
        role=UserRole.CLIENT,
        first_name="Abebe",
        last_name="Client",
        phone="+15551230001",
        picture=AVATAR_IMAGES[0],
    )
    client_b = build_user(
        email=SECONDARY_DEMO_CLIENT_EMAIL,
        role=UserRole.CLIENT,
        first_name="Ailuro",
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


async def seed_dispute_and_waitlist(session: AsyncSession, org_data_list: list[dict]) -> None:
    if not org_data_list:
        return
    primary = org_data_list[0]
    org = primary["org"]
    service = primary["services"][0]
    stylist = primary["stylists"][0]

    from app.services.dispute_service import DEFAULT_TRANSCRIPT_EXHIBIT
    from app.services.ledger_service import append_ledger

    from .factories import build_consent_signature

    # 1. Create client for disputed booking
    disputed_client = build_user(
        email="dispute.client@example.com",
        role=UserRole.CLIENT,
        first_name="Hana",
        last_name="Tesfaye",
        phone="+15551230009",
        picture=AVATAR_IMAGES[2],
    )
    session.add(disputed_client)
    await session.flush()

    # 2. Create settled NO_SHOW booking
    starts_at = datetime.now(UTC) - timedelta(days=2, hours=3)
    ends_at = starts_at + timedelta(minutes=service.duration_minutes)
    agreed_fee = Decimal("30.00")

    policy_snapshot = {
        "name": "Default",
        **DEFAULT_CANCELLATION_POLICY,
    }
    commission_snapshot = {
        "type": "percentage",
        "percentage": "10.00",
        "flat": None,
        "amount": "3.00",
    }

    booking = Booking(
        org_id=org.id,
        client_id=disputed_client.id,
        stylist_id=stylist.id,
        starts_at=starts_at,
        ends_at=ends_at,
        status=BookingStatus.NO_SHOW,
        total_price=service.base_price,
        agreed_hold_amount=agreed_fee,
        agreed_no_show_fee=agreed_fee,
        agreed_late_cancel_fee=agreed_fee,
        free_cancel_deadline_at=starts_at - timedelta(hours=24),
        policy_snapshot_json=policy_snapshot,
        commission_snapshot=commission_snapshot,
        customer_notes="Wants cornrows with natural hair",
    )
    session.add(booking)
    await session.flush()

    session.add(
        BookingService(
            booking_id=booking.id,
            service_id=service.id,
            base_price=service.base_price,
            service_policy_snapshot_json=policy_snapshot,
            commission_rule_snapshot_json=commission_snapshot,
        )
    )

    # 3. Create cryptographically signed Consent
    signed_payload = f"booking={booking.id};accepted=true;fee=30.00"
    terms_hash, signature_b64 = build_consent_signature(signed_payload)
    consent = Consent(
        booking_id=booking.id,
        client_id=disputed_client.id,
        terms_version="v1.0-standard",
        terms_text_hash=terms_hash,
        signature_b64=signature_b64,
        signed_payload=signed_payload,
    )
    session.add(consent)

    # 4. Create PaymentHold and PaymentCapture
    hold_id = f"SEED-HOLD-{booking.id}"
    hold = PaymentHold(
        booking_id=booking.id,
        org_id=org.id,
        paypal_order_id=f"SEED-ORDER-{booking.id}",
        parent_authorization_id=hold_id,
        latest_authorization_id=hold_id,
        amount=agreed_fee,
        captured_amount=agreed_fee,
        currency="USD",
        status=PaymentHoldStatus.CAPTURED,
        honor_expires_at=datetime.now(UTC) + timedelta(days=3),
        reauthorization_count=0,
        idempotency_key=f"seed-dispute-hold-{booking.id}",
    )
    session.add(hold)
    await session.flush()

    capture = PaymentCapture(
        booking_id=booking.id,
        hold_id=hold.id,
        paypal_capture_id=f"CAP-{booking.id.hex[:12].upper()}",
        amount=agreed_fee,
        currency="USD",
        capture_type=PaymentCaptureType.NO_SHOW_FEE,
        status="COMPLETED",
    )
    session.add(capture)
    await session.flush()

    # Append ledger entry
    await append_ledger(
        session,
        event_type="CAPTURE_COMPLETED",
        org_id=org.id,
        booking_id=booking.id,
        hold_id=hold.id,
        amount=agreed_fee,
        payload={"reason": "NO_SHOW_FEE", "booking_id": str(booking.id)},
    )

    # 5. Pre-seed DisputeCase in WAITING_FOR_SELLER_RESPONSE state
    rebuttal_text = (
        f"FORMAL REBUTTAL - SALONDESK DISPUTE DEFENSE (REASON: MERCHANDISE_OR_SERVICE_NOT_RECEIVED)\n"
        f"1. Service Agreement: The client booked an exclusive appointment with {org.name} "
        f"scheduled for {starts_at.strftime('%Y-%m-%d %H:%M UTC')}. The client agreed to a deposit/no-show fee "
        f"of ${agreed_fee:.2f} USD if not cancelled before {booking.free_cancel_deadline_at.strftime('%Y-%m-%d %H:%M UTC')}.\n"
        f"2. Cryptographic Proof of Consent: The client signed terms via Ed25519 keypair "
        f"(Terms Hash: {terms_hash[:24]}..., Signature Prefix: {signature_b64[:24]}...). Mathematical verification status: PASS.\n"
        f"3. Verified Transcript Exhibit: Client explicitly consented via chat exchange:\n"
        f"   Client: 'I want to book braids Saturday at 3:00 PM with Selam. I accept the $30 no-show fee policy.'\n"
        f"4. Audit Ledger Integrity: Financial events are sealed in the SalonDesk SHA-256 hash-chained ledger.\n"
        f"5. Conclusion: Merchant reserved chair capacity as contracted. Fee was captured strictly per consented terms."
    )

    investigator_report = {
        "booking_id": str(booking.id),
        "booking_status": "NO_SHOW",
        "created_at_utc": booking.created_at.isoformat() if booking.created_at else None,
        "starts_at_utc": starts_at.strftime("%Y-%m-%d %H:%M UTC"),
        "free_cancel_deadline_at_utc": booking.free_cancel_deadline_at.strftime(
            "%Y-%m-%d %H:%M UTC"
        ),
        "agreed_no_show_fee": str(agreed_fee),
        "captured_amount": str(agreed_fee),
        "capture_id": str(capture.id),
        "paypal_capture_id": capture.paypal_capture_id,
        "ed25519_consent_verified": True,
        "terms_text_hash": terms_hash,
        "signature_prefix": signature_b64[:32],
        "ledger_chain_verified": True,
        "ledger_entries_checked": 1,
        "ledger_error": None,
        "terminal_ledger_hash": "CHAIN_SEALED",
        "transcript_excerpt": DEFAULT_TRANSCRIPT_EXHIBIT,
    }

    dispute_case = DisputeCase(
        booking_id=booking.id,
        org_id=org.id,
        capture_id=capture.id,
        paypal_dispute_id="PP-D-90418-SANDBOX",
        paypal_transaction_id=capture.paypal_capture_id,
        reason="MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
        dispute_amount=agreed_fee,
        status=DisputeCaseStatus.WAITING_FOR_SELLER_RESPONSE,
        consent_verified=True,
        ledger_chain_verified=True,
        ledger_entries_checked=1,
        transcript_excerpt_json=DEFAULT_TRANSCRIPT_EXHIBIT,
        investigator_report_json=investigator_report,
        advocate_rebuttal_text=rebuttal_text,
        skeptic_win_probability=94,
        skeptic_critique=(
            "Strong defense. Valid Ed25519 signature, unbroken SHA-256 ledger chain, clear transcript "
            "evidence, and captured amount is within the agreed fee ceiling. High probability of seller favor adjudication."
        ),
        recommended_action=DisputeRecommendation.FILE_EVIDENCE,
        recommended_offer_amount=None,
    )
    session.add(dispute_case)

    # 6. Pre-seed 2 WaitlistEntry candidates for Slot Rescue
    candidate_1 = WaitlistEntry(
        org_id=org.id,
        service_id=service.id,
        client_id=None,
        client_name="Hana Tesfaye",
        client_email="hana.tesfaye@example.et",
        preferred_starts_at=datetime.now(UTC) + timedelta(days=2, hours=2),
        status=WaitlistStatus.WAITING,
    )
    candidate_2 = WaitlistEntry(
        org_id=org.id,
        service_id=service.id,
        client_id=None,
        client_name="Meron Alemu",
        client_email="meron.alemu@example.et",
        preferred_starts_at=datetime.now(UTC) + timedelta(days=2, hours=4),
        status=WaitlistStatus.WAITING,
    )
    session.add_all([candidate_1, candidate_2])
    await session.flush()
    logger.info("Seeded dispute case PP-D-90418-SANDBOX and 2 waitlist candidates for Slot Rescue")


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
        eff_limit_orgs = limit_orgs if limit_orgs is not None else 12
        eff_limit_services = limit_services if limit_services is not None else 100

    try:
        reset_allocated_handles()
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
            await seed_dispute_and_waitlist(session, org_data_list)
            await seed_curation(session, org_data_list)
            await session.commit()

        logger.info(
            "Seed complete! Created %s organizations and %s services%s.",
            len(org_data_list),
            sum(len(org_data["services"]) for org_data in org_data_list),
            " (full dataset)"
            if seed_all
            else " (demo subset: 12 orgs, ~100 services; use --all for full catalog)",
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
        help="Seed full dataset (all ~432 organizations and ~9,100 services). Default is demo mode (12 orgs, 100 services).",
    )
    parser.add_argument(
        "--limit-orgs",
        type=int,
        default=None,
        help="Custom number of organizations to seed (overrides default of 12 when not --all)",
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
