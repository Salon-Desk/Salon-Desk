"""Populate realistic SalonDesk demo data (10 organizations + 100+ services + proper users + platform).

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

# Reusable high quality Unsplash photos
AVATAR_IMAGES = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
]


def _unsplash(photo_id: str, *, w: int = 800) -> str:
    return f"https://images.unsplash.com/{photo_id}?w={w}&auto=format&fit=crop&q=80"


# One distinct cover per seeded service (assigned by global index in seed_organizations).
SERVICE_COVER_IMAGES = [
    _unsplash("photo-1534528741775-53994a69daeb"),
    _unsplash("photo-1507003211169-0a1dd7228f2d"),
    _unsplash("photo-1517841905240-472988babdf9"),
    _unsplash("photo-1539571696357-5a69c17a67c6"),
    _unsplash("photo-1524504388940-b1c1722653e1"),
    _unsplash("photo-1500648767791-00dcc994a43e"),
    _unsplash("photo-1544005313-94ddf0286df2"),
    _unsplash("photo-1492562080023-ab3db95bfbce"),
    _unsplash("photo-1508214751196-bcfd4ca60f91"),
    _unsplash("photo-1506794778202-cad84cf45f1d"),
    _unsplash("photo-1560869713-7d0a29430803"),
    _unsplash("photo-1522337360788-8b13dee7a37e"),
    _unsplash("photo-1503951914875-452162b0f3f1"),
    _unsplash("photo-1605497788044-5a32c7078486"),
    _unsplash("photo-1562322140-8baeececf3df"),
    _unsplash("photo-1582095133179-bfd08e2fc6b3"),
    _unsplash("photo-1604654894610-df63bc536371"),
    _unsplash("photo-1519014816548-bf5fe059798b"),
    _unsplash("photo-1540555700478-4be289fbecef"),
    _unsplash("photo-1570172619644-dfd03ed5d881"),
    _unsplash("photo-1519699047748-de8e457a634e"),
    _unsplash("photo-1512290923902-8a9f81dc236c"),
    _unsplash("photo-1521590832167-7bcbfaa6381f"),
    _unsplash("photo-1633681926022-84c203e2e1e1"),
    _unsplash("photo-1560066984-138dadb4c035"),
    _unsplash("photo-1634449577252-3e8e2d4c4d4a"),
    _unsplash("photo-1595476108010-b4d1f102b1b1"),
    _unsplash("photo-1522338140262-f46f5913618a"),
    _unsplash("photo-1487412947147-5d3dc0db4c78"),
    _unsplash("photo-1516975080664-ed2fc6a32937"),
    _unsplash("photo-1527799820374-dcf8d9d4a388"),
    _unsplash("photo-1580618672591-eb180b1a973f"),
    _unsplash("photo-1493256338651-d82f9d3a3acc"),
    _unsplash("photo-1559599101-f38222814cf9"),
    _unsplash("photo-1522335789203-aabd1fc54bc9"),
    _unsplash("photo-1596704017254-9b121068fb31"),
    _unsplash("photo-1519415518177-036825c1a910"),
    _unsplash("photo-1457972729786-0411a3b2b626"),
    _unsplash("photo-1522337660859-02fbefca4702"),
    _unsplash("photo-1616394584738-fc6e612e71b9"),
    _unsplash("photo-1487412720507-e7ab37603c6f"),
    _unsplash("photo-1515377905703-c4788e51af15"),
    _unsplash("photo-1544161515-4ab6ce6db874"),
    _unsplash("photo-1512290900672-1f4868000be0"),
    _unsplash("photo-1583001809873-a128495da465"),
    _unsplash("photo-1596462502278-27bfdc403348"),
    _unsplash("photo-1487412912498-0447578fcca8"),
    _unsplash("photo-1526045478516-99145907023c"),
    _unsplash("photo-1571019614242-c5c5dee9f50b"),
    _unsplash("photo-1512496015851-a90fb38ba796"),
    _unsplash("photo-1632345031435-8727f6897d53"),
    _unsplash("photo-1607779097040-29e887df438a"),
    _unsplash("photo-1522337094846-8a818192de1f"),
    _unsplash("photo-1595475884562-072c2c9a7f9e"),
    _unsplash("photo-1620331311520-246422fd82ea"),
    _unsplash("photo-1600948836101-f9ffda59d18f"),
    _unsplash("photo-1560750588-73207b1efd4e"),
    _unsplash("photo-1596704262372-9ffe25a75162"),
    _unsplash("photo-1556228578-0d85b1a4d571"),
    _unsplash("photo-1622286342621-4bd786c2447c"),
    _unsplash("photo-1621605815971-fbc98d665033"),
    _unsplash("photo-1585747860715-2ba37e788b70"),
    _unsplash("photo-1556228453-efd6c1ff04f6"),
    _unsplash("photo-1612817288484-6f916036351b"),
    _unsplash("photo-1596755094514-f87e34085b2c"),
    _unsplash("photo-1616401784845-180882ba9ba8"),
    _unsplash("photo-1470252649378-9c29740c9fa8"),
    _unsplash("photo-1469334031218-e382a71b716b"),
    _unsplash("photo-1515886657613-9f3515b0c78f"),
    _unsplash("photo-1483985988355-763728e1935b"),
    _unsplash("photo-1529626455594-4ff0802cfb7e"),
    _unsplash("photo-1494790108377-be9c29b29330"),
    _unsplash("photo-1438761681033-6461ffad8d80"),
    _unsplash("photo-1472099645785-5658abf4ff4e"),
    _unsplash("photo-1463453091185-61582044d556"),
    _unsplash("photo-1507591064344-4c6ce005b128"),
    _unsplash("photo-1496345875659-11f7dd282d1d"),
    _unsplash("photo-1488426862026-3ee34a7d66df"),
    _unsplash("photo-1521119984829-b74d2c7b5cdb"),
    _unsplash("photo-1500917293891-ef795e70e1f6"),
    _unsplash("photo-1516726817505-f5ed825624d2"),
    _unsplash("photo-1526510747491-63f999d4626b"),
    _unsplash("photo-1492106087820-71f1a00d2b11"),
    _unsplash("photo-1502823403499-6ccfcf4fb453"),
    _unsplash("photo-1552693673-1bf958298935"),
    _unsplash("photo-1620916568836-a8c7c1bd3d6a"),
    _unsplash("photo-1617897903246-719242758052"),
    _unsplash("photo-1556228720-195a672e8a03"),
    _unsplash("photo-1596755389378-c31d21fd1273"),
    _unsplash("photo-1519823551278-64ac92734fb1"),
    _unsplash("photo-1600334129128-685c5582fd35"),
    _unsplash("photo-1598440947619-2c35fc9aa908"),
    _unsplash("photo-1526040652367-ac003a0471fe"),
    _unsplash("photo-1531746020798-e6953c6e8e04"),
    _unsplash("photo-1573496359142-b8d87734a5a2"),
    _unsplash("photo-1599351431613-18ef1fdd27e1"),
    _unsplash("photo-1621607512214-682974801f28"),
    _unsplash("photo-1599351431202-32c3da3b9c85"),
    _unsplash("photo-1618477388954-a0f8c0c0c0c0"),
    _unsplash("photo-1621605812214-682974801f28"),
    _unsplash("photo-1593702288056-972064f308bc"),
    _unsplash("photo-1544717305-2782549b5136"),
    _unsplash("photo-1544716278-ca5e3f4abd8c"),
    _unsplash("photo-1515378791036-0648a3ef77b2"),
    _unsplash("photo-1522202176988-66273c2fd55f"),
    _unsplash("photo-1551836022-d5d88e9218df"),
    _unsplash("photo-1573497019940-1c28c88b4f3e"),
    _unsplash("photo-1580489944761-15a19d654956"),
    _unsplash("photo-1546961329-78bef0414d7c"),
    _unsplash("photo-1531123897727-8f129e1688ce"),
]


async def ensure_schema(engine) -> None:
    async with engine.begin() as conn:
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
    picture: str | None = None,
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
        picture=picture,
    )
    return user


async def seed_platform(session: AsyncSession) -> dict:
    admin = _user(
        email="admin@salondesk.local",
        role=UserRole.PLATFORM_ADMIN,
        first_name="Platform",
        last_name="Admin",
        phone="+10000000001",
        picture=AVATAR_IMAGES[0],
    )
    staff = _user(
        email="staff@salondesk.local",
        role=UserRole.PLATFORM_STAFF,
        first_name="Platform",
        last_name="Staff",
        phone="+10000000002",
        picture=AVATAR_IMAGES[1],
    )
    session.add_all([admin, staff])
    await session.flush()

    category_defs = [
        ("Hair", "Haircuts, styling, blowouts & hair treatments"),
        ("Color", "Hair coloring, balayage, highlights & gloss"),
        ("Barber", "Men's grooming, beard sculpting & hot towel shaves"),
        ("Nails", "Manicures, pedicures, gel extensions & nail art"),
        ("Spa", "Therapeutic massages, body scrubs & hydrotherapy"),
        ("Facial", "HydraFacials, clinical peels & skin therapies"),
        ("Braids", "Knotless braids, cornrows, twists & loc maintenance"),
        ("Lashes & Brows", "Lash extensions, brow lamination & tinting"),
        ("Makeup", "Bridal packages, evening glam & editorial makeup"),
        ("Wellness", "Aromatherapy, sauna, reflexology & holistic wellness"),
    ]

    categories = [ServiceCategory(name=name, description=desc) for name, desc in category_defs]
    session.add_all(categories)
    await session.flush()

    commissions = [
        PlatformCommission(
            service_category_id=cat.id,
            name=f"{cat.name} default",
            type=PlatformCommissionType.PERCENTAGE,
            percentage=Decimal("5.0000"),
            flat=None,
        )
        for cat in categories
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


# Detailed organization definitions
ORGANIZATION_DEFINITIONS = [
    {
        "name": "Selam Hair Studio",
        "description": "Full-service beauty and styling studio in Bole specializing in natural curls, silk wraps, and luxury blowouts.",
        "picture": "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&auto=format&fit=crop&q=80",
        "address": "Bole Road, Near Edna Mall, Addis Ababa",
        "lat": Decimal("8.9806000"),
        "lng": Decimal("38.7578000"),
        "owner_email": "owner@selam.local",
        "owner_name": ("Selam", "Haile"),
        "owner_phone": "+251911000001",
        "owner_picture": AVATAR_IMAGES[0],
        "reception_email": "reception@selam.local",
        "reception_name": ("Hanna", "Tadesse"),
        "reception_phone": "+251911000002",
        "reception_picture": AVATAR_IMAGES[2],
        "stylists": [
            ("stylist1@selam.local", ("Meron", "Bekele"), "+251911000003", AVATAR_IMAGES[4]),
            ("stylist2@selam.local", ("Kidist", "Alemu"), "+251911000004", AVATAR_IMAGES[6]),
        ],
        "merchant_id": "SELAM-MERCHANT-DEMO",
        "merchant_email": "payments@selam.local",
        "services": [
            (
                "Hair",
                "Women's Signature Precision Cut",
                "Scalp detox, artisan scissor haircut, and editorial bouncy round-brush blowout.",
                Decimal("48.00"),
                60,
                "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Hair",
                "Hydra-Steam Silk Press",
                "Deep clarifying wash, nano-mist botanical moisture infusion, and glass-sheen ceramic press.",
                Decimal("65.00"),
                75,
                "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Hair",
                "Men's Executive Haircut & Beard Lineup",
                "Low/taper skin fade with organic tea tree wash and sandalwood razor edge.",
                Decimal("32.00"),
                45,
                "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Color",
                "Sun-Kissed Artisan Balayage",
                "Hand-painted seamless highlights with Olaplex bond repair and gloss toner glaze.",
                Decimal("145.00"),
                120,
                "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Color",
                "Root Touchup & Gloss Refresh",
                "Seamless grey coverage or shade refresh with vibrant luminous glaze.",
                Decimal("70.00"),
                60,
                "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Braids",
                "Knotless Medium Goddess Braids",
                "Featherlight, tension-free box braids with curled boho ends and scalp elixir.",
                Decimal("110.00"),
                180,
                "https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Nails",
                "Deluxe Gel Manicure",
                "Cuticle renewal, shaping, botanical hand massage, and long-wear chip-free gel polish.",
                Decimal("35.00"),
                45,
                "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Nails",
                "Botanical Spa Pedicure",
                "Warm mineral soak, sugar scrub exfoliation, hot towel wrap, and gel lacquer.",
                Decimal("45.00"),
                50,
                "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Spa",
                "Aromatherapy Tension Release Massage",
                "Targeted Swedish massage with pure lavender and eucalyptus essential oils.",
                Decimal("75.00"),
                60,
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Facial",
                "Radiance Glow Express Facial",
                "Enzyme peel exfoliation, ultrasonic pore extraction, and vitamin C brightening mask.",
                Decimal("58.00"),
                40,
                "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Hair",
                "Keratin Anti-Frizz Smoothing Treatment",
                "Formaldehyde-free amino smoothing for ultra-sleek, weather-proof hair shine.",
                Decimal("160.00"),
                150,
                "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop&q=80",
            ),
        ],
    },
    {
        "name": "Luxe & Glow Beauty Lounge",
        "description": "Premier aesthetic lounge offering clinical facials, dermaplaning, and European day spa rituals.",
        "picture": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
        "address": "Kazanchis, Guinea Conakry St, Addis Ababa",
        "lat": Decimal("9.0175000"),
        "lng": Decimal("38.7692000"),
        "owner_email": "owner@luxeglow.local",
        "owner_name": ("Almaz", "Kebede"),
        "owner_phone": "+251911100001",
        "owner_picture": AVATAR_IMAGES[1],
        "reception_email": "reception@luxeglow.local",
        "reception_name": ("Sara", "Yohannes"),
        "reception_phone": "+251911100002",
        "reception_picture": AVATAR_IMAGES[3],
        "stylists": [
            ("stylist1@luxeglow.local", ("Bethlehem", "Desta"), "+251911100003", AVATAR_IMAGES[5]),
            ("stylist2@luxeglow.local", ("Tigist", "Mengistu"), "+251911100004", AVATAR_IMAGES[7]),
        ],
        "merchant_id": "LUXEGLOW-MERCHANT-DEMO",
        "merchant_email": "payments@luxeglow.local",
        "services": [
            (
                "Facial",
                "HydraGlow Diamond Hydrodermabrasion",
                "Deep pore suction, peptide infusion, and diamond crystal exfoliation for red-carpet skin.",
                Decimal("95.00"),
                60,
                "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Facial",
                "Dermaplaning & Peptide Infusion",
                "Surgical-blade dead skin removal and vellus hair dusting paired with hyaluronic acid.",
                Decimal("80.00"),
                50,
                "https://images.unsplash.com/photo-1512290900672-1f4868000be0?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Facial",
                "Bio-Rejuvenating Chemical Peel",
                "Glycolic and lactic acid clinical resurfacing targeting hyperpigmentation and fine lines.",
                Decimal("85.00"),
                45,
                "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Spa",
                "Hot Stone Basalt Lava Therapy",
                "Heated volcanic stones placed along energetic meridians to melt deep muscle knots.",
                Decimal("90.00"),
                75,
                "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Spa",
                "Rosemary & Sea Salt Body Polish",
                "Full-body buffing and exfoliating dead skin followed by warm shea butter massage.",
                Decimal("70.00"),
                50,
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Lashes & Brows",
                "Classic Natural Silk Lash Set",
                "Individually applied Japanese silk extensions for a fluttery mascara look.",
                Decimal("75.00"),
                90,
                "https://images.unsplash.com/photo-1583001809873-a128495da465?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Lashes & Brows",
                "Keratin Brow Lamination & Tint",
                "Semi-permanent brow lift to create fuller, perfectly feathered runway brows.",
                Decimal("55.00"),
                45,
                "https://images.unsplash.com/photo-1512290900672-1f4868000be0?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Makeup",
                "Evening Cocktail Red-Carpet Glam",
                "Sculpted complexion, waterproof smokey eyes, and custom-fluffed mink lashes.",
                Decimal("85.00"),
                60,
                "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Hair",
                "Moroccan Argan Blowout & Waves",
                "Luxury restorative hair wash with argan moisture mask and bouncy beach waves.",
                Decimal("45.00"),
                45,
                "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Nails",
                "Apres Gel-X Russian Extension Set",
                "Full-cover soft gel nail tips sculptured with precision Russian cuticle care.",
                Decimal("65.00"),
                75,
                "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Wellness",
                "Detoxifying Infrared Sauna Blanket",
                "30-minute thermal infrared session assisting lymphatic drainage and deep sweat detox.",
                Decimal("40.00"),
                30,
                "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&auto=format&fit=crop&q=80",
            ),
        ],
    },
    {
        "name": "The Executive Barber Club",
        "description": "Upscale gentleman's barbershop providing precision fades, beard sculpting, and hot lather straight-razor shaves.",
        "picture": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80",
        "address": "Bole Atlas, Namibian St, Addis Ababa",
        "lat": Decimal("8.9950000"),
        "lng": Decimal("38.7820000"),
        "owner_email": "owner@executivebarber.local",
        "owner_name": ("Dawit", "Tefera"),
        "owner_phone": "+251911200001",
        "owner_picture": AVATAR_IMAGES[3],
        "reception_email": "reception@executivebarber.local",
        "reception_name": ("Yared", "Girma"),
        "reception_phone": "+251911200002",
        "reception_picture": AVATAR_IMAGES[5],
        "stylists": [
            (
                "stylist1@executivebarber.local",
                ("Brook", "Assefa"),
                "+251911200003",
                AVATAR_IMAGES[7],
            ),
            (
                "stylist2@executivebarber.local",
                ("Ermias", "Kassa"),
                "+251911200004",
                AVATAR_IMAGES[9],
            ),
        ],
        "merchant_id": "EXECBARBER-MERCHANT-DEMO",
        "merchant_email": "payments@executivebarber.local",
        "services": [
            (
                "Barber",
                "Master Barber Skin Fade",
                "Razor-sharp taper fade, clipper blend, edge line-up, and invigorating bay rum toner.",
                Decimal("28.00"),
                40,
                "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Barber",
                "Royal Hot Towel Shave",
                "Pre-shave eucalyptus oil, warm badger foam lather, straight razor shave, and cold towel compress.",
                Decimal("32.00"),
                35,
                "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Barber",
                "Beard Sculpt & Organic Balm Condition",
                "Freehand beard trimming, neckline shape up, and heated argan conditioning treatment.",
                Decimal("22.00"),
                30,
                "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Barber",
                "The Executive VIP Package",
                "Signature haircut, beard sculpting, charcoal peel mask, and 10-minute neck massage.",
                Decimal("60.00"),
                75,
                "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Hair",
                "Grey Camouflage Hair Tint",
                "Discreet 10-minute subtle hair blend to naturally soften silver and white hair.",
                Decimal("35.00"),
                30,
                "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Facial",
                "Gentleman's Charcoal Detox Facial",
                "Blackhead suction, tea tree exfoliation, and cold menthol calming clay mask.",
                Decimal("45.00"),
                35,
                "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Barber",
                "Father & Son Haircut Duo",
                "Joint session pairing an adult signature fade with a clean student trim.",
                Decimal("48.00"),
                60,
                "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Barber",
                "Buzz Cut & Straight Razor Edge",
                "Single or dual clipper guard trim across the scalp with clean perimeter razor detailing.",
                Decimal("18.00"),
                25,
                "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Spa",
                "Upper Back & Shoulder Tension Relief",
                "Deep thumbs-on acupressure for office desk neck stiffness and trap tension.",
                Decimal("35.00"),
                30,
                "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Hair",
                "Scalp Exfoliation & Dandruff Therapy",
                "Salicylic acid scalp scrub with peppermint steam to banish dryness and flakes.",
                Decimal("38.00"),
                35,
                "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Wellness",
                "Eucalyptus Steam & Face Rejuvenator",
                "Inhaled organic herbal steam with chilled rosewater towel refresh.",
                Decimal("20.00"),
                20,
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80",
            ),
        ],
    },
    {
        "name": "Velvet Nails & Spa Retreat",
        "description": "Boutique nail art sanctuary offering Russian dry manicures, Japanese soft gels, and organic spa pedicures.",
        "picture": "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop&q=80",
        "address": "Sarbet, South Africa St, Addis Ababa",
        "lat": Decimal("8.9912000"),
        "lng": Decimal("38.7350000"),
        "owner_email": "owner@velvetnails.local",
        "owner_name": ("Hiwot", "Tesfaye"),
        "owner_phone": "+251911300001",
        "owner_picture": AVATAR_IMAGES[4],
        "reception_email": "reception@velvetnails.local",
        "reception_name": ("Rahel", "Solomon"),
        "reception_phone": "+251911300002",
        "reception_picture": AVATAR_IMAGES[6],
        "stylists": [
            ("stylist1@velvetnails.local", ("Helen", "Worku"), "+251911300003", AVATAR_IMAGES[8]),
            ("stylist2@velvetnails.local", ("Eden", "Berhanu"), "+251911300004", AVATAR_IMAGES[0]),
        ],
        "merchant_id": "VELVETNAILS-MERCHANT-DEMO",
        "merchant_email": "payments@velvetnails.local",
        "services": [
            (
                "Nails",
                "Russian Hardware Manicure",
                "E-file cuticle diamond polish, flawless edge alignment, and high-shine rubber base.",
                Decimal("42.00"),
                60,
                "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Nails",
                "Builder in a Bottle (BIAB) Overlay",
                "Reinforcing soft gel overlay to nurture natural nail strength without breakage.",
                Decimal("50.00"),
                60,
                "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Nails",
                "Custom 3D Chrome Nail Art",
                "Hand-drawn metallic chrome motifs, French ombré, or freshwater pearl decals.",
                Decimal("25.00"),
                30,
                "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Nails",
                "Luxe Collagen Foot Pedicure",
                "Collagen-infused foot booties, pumice callus smoothing, and hot stone leg massage.",
                Decimal("55.00"),
                60,
                "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Nails",
                "Hard Gel Sculptured Extensions",
                "Full sculpting on forms tailored to almond, stiletto, coffin, or square silhouettes.",
                Decimal("75.00"),
                90,
                "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Nails",
                "Express Polish Change",
                "Rapid nail file, shape, and quick-dry lacquer coat for clients on the go.",
                Decimal("15.00"),
                20,
                "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Spa",
                "Warm Paraffin Wax Hand Therapy",
                "Warm peach paraffin dip locking in intense hydration for dehydrated joints and cuticles.",
                Decimal("20.00"),
                25,
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Lashes & Brows",
                "Brow Wax & Hybrid Stain",
                "Clean waxing and architectural tinting that stains both brow hairs and underlying skin.",
                Decimal("35.00"),
                35,
                "https://images.unsplash.com/photo-1512290900672-1f4868000be0?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Lashes & Brows",
                "Lash Lift & Keratin Tint",
                "Curl lash roots upward to give 6–8 weeks of effortless flutter and jet black shine.",
                Decimal("50.00"),
                50,
                "https://images.unsplash.com/photo-1583001809873-a128495da465?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Facial",
                "Gold Leaf Hydration Sheet Facial",
                "24k active gold serum and biocellulose mask while enjoying your pedicure.",
                Decimal("40.00"),
                30,
                "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Wellness",
                "Lavender Essential Oil Foot Soak",
                "Detox salt crystals with fresh lavender sprigs and soothing reflexology pressure points.",
                Decimal("30.00"),
                25,
                "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80",
            ),
        ],
    },
    {
        "name": "Serenity Wellness & Aromatherapy Haven",
        "description": "Holistic day spa sanctuary focusing on chronic pain release, deep tissue therapies, and herbal compresses.",
        "picture": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80",
        "address": "Old Airport, Mozambique St, Addis Ababa",
        "lat": Decimal("8.9830000"),
        "lng": Decimal("38.7290000"),
        "owner_email": "owner@serenityspa.local",
        "owner_name": ("Genet", "Hailu"),
        "owner_phone": "+251911400001",
        "owner_picture": AVATAR_IMAGES[5],
        "reception_email": "reception@serenityspa.local",
        "reception_name": ("Martha", "Abebe"),
        "reception_phone": "+251911400002",
        "reception_picture": AVATAR_IMAGES[7],
        "stylists": [
            ("stylist1@serenityspa.local", ("Meseret", "Fikru"), "+251911400003", AVATAR_IMAGES[9]),
            ("stylist2@serenityspa.local", ("Tsedey", "Lemma"), "+251911400004", AVATAR_IMAGES[1]),
        ],
        "merchant_id": "SERENITY-MERCHANT-DEMO",
        "merchant_email": "payments@serenityspa.local",
        "services": [
            (
                "Spa",
                "Deep Tissue Myofascial Release",
                "Intense forearm and elbow work targeting chronic neck, lower back, and posture tension.",
                Decimal("85.00"),
                60,
                "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Spa",
                "Swedish Flow Relaxation Massage",
                "Gentle effleurage strokes, warmed sweet almond oil, and calming rhythmic cadence.",
                Decimal("70.00"),
                60,
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Spa",
                "Couples Candlelight Retreat Massage",
                "Dual side-by-side massages in our private aromatic suite with champagne and fruit.",
                Decimal("160.00"),
                75,
                "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Spa",
                "Herbal Thai Compress Poultice",
                "Steamed linen bags filled with ginger, lemongrass, and turmeric pressed into muscles.",
                Decimal("90.00"),
                75,
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Wellness",
                "Lymphatic Drainage Therapy",
                "Ultra-light rhythmic lymphatic pumps promoting immune detox and water retention drainage.",
                Decimal("75.00"),
                50,
                "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Wellness",
                "Reflexology Foot Pathway Massage",
                "Targeted thumb stimulation across foot reflex zones connected to bodily organs.",
                Decimal("48.00"),
                45,
                "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Facial",
                "Soothing Chamomile Sensitive Skin Facial",
                "Calming oatmeal mask, chilled jade rollers, and aloe infusion for redness and rosacea.",
                Decimal("65.00"),
                50,
                "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Spa",
                "Dead Sea Mud Detox Body Cocoon",
                "Warm mineral mud wrapped in thermal blankets followed by a rainfall rinse.",
                Decimal("95.00"),
                70,
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Spa",
                "Prenatal Gentle Mother-to-Be Massage",
                "Specialized pregnancy side-lying cushioning and gentle safe hip tension relief.",
                Decimal("80.00"),
                60,
                "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Wellness",
                "Chakra Balance Tuning & Scalp Massage",
                "Tibetan singing bowl vibration coupled with warming peppermint scalp pressure points.",
                Decimal("55.00"),
                40,
                "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Spa",
                "Express Back & Shoulder Quick Fix",
                "Intensive 30-minute chair massage designed for busy midday breaks.",
                Decimal("40.00"),
                30,
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80",
            ),
        ],
    },
    {
        "name": "AfroChic Braids & Natural Crown",
        "description": "Artisan braiding bar celebrated for custom stitch cornrows, faux locs, passion twists, and scalp therapy.",
        "picture": "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&auto=format&fit=crop&q=80",
        "address": "CMC Road, Near Michael Roundabout, Addis Ababa",
        "lat": Decimal("9.0200000"),
        "lng": Decimal("38.8250000"),
        "owner_email": "owner@afrochic.local",
        "owner_name": ("Saba", "Zeleke"),
        "owner_phone": "+251911500001",
        "owner_picture": AVATAR_IMAGES[6],
        "reception_email": "reception@afrochic.local",
        "reception_name": ("Fasika", "Mulugeta"),
        "reception_phone": "+251911500002",
        "reception_picture": AVATAR_IMAGES[8],
        "stylists": [
            ("stylist1@afrochic.local", ("Blen", "Kassahun"), "+251911500003", AVATAR_IMAGES[0]),
            ("stylist2@afrochic.local", ("Ruth", "Hailemariam"), "+251911500004", AVATAR_IMAGES[2]),
        ],
        "merchant_id": "AFROCHIC-MERCHANT-DEMO",
        "merchant_email": "payments@afrochic.local",
        "services": [
            (
                "Braids",
                "Medium Knotless Box Braids",
                "Smooth parting, natural roots, lightweight movement, and hot water dipped tips.",
                Decimal("95.00"),
                180,
                "https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Braids",
                "Bohemian Curls Goddess Braids",
                "Knotless braids blended with curly raw human hair strands for ethereal volume.",
                Decimal("130.00"),
                200,
                "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Braids",
                "Artisan Feed-in Stitch Cornrows",
                "Sharp geometric stitch feed-in cornrows sculpted straight back or in custom curves.",
                Decimal("55.00"),
                90,
                "https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Braids",
                "Passion Twists with Waterwave Hair",
                "Textured boho twists with a fluffy, lightweight and effortless bounce.",
                Decimal("105.00"),
                150,
                "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Braids",
                "Traditional Ethiopian Albaso Braids",
                "Authentic regal Ethiopian hairstyle with crown micro-cornrows and voluminous loose curls.",
                Decimal("60.00"),
                120,
                "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Braids",
                "Loc Retwist & Palm Roll Styling",
                "Deep clarifying tea tree wash, interlocking or palm roll retwist, and barrel twist updo.",
                Decimal("70.00"),
                90,
                "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Hair",
                "Natural Hair Two-Strand Twist Out",
                "Organic shea butter setting, hooded dryer cure, and defined frizz-free unraveling.",
                Decimal("45.00"),
                60,
                "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Hair",
                "Deep Moisture Chebe & Castor Scalp Mask",
                "Traditional Chadian Chebe powder and black castor oil steam bath for length retention.",
                Decimal("40.00"),
                45,
                "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Braids",
                "Fulani Braids with Cowrie Shell Beads",
                "Middle braid with side cornrows adorned with wooden beads and bronze cowrie accents.",
                Decimal("85.00"),
                140,
                "https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Braids",
                "Braid Takedown, Wash & Detangle",
                "Gentle shed hair removal, slip conditioning, and thorough scalp cleansing.",
                Decimal("35.00"),
                60,
                "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Wellness",
                "Scalp High-Frequency Stimulation",
                "Violet argon electrode therapy boosting blood flow to hair follicles for density.",
                Decimal("25.00"),
                20,
                "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80",
            ),
        ],
    },
    {
        "name": "Aura Laser & MedSpa Clinic",
        "description": "Doctor-supervised medical spa specializing in microneedling, IPL photo-rejuvenation, and advanced anti-aging.",
        "picture": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80",
        "address": "Hayahulet, Haile Gebreselassie Ave, Addis Ababa",
        "lat": Decimal("9.0150000"),
        "lng": Decimal("38.7880000"),
        "owner_email": "owner@auramedspa.local",
        "owner_name": ("Dr. Senait", "Wolde"),
        "owner_phone": "+251911600001",
        "owner_picture": AVATAR_IMAGES[7],
        "reception_email": "reception@auramedspa.local",
        "reception_name": ("Lydia", "Getachew"),
        "reception_phone": "+251911600002",
        "reception_picture": AVATAR_IMAGES[9],
        "stylists": [
            (
                "stylist1@auramedspa.local",
                ("Netsanet", "Tilahun"),
                "+251911600003",
                AVATAR_IMAGES[1],
            ),
            ("stylist2@auramedspa.local", ("Hawi", "Negash"), "+251911600004", AVATAR_IMAGES[3]),
        ],
        "merchant_id": "AURASPA-MERCHANT-DEMO",
        "merchant_email": "payments@auramedspa.local",
        "services": [
            (
                "Facial",
                "Collagen Induction Microneedling",
                "Clinical pen micro-punctures stimulating elastin and collagen regeneration for acne scars.",
                Decimal("140.00"),
                75,
                "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Facial",
                "IPL Photo-Facial Sunspot Treatment",
                "Intense pulsed light targeting stubborn pigmentation, sun spots, and broken capillaries.",
                Decimal("120.00"),
                50,
                "https://images.unsplash.com/photo-1512290900672-1f4868000be0?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Facial",
                "PRP Vampire Glow Facial",
                "Concentrated growth factors applied with micro-infusion for youthful, poreless radiance.",
                Decimal("220.00"),
                90,
                "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Facial",
                "TCA Cross Deep Scar Resurfacing",
                "High-potency trichloroacetic acid targeted on ice-pick scars to elevate skin texture.",
                Decimal("110.00"),
                45,
                "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Wellness",
                "Clinical LED Light Bio-Synthesis",
                "Medical-grade 830nm near-infrared and 415nm blue light for deep cellular healing.",
                Decimal("45.00"),
                30,
                "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Facial",
                "Oxygen Dome Hyperbaric Facial",
                "Pure pressurized ionized oxygen mist with anionic vitamins quenching dull skin.",
                Decimal("90.00"),
                60,
                "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Wellness",
                "Glutathione & Vitamin IV Drip",
                "High-potency master antioxidant infusion promoting liver detox and all-over glow.",
                Decimal("95.00"),
                45,
                "https://images.unsplash.com/photo-1512290900672-1f4868000be0?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Lashes & Brows",
                "Microblading Semi-Permanent Brow Embroidery",
                "Hair-like micro-strokes mimicking natural brow hair using sterile organic pigment.",
                Decimal("180.00"),
                120,
                "https://images.unsplash.com/photo-1512290900672-1f4868000be0?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Lashes & Brows",
                "Ombre Powder Brow Tattoo",
                "Soft powdered makeup gradient effect lasting up to 2 years with crisp definition.",
                Decimal("190.00"),
                120,
                "https://images.unsplash.com/photo-1583001809873-a128495da465?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Facial",
                "Radiofrequency Skin Tightening",
                "Subdermal heat energy firming jawline contours, neck bands, and nasolabial folds.",
                Decimal("100.00"),
                50,
                "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Wellness",
                "Cryotherapy Puffiness Relief",
                "-30°C thermal shock probe rapidly reducing inflammation, redness, and eye bags.",
                Decimal("50.00"),
                25,
                "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80",
            ),
        ],
    },
    {
        "name": "Enchanted Bridal & Glam Studio",
        "description": "Luxury wedding and special occasion atelier crafting bespoke bridal makeup, veil styling, and glam.",
        "picture": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=80",
        "address": "Gerji, Imperial Traffic Light, Addis Ababa",
        "lat": Decimal("8.9890000"),
        "lng": Decimal("38.8050000"),
        "owner_email": "owner@enchantedbridal.local",
        "owner_name": ("Mimi", "Bogale"),
        "owner_phone": "+251911700001",
        "owner_picture": AVATAR_IMAGES[8],
        "reception_email": "reception@enchantedbridal.local",
        "reception_name": ("Tsion", "Gebre"),
        "reception_phone": "+251911700002",
        "reception_picture": AVATAR_IMAGES[0],
        "stylists": [
            (
                "stylist1@enchantedbridal.local",
                ("Kalkidan", "Chernet"),
                "+251911700003",
                AVATAR_IMAGES[2],
            ),
            (
                "stylist2@enchantedbridal.local",
                ("Semhar", "Tekle"),
                "+251911700004",
                AVATAR_IMAGES[4],
            ),
        ],
        "merchant_id": "ENCHANTED-MERCHANT-DEMO",
        "merchant_email": "payments@enchantedbridal.local",
        "services": [
            (
                "Makeup",
                "Imperial Royal Bridal Makeup Package",
                "Airbrush waterproof base, 24-hr lip locking, mink lashes, and full day emergency touchup kit.",
                Decimal("165.00"),
                90,
                "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Hair",
                "Sculpted Bridal Chignon Updo",
                "Romantic textured updo, hair padding, tiara or veil placement, and strong-hold lacquer.",
                Decimal("90.00"),
                75,
                "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Makeup",
                "Bridesmaid Soft Glam Makeup",
                "Flawless complexion matching the bridal color palette with fluttery lash accents.",
                Decimal("65.00"),
                45,
                "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Makeup",
                "Bridal Trial Consultation Session",
                "Color theory matching, two eye variations, and flash photography reflection check.",
                Decimal("80.00"),
                75,
                "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Lashes & Brows",
                "Russian Mega-Volume Lashes",
                "Handcrafted 6D–10D delicate fans creating full, velvety, ultra-dense lash glam.",
                Decimal("95.00"),
                100,
                "https://images.unsplash.com/photo-1583001809873-a128495da465?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Lashes & Brows",
                "Wispy Kim-K Lash Extensions",
                "Spike mapping interspersed with soft feather volume for iconic celebrity eyes.",
                Decimal("85.00"),
                90,
                "https://images.unsplash.com/photo-1583001809873-a128495da465?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Hair",
                "Hollywood Glam Red-Carpet Waves",
                "Precision hot-set curls brushed into uniform, reflective, sculptural vintage waves.",
                Decimal("75.00"),
                60,
                "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Makeup",
                "Editorial Photoshoot Contour Makeup",
                "High-definition camera-ready cream sculpting and matte T-zone airbrushing.",
                Decimal("85.00"),
                60,
                "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Nails",
                "Bridal French Ombre Babyboomer Nails",
                "Soft diffused gradient French finish adorned with Swarovski crystal accents.",
                Decimal("48.00"),
                60,
                "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Facial",
                "Pre-Wedding Oxygen Sheet Infusion",
                "Intense glow prep 24 hours before ceremony ensuring zero patchiness or dryness.",
                Decimal("70.00"),
                45,
                "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Spa",
                "Bridal Stress Relief Aromatherapy",
                "Warming neck, shoulder, and foot massage calming pre-wedding nerves and jitters.",
                Decimal("60.00"),
                45,
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80",
            ),
        ],
    },
    {
        "name": "Urban Edge Color Bar & Hair Lab",
        "description": "Trendsetting color lab specializing in platinum blonde bleaching, vivid jewel tones, and thermal reconstruction.",
        "picture": "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&auto=format&fit=crop&q=80",
        "address": "Piassa, Churchill Ave, Addis Ababa",
        "lat": Decimal("9.0320000"),
        "lng": Decimal("38.7520000"),
        "owner_email": "owner@urbanedge.local",
        "owner_name": ("Natnael", "Sisay"),
        "owner_phone": "+251911800001",
        "owner_picture": AVATAR_IMAGES[9],
        "reception_email": "reception@urbanedge.local",
        "reception_name": ("Melat", "Demissie"),
        "reception_phone": "+251911800002",
        "reception_picture": AVATAR_IMAGES[1],
        "stylists": [
            ("stylist1@urbanedge.local", ("Abel", "Wondimu"), "+251911800003", AVATAR_IMAGES[3]),
            ("stylist2@urbanedge.local", ("Fikirte", "Taye"), "+251911800004", AVATAR_IMAGES[5]),
        ],
        "merchant_id": "URBANEDGE-MERCHANT-DEMO",
        "merchant_email": "payments@urbanedge.local",
        "services": [
            (
                "Color",
                "Platinum Icy Blonde Full Bleach Out",
                "Double-process gentle scalp on-scalp lightener, bond builder, and violet silver toner.",
                Decimal("160.00"),
                180,
                "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Color",
                "Copper Peach & Auburn Gloss Blend",
                "Warm dimensional autumn tones with high-gloss liquid glass shine seal.",
                Decimal("110.00"),
                100,
                "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Color",
                "Creative Vivid Jewel Tones",
                "Direct dye custom mixing: midnight cobalt, amethyst purple, or emerald green.",
                Decimal("135.00"),
                120,
                "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Color",
                "Color Correction & Banding Removal",
                "Expert chemical color extraction resolving uneven boxed dye and brassy bands.",
                Decimal("180.00"),
                210,
                "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Hair",
                "Textured Shag & Razor Curtain Bangs",
                "Edgy French razor layering bringing effortless texture, volume, and retro movement.",
                Decimal("50.00"),
                50,
                "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Hair",
                "Olaplex No. 1 & 2 Molecular Bond Rescue",
                "Standalone active patented chemistry re-linking broken disulphide hair bonds.",
                Decimal("45.00"),
                40,
                "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Hair",
                "Japanese Thermal Permanent Straightening",
                "Structural chemical realignment giving pin-straight, ultra-sleek waterproof hair.",
                Decimal("200.00"),
                180,
                "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Hair",
                "Blonde Toner Glaze & Wash Refresh",
                "15-minute shampoo bowl glaze neutralizing yellow tones between highlight appointments.",
                Decimal("35.00"),
                30,
                "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Barber",
                "Color & Fade Combo for Men",
                "Skin fade paired with silver ash or honey blonde bleached textured crop.",
                Decimal("60.00"),
                60,
                "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Facial",
                "Post-Color Soothing Scalp Aloe Facial",
                "Cooling aloe vera and witch hazel treatment relieving scalp post-bleach sensitivity.",
                Decimal("30.00"),
                25,
                "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Spa",
                "Scalp Acupressure Shirodhara Flow",
                "Warm continuous stream of herbal oil over forehead and scalp relieving tension.",
                Decimal("55.00"),
                40,
                "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80",
            ),
        ],
    },
    {
        "name": "Zen Garden Thai Massage & Reflexology",
        "description": "Authentic eastern wellness house featuring traditional floor Thai yoga massages, foot reflexology, and herbal saunas.",
        "picture": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80",
        "address": "Bisrate Gabriel, Laphto Mall Area, Addis Ababa",
        "lat": Decimal("8.9720000"),
        "lng": Decimal("38.7360000"),
        "owner_email": "owner@zengarden.local",
        "owner_name": ("Abeba", "Tsegaye"),
        "owner_phone": "+251911900001",
        "owner_picture": AVATAR_IMAGES[0],
        "reception_email": "reception@zengarden.local",
        "reception_name": ("Feven", "Gashaw"),
        "reception_phone": "+251911900002",
        "reception_picture": AVATAR_IMAGES[2],
        "stylists": [
            ("stylist1@zengarden.local", ("Marta", "Damte"), "+251911900003", AVATAR_IMAGES[4]),
            ("stylist2@zengarden.local", ("Samrawit", "Belay"), "+251911900004", AVATAR_IMAGES[6]),
        ],
        "merchant_id": "ZENGARDEN-MERCHANT-DEMO",
        "merchant_email": "payments@zengarden.local",
        "services": [
            (
                "Spa",
                "Traditional Thai Yoga Floor Massage",
                "Full-body assisted passive stretching, joint mobilization, and sen energy line work.",
                Decimal("75.00"),
                60,
                "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Spa",
                "Warm Lemongrass Coconut Oil Massage",
                "Soothing gliding strokes using pure organic virgin coconut oil and lemongrass.",
                Decimal("80.00"),
                60,
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Wellness",
                "Thai Herbal Steam Room Experience",
                "30-minute private steam infused with plai, kaffir lime leaves, and wild camphor.",
                Decimal("35.00"),
                30,
                "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Wellness",
                "Royal Thai Foot Reflexology",
                "Wooden reflex stick pressure point stimulation accompanied by mint camphor balm.",
                Decimal("45.00"),
                50,
                "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Spa",
                "Four-Hands Synchronized Thai Massage",
                "Two therapists working in complete harmony to deliver an unmatched relaxation trance.",
                Decimal("145.00"),
                60,
                "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Spa",
                "Heated Bamboo Stalk Muscle Sculpting",
                "Warm solid bamboo canes rolled across tight quad and calf muscle bellies.",
                Decimal("85.00"),
                60,
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Facial",
                "Tanaka Japanese Face Lift Massage",
                "Facial contouring lymphatic drainage lifting cheeks and reducing water puffiness.",
                Decimal("60.00"),
                45,
                "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Wellness",
                "Tibetan Singing Bowl Sound Bath",
                "Harmonic frequency meditation balancing brainwaves from beta to calming theta states.",
                Decimal("40.00"),
                40,
                "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Spa",
                "Tamarind & Honey Glowing Body Scrub",
                "Natural fruit alpha-hydroxy acids and wild forest honey smoothing dry body skin.",
                Decimal("65.00"),
                50,
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Wellness",
                "Office Neck & Head Acupressure Express",
                "Concentrated relief for temple headaches, neck strain, and digital eye fatigue.",
                Decimal("35.00"),
                30,
                "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80",
            ),
            (
                "Spa",
                "Warm Sesame Oil Ear Candle & Scalp Rub",
                "Gentle thermal convective ear clearing followed by soothing organic sesame scalp massage.",
                Decimal("40.00"),
                35,
                "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80",
            ),
        ],
    },
]


async def seed_organizations(session: AsyncSession, platform: dict) -> list[dict]:
    org_data_list = []
    categories = platform["categories"]
    cover_index = 0

    def allocate_cover(preferred: str) -> str:
        """Assign a unique cover from SERVICE_COVER_IMAGES; fall back to preferred."""
        nonlocal cover_index
        if cover_index < len(SERVICE_COVER_IMAGES):
            cover = SERVICE_COVER_IMAGES[cover_index]
            cover_index += 1
            return cover
        return preferred or SERVICE_COVER_IMAGES[0]

    for org_def in ORGANIZATION_DEFINITIONS:
        owner = _user(
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
                timezone="Africa/Addis_Ababa",
                physical_address=org_def["address"],
                lat=org_def["lat"],
                lng=org_def["lng"],
                working_hours={
                    "mon": [["09:00", "18:00"]],
                    "tue": [["09:00", "18:00"]],
                    "wed": [["09:00", "18:00"]],
                    "thu": [["09:00", "18:00"]],
                    "fri": [["09:00", "19:00"]],
                    "sat": [["09:00", "17:00"]],
                    "sun": [["10:00", "15:00"]],
                },
            )
        )

        policy = OrgCancellationPolicy(
            org_id=org.id,
            name="Standard 24h Policy",
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
                currency="USD",
                status=OrgAccountStatus.APPROVED,
                approved_at=datetime.now(UTC),
                approved_by=platform["admin"].id,
            )
        )

        reception = _user(
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
        for s_email, s_name, s_phone, s_pic in org_def["stylists"]:
            st = _user(
                email=s_email,
                role=UserRole.STYLIST,
                first_name=s_name[0],
                last_name=s_name[1],
                phone=s_phone,
                picture=s_pic,
                org_id=org.id,
            )
            session.add(st)
            stylist_objs.append(st)

        await session.flush()

        morning = OrgShift(
            org_id=org.id,
            name="Morning Shift",
            data={"windows": [["09:00", "13:30"]], "breaks": [["11:15", "11:30"]]},
        )
        afternoon = OrgShift(
            org_id=org.id,
            name="Afternoon Shift",
            data={"windows": [["13:30", "19:00"]], "breaks": [["16:00", "16:15"]]},
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

        services = []
        for cat_name, s_name, s_desc, price, duration, img_url in org_def["services"]:
            category = categories.get(cat_name) or categories["Hair"]
            cover = allocate_cover(img_url)
            secondary = (
                SERVICE_COVER_IMAGES[(cover_index) % len(SERVICE_COVER_IMAGES)]
                if SERVICE_COVER_IMAGES
                else cover
            )
            srv = Service(
                service_category_id=category.id,
                organization_id=org.id,
                name=s_name,
                description=s_desc,
                images={
                    "cover": cover,
                    "additional": [cover, secondary],
                },
                base_price=price,
                duration_minutes=duration,
                status=ServiceStatus.ACTIVE,
                cancellation_policy_id=policy.id,
                simultaneous_capacity=1,
            )
            session.add(srv)
            services.append(srv)

        await session.flush()

        for srv in services:
            session.add(ServiceGiving(service_id=srv.id, user_id=stylist_objs[0].id))
            session.add(ServiceGiving(service_id=srv.id, user_id=stylist_objs[1].id))

        org_data = {
            "org": org,
            "owner": owner,
            "reception": reception,
            "stylists": stylist_objs,
            "services": services,
            "policy": policy,
        }
        org_data_list.append(org_data)
        logger.info("Seeded organization %s with %s services", org.name, len(services))

    return org_data_list


async def seed_clients_and_bookings(session: AsyncSession, org_data_list: list[dict]) -> None:
    client_a = _user(
        email="client@example.com",
        role=UserRole.CLIENT,
        first_name="Ada",
        last_name="Client",
        phone="+15551230001",
        picture=AVATAR_IMAGES[0],
    )
    client_b = _user(
        email="client2@example.com",
        role=UserRole.CLIENT,
        first_name="Baye",
        last_name="Client",
        phone="+15551230002",
        picture=AVATAR_IMAGES[1],
    )
    session.add_all([client_a, client_b])
    await session.flush()

    # Create bookings across primary organization (Selam)
    selam_data = org_data_list[0]
    org = selam_data["org"]
    services = selam_data["services"]
    stylist = selam_data["stylists"][0]
    starts = datetime.now(UTC).replace(minute=0, second=0, microsecond=0) + timedelta(
        days=2, hours=2
    )

    confirmed_client_a = Booking(
        org_id=org.id,
        client_id=client_a.id,
        stylist_id=stylist.id,
        starts_at=starts,
        ends_at=starts + timedelta(minutes=services[0].duration_minutes),
        status=BookingStatus.CONFIRMED,
        total_price=services[0].base_price,
        commission_snapshot={
            "type": "percentage",
            "percentage": "5.0000",
            "amount": str(round(services[0].base_price * Decimal("0.05"), 2)),
        },
        customer_notes="First visit — prefer quiet station",
    )
    session.add(confirmed_client_a)
    await session.flush()
    session.add(
        BookingService(
            booking_id=confirmed_client_a.id,
            service_id=services[0].id,
            base_price=services[0].base_price,
        )
    )

    terms_a = "I authorize a PayPal hold for this booking under the salon cancellation policy."
    terms_hash_a, signature_a = build_consent_signature(terms_a)
    session.add(
        Consent(
            booking_id=confirmed_client_a.id,
            client_id=client_a.id,
            terms_version="v1",
            terms_text_hash=terms_hash_a,
            signature_b64=signature_a,
            signed_payload=f"booking={confirmed_client_a.id};accepted=true",
        )
    )
    session.add(
        PaymentHold(
            booking_id=confirmed_client_a.id,
            org_id=org.id,
            paypal_order_id=f"SEED-ORDER-{confirmed_client_a.id}",
            paypal_authorization_id=f"SEED-AUTH-{confirmed_client_a.id}",
            amount=confirmed_client_a.total_price,
            currency="USD",
            status=PaymentHoldStatus.AUTHORIZED,
            honor_expires_at=datetime.now(UTC) + timedelta(days=3),
            idempotency_key=f"seed-hold-{confirmed_client_a.id}",
        )
    )

    confirmed_start = starts + timedelta(days=1)
    confirmed = Booking(
        org_id=org.id,
        client_id=client_b.id,
        stylist_id=selam_data["stylists"][1].id,
        starts_at=confirmed_start,
        ends_at=confirmed_start + timedelta(minutes=services[1].duration_minutes),
        status=BookingStatus.CONFIRMED,
        total_price=services[1].base_price,
        commission_snapshot={
            "type": "percentage",
            "percentage": "5.0000",
            "amount": str(round(services[1].base_price * Decimal("0.05"), 2)),
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
            org_data_list = await seed_organizations(session, platform)
            await seed_clients_and_bookings(session, org_data_list)
            await session.commit()

        logger.info(
            "Seed complete! Created %s organizations and %s services.",
            len(org_data_list),
            sum(len(d["services"]) for d in org_data_list),
        )
        logger.info("Default password for all users: %s", DEFAULT_PASSWORD)
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
