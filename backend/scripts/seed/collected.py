"""Turn collected Ethiopia and United States listings into seed organizations.

Missing photos, coordinates, addresses, prices, durations, and service menus are
filled so every salon can be booked. Every organization gets an owner, a
receptionist, and two stylists. They all sign in with the shared demo password.
"""

from __future__ import annotations

import json
import re
from decimal import Decimal
from pathlib import Path

from .images import AVATAR_IMAGES, SERVICE_COVER_IMAGES

DATA_DIR = Path(__file__).resolve().parent / "data"

# PayPal sandbox merchants linked to the first demo organizations (hackathon judges).
PAYPAL_SANDBOX_MERCHANT_OVERRIDES: tuple[dict[str, str], ...] = (
    {
        "merchant_id": "VFP4W4G9ZGRHA",
        "merchant_email": "merchent-two4113@business.example.com",
    },
    {
        "merchant_id": "H2BNRFRFXM8BA",
        "merchant_email": "merchant330@business.example.com",
    },
)
SOURCE_FILES = (
    "ethiopia-addis-ababa-salons.json",
    "ethiopia-other-cities-salons.json",
    "united-states-top10-cities-salons.json",
)

ORG_CATEGORY = {
    "beauty_salon": "Hair",
    "hair_salon": "Hair",
    "barbershop": "Barber",
    "nail_salon": "Nails",
    "spa": "Spa",
    "massage": "Spa",
    "facial": "Facial",
    "skincare": "Facial",
    "braids": "Braids",
    "lashes_brows": "Lashes & Brows",
    "makeup": "Makeup",
    "wellness": "Wellness",
}

SERVICE_LABEL = {
    "blowout & styling services": "Hair",
    "curly hair services": "Hair",
    "hair": "Hair",
    "hair services": "Hair",
    "color services": "Color",
    "color": "Color",
    "barber": "Barber",
    "nails": "Nails",
    "nails enhancement": "Nails",
    "manicure": "Nails",
    "pedicure": "Nails",
    "spa": "Spa",
    "massage": "Spa",
    "waxing": "Spa",
    "facial": "Facial",
    "facials": "Facial",
    "skincare": "Facial",
    "braids": "Braids",
    "lashes": "Lashes & Brows",
    "eyelashes": "Lashes & Brows",
    "lashes_brows": "Lashes & Brows",
    "makeup": "Makeup",
    "wellness": "Wellness",
}

NAME_KEYWORDS: tuple[tuple[tuple[str, ...], str], ...] = (
    (("balayage", "highlight", "toner", "gloss", "ombre", "color"), "Color"),
    (("beard", "fade", "shave", "barber", "lineup"), "Barber"),
    (("nail", "manicure", "pedicure", "acrylic", "gel polish"), "Nails"),
    (("massage", "scrub", "body wrap", "sauna"), "Spa"),
    (("facial", "hydra", "peel", "dermaplan"), "Facial"),
    (("braid", "cornrow", "faux loc", "twist"), "Braids"),
    (("lash", "brow", "eyebrow", "eyelash"), "Lashes & Brows"),
    (("makeup", "bridal", "glam"), "Makeup"),
    (("wax",), "Spa"),
)

# (category, name, description, usd price, etb price, minutes)
DEFAULT_MENUS: dict[str, list[tuple[str, str, str, str, str, int]]] = {
    "Hair": [
        (
            "Hair",
            "Signature Haircut",
            "Consultation, shampoo, cut, and finish.",
            "48.00",
            "800.00",
            60,
        ),
        (
            "Hair",
            "Blowout and Style",
            "Wash, treatment, and round-brush finish.",
            "55.00",
            "900.00",
            45,
        ),
        ("Color", "Root Touch-Up", "Regrowth color finished with a gloss.", "70.00", "1500.00", 75),
    ],
    "Barber": [
        ("Barber", "Skin Fade", "Taper fade, blend, and edge lineup.", "32.00", "400.00", 40),
        ("Barber", "Beard Sculpt", "Shape-up with hot towel and balm.", "22.00", "300.00", 30),
        (
            "Barber",
            "Hot Towel Shave",
            "Straight-razor shave and cold towel finish.",
            "35.00",
            "450.00",
            35,
        ),
    ],
    "Nails": [
        ("Nails", "Gel Manicure", "Cuticle care, shape, and gel polish.", "35.00", "500.00", 45),
        ("Nails", "Spa Pedicure", "Soak, exfoliation, massage, and polish.", "48.00", "700.00", 50),
        ("Nails", "Gel Extensions", "Full soft-gel extension set.", "65.00", "1200.00", 75),
    ],
    "Spa": [
        ("Spa", "Swedish Massage", "Full-body relaxation massage.", "85.00", "1500.00", 60),
        ("Spa", "Deep Tissue Massage", "Focused work for tight muscles.", "95.00", "1800.00", 60),
        ("Spa", "Body Polish", "Exfoliation followed by a moisturizer.", "70.00", "1200.00", 50),
    ],
    "Facial": [
        (
            "Facial",
            "Glow Facial",
            "Cleanse, exfoliation, and hydrating mask.",
            "80.00",
            "1400.00",
            50,
        ),
        (
            "Facial",
            "Acne Clarifying Facial",
            "Extraction and calming treatment.",
            "90.00",
            "1600.00",
            60,
        ),
        ("Facial", "Express Facial", "Cleanse, tone, and moisturizer.", "55.00", "900.00", 30),
    ],
    "Braids": [
        (
            "Braids",
            "Knotless Braids",
            "Medium knotless braids with curled ends.",
            "180.00",
            "2500.00",
            180,
        ),
        ("Braids", "Cornrows", "Neat stitch cornrows.", "80.00", "900.00", 90),
        ("Braids", "Twist Style", "Two-strand twists with scalp oil.", "120.00", "1500.00", 120),
    ],
    "Lashes & Brows": [
        (
            "Lashes & Brows",
            "Classic Lash Set",
            "Individual classic lash extensions.",
            "85.00",
            "1200.00",
            90,
        ),
        (
            "Lashes & Brows",
            "Lash Fill",
            "Two-week fill for an existing set.",
            "55.00",
            "700.00",
            60,
        ),
        ("Lashes & Brows", "Brow Lamination", "Brow lift, tint, and shape.", "60.00", "800.00", 45),
    ],
    "Makeup": [
        ("Makeup", "Event Glam", "Full-face makeup for an evening event.", "95.00", "1800.00", 60),
        (
            "Makeup",
            "Bridal Makeup",
            "Long-wear bridal makeup with lashes.",
            "150.00",
            "3000.00",
            75,
        ),
        ("Makeup", "Soft Day Makeup", "Natural makeup with brow grooming.", "70.00", "1200.00", 45),
    ],
    "Wellness": [
        (
            "Wellness",
            "Aromatherapy Session",
            "Guided relaxation with essential oils.",
            "60.00",
            "900.00",
            45,
        ),
        (
            "Wellness",
            "Scalp Treatment",
            "Massage and oil treatment for the scalp.",
            "45.00",
            "700.00",
            30,
        ),
        (
            "Spa",
            "Neck and Shoulder Relief",
            "Focused massage for desk tension.",
            "40.00",
            "600.00",
            30,
        ),
    ],
    "Color": [
        (
            "Color",
            "Full Color",
            "Single-process color from roots to ends.",
            "110.00",
            "2200.00",
            90,
        ),
        (
            "Color",
            "Partial Highlights",
            "Face-framing highlights and toner.",
            "150.00",
            "2800.00",
            120,
        ),
        (
            "Hair",
            "Gloss and Blowout",
            "Shine treatment with a style finish.",
            "65.00",
            "1100.00",
            45,
        ),
    ],
}

FALLBACK_PRICE = {"USD": Decimal("45.00"), "ETB": Decimal("750.00")}
FALLBACK_MINUTES = {
    "Hair": 60,
    "Color": 90,
    "Barber": 40,
    "Nails": 45,
    "Spa": 60,
    "Facial": 50,
    "Braids": 120,
    "Lashes & Brows": 75,
    "Makeup": 60,
    "Wellness": 45,
}

CITY_COORDS: dict[tuple[str, str], tuple[str, str]] = {
    ("Ethiopia", "Addis Ababa"): ("9.0300000", "38.7400000"),
    ("Ethiopia", "Dire Dawa"): ("9.5931000", "41.8661000"),
    ("Ethiopia", "Hawassa"): ("7.0504000", "38.4955000"),
    ("Ethiopia", "Adama"): ("8.5410000", "39.2683000"),
    ("Ethiopia", "Bahir Dar"): ("11.5742000", "37.3614000"),
    ("Ethiopia", "Mekelle"): ("13.4967000", "39.4753000"),
    ("Ethiopia", "Jimma"): ("7.6734000", "36.8344000"),
    ("Ethiopia", "Jijiga"): ("9.3500000", "42.8000000"),
    ("Ethiopia", "Gondar"): ("12.6030000", "37.4521000"),
    ("Ethiopia", "Bishoftu"): ("8.7523000", "38.9785000"),
    ("Ethiopia", "Nekemte"): ("9.0833000", "36.5500000"),
    ("Ethiopia", "Shashemene"): ("7.2004000", "38.6035000"),
    ("Ethiopia", "Dessie"): ("11.1333000", "39.6333000"),
    ("United States", "New York"): ("40.7128000", "-74.0060000"),
    ("United States", "Los Angeles"): ("34.0522000", "-118.2437000"),
    ("United States", "Chicago"): ("41.8781000", "-87.6298000"),
    ("United States", "Houston"): ("29.7604000", "-95.3698000"),
    ("United States", "Phoenix"): ("33.4484000", "-112.0740000"),
    ("United States", "Philadelphia"): ("39.9526000", "-75.1652000"),
    ("United States", "San Antonio"): ("29.4241000", "-98.4936000"),
    ("United States", "San Diego"): ("32.7157000", "-117.1611000"),
    ("United States", "Dallas"): ("32.7767000", "-96.7970000"),
    ("United States", "San Jose"): ("37.3382000", "-121.8863000"),
}

STATE_TIMEZONES = {
    "New York": "America/New_York",
    "Pennsylvania": "America/New_York",
    "California": "America/Los_Angeles",
    "Illinois": "America/Chicago",
    "Texas": "America/Chicago",
    "Arizona": "America/Phoenix",
}

ETH_FIRST = ("Abel", "Hanna", "Meron", "Kidist", "Selam", "Dawit", "Sara", "Yared")
ETH_LAST = ("Bekele", "Tadesse", "Alemu", "Haile", "Kebede", "Tesfaye", "Girma", "Desta")
US_FIRST = ("Ava", "Noah", "Mia", "Liam", "Sofia", "Ethan", "Amelia", "James")
US_LAST = ("Carter", "Nguyen", "Brooks", "Patel", "Reed", "Diaz", "Coleman", "Walsh")

CATEGORY_BLURB = {
    "beauty_salon": "beauty salon",
    "hair_salon": "hair studio",
    "barbershop": "barbershop",
    "nail_salon": "nail studio",
    "spa": "spa",
    "massage": "massage studio",
    "facial": "facial studio",
    "skincare": "skincare studio",
    "braids": "braiding studio",
    "lashes_brows": "lash and brow studio",
    "makeup": "makeup studio",
    "wellness": "wellness studio",
}


def _slug(name: str) -> str:
    compact = re.sub(r"[^a-z0-9]+", "", name.lower())
    return (compact or "salon")[:32]


def _clip(value: str | None, limit: int) -> str:
    text = " ".join((value or "").split())
    return text[:limit]


def _decimal(value: str | int | float | Decimal) -> Decimal:
    amount = Decimal(str(value)).quantize(Decimal("0.01"))
    if amount <= 0:
        raise ValueError("price must be positive")
    if amount > Decimal("999999.99"):
        return Decimal("999999.99")
    return amount


def _coord(value: str | float, *, nudge: Decimal) -> Decimal:
    point = (Decimal(str(value)) + nudge).quantize(Decimal("0.0000001"))
    return point


def _platform_category(raw: str | None, fallback: str) -> str:
    label = (raw or "").strip().lower()
    if label in SERVICE_LABEL:
        return SERVICE_LABEL[label]
    if label in ORG_CATEGORY:
        return ORG_CATEGORY[label]
    for words, category in NAME_KEYWORDS:
        if any(word in label for word in words):
            return category
    return fallback


def _category_from_service(service: dict, org_category: str) -> str:
    fallback = ORG_CATEGORY.get(org_category, "Hair")
    labeled = _platform_category(service.get("category"), fallback)
    if labeled != fallback or (service.get("category") or "").strip():
        named = _platform_category(service.get("name"), labeled)
        if (service.get("category") or "").strip().lower() in {
            "featured",
            "add ons",
            "addons",
            "treatments",
        }:
            return named
        return labeled
    return _platform_category(service.get("name"), fallback)


def _price(service: dict, category: str, currency: str) -> Decimal:
    raw = service.get("price")
    if raw not in (None, "", 0):
        try:
            return _decimal(raw)
        except (ArithmeticError, ValueError):
            pass
    menu = DEFAULT_MENUS.get(category) or DEFAULT_MENUS["Hair"]
    usd, etb = menu[0][3], menu[0][4]
    return _decimal(etb if currency == "ETB" else usd)


def _minutes(service: dict, category: str) -> int:
    raw = service.get("duration_minutes")
    try:
        minutes = int(raw) if raw not in (None, "") else 0
    except (TypeError, ValueError):
        minutes = 0
    if minutes <= 0:
        minutes = FALLBACK_MINUTES.get(category, 45)
    return min(minutes, 480)


def _cover(index: int) -> str:
    if not SERVICE_COVER_IMAGES:
        return ""
    return SERVICE_COVER_IMAGES[index % len(SERVICE_COVER_IMAGES)]


def _avatar(index: int) -> str:
    return AVATAR_IMAGES[index % len(AVATAR_IMAGES)]


def _load_rows() -> list[dict]:
    rows: list[dict] = []
    for filename in SOURCE_FILES:
        payload = json.loads((DATA_DIR / filename).read_text())
        rows.extend(payload)
    return rows


def _address(row: dict) -> str:
    listed = _clip(row.get("address"), 512)
    if listed:
        return listed
    parts = [
        row.get("neighborhood"),
        row.get("sub_city"),
        row.get("city"),
        row.get("state"),
        row.get("country"),
    ]
    seen: list[str] = []
    for part in parts:
        text = _clip(part, 200)
        if text and text not in seen:
            seen.append(text)
    return _clip(", ".join(seen), 512) or "Addis Ababa, Ethiopia"


def _coordinates(row: dict, index: int) -> tuple[Decimal, Decimal]:
    nudge = (Decimal(index % 17) - Decimal(8)) * Decimal("0.0015")
    lat = row.get("latitude")
    lng = row.get("longitude")
    if lat is None or lng is None:
        key = (row.get("country") or "", row.get("city") or "")
        lat_text, lng_text = CITY_COORDS.get(key, ("9.0300000", "38.7400000"))
        lat = lat if lat is not None else lat_text
        lng = lng if lng is not None else lng_text
    return _coord(lat, nudge=nudge), _coord(lng, nudge=nudge / 2)


def _description(row: dict) -> str:
    existing = _clip(row.get("description"), 2000)
    if existing:
        return existing
    kind = CATEGORY_BLURB.get(row.get("category") or "", "beauty studio")
    place = row.get("neighborhood") or row.get("sub_city") or row.get("city") or row.get("country")
    return f"{row['name']} is a {kind} in {place}."


def _phone(existing: str | None, index: int, *, ethiopia: bool) -> str:
    digits = re.sub(r"[^\d+]", "", existing or "")
    if len(digits) >= 8:
        return digits[:50]
    if ethiopia:
        return f"+251911{index:06d}"[:50]
    return f"+1212555{index:04d}"[:50]


def _timezone(row: dict) -> str:
    if row.get("country") == "Ethiopia":
        return "Africa/Addis_Ababa"
    return STATE_TIMEZONES.get(row.get("state") or "", "America/New_York")


def _currency(row: dict) -> str:
    code = (row.get("currency") or "").upper()
    return (
        code if code in {"USD", "ETB"} else ("ETB" if row.get("country") == "Ethiopia" else "USD")
    )


def _staff(
    index: int, *, ethiopia: bool
) -> tuple[tuple[str, str], tuple[str, str], tuple[str, str], tuple[str, str]]:
    first = ETH_FIRST if ethiopia else US_FIRST
    last = ETH_LAST if ethiopia else US_LAST

    def person(slot: int) -> tuple[str, str]:
        cursor = index * 4 + slot
        return first[cursor % len(first)], last[cursor % len(last)]

    return person(0), person(1), person(2), person(3)


def _services(row: dict, org_category: str, currency: str, index: int) -> list[tuple]:
    raw_services = row.get("services") or []
    built: list[tuple] = []
    seen: set[tuple[str, str]] = set()
    for offset, service in enumerate(raw_services):
        name = _clip(service.get("name"), 255)
        if not name:
            continue
        category = _category_from_service(service, org_category)
        price = _price(service, category, currency)
        key = (name.casefold(), str(price))
        if key in seen:
            continue
        seen.add(key)
        description = _clip(service.get("description"), 2000) or f"{name} at {row['name']}."
        built.append(
            (
                category,
                name,
                description,
                price,
                _minutes(service, category),
                _cover(index + offset + 1),
            )
        )
    if built:
        return built

    platform = ORG_CATEGORY.get(org_category, "Hair")
    menu = DEFAULT_MENUS.get(platform, DEFAULT_MENUS["Hair"])
    for offset, (category, name, description, usd, etb, minutes) in enumerate(menu):
        price = _decimal(etb if currency == "ETB" else usd)
        built.append((category, name, description, price, minutes, _cover(index + offset + 1)))
    return built


def build_organizations() -> list[dict]:
    """Return organization rows in the shape ``seed_organizations`` inserts."""
    definitions: list[dict] = []
    used_slugs: set[str] = set()
    for index, row in enumerate(_load_rows()):
        ethiopia = row.get("country") == "Ethiopia"
        base_slug = _slug(row.get("name") or "salon")
        slug = base_slug
        suffix = 2
        while slug in used_slugs:
            slug = f"{base_slug[:28]}{suffix}"
            suffix += 1
        used_slugs.add(slug)

        owner, reception, stylist_a, stylist_b = _staff(index, ethiopia=ethiopia)
        currency = _currency(row)
        org_category = row.get("category") or "beauty_salon"
        phone = _phone(row.get("phone"), index, ethiopia=ethiopia)
        lat, lng = _coordinates(row, index)
        definitions.append(
            {
                "name": _clip(row.get("name"), 255) or f"Salon {index + 1}",
                "description": _description(row),
                "picture": _cover(index),
                "address": _address(row),
                "lat": lat,
                "lng": lng,
                "timezone": _timezone(row),
                "currency": currency,
                "owner_email": f"owner@{slug}.local",
                "owner_name": owner,
                "owner_phone": phone,
                "owner_picture": _avatar(index),
                "reception_email": f"reception@{slug}.local",
                "reception_name": reception,
                "reception_phone": _phone(None, index + 1000, ethiopia=ethiopia),
                "reception_picture": _avatar(index + 1),
                "stylists": [
                    (
                        f"stylist1@{slug}.local",
                        stylist_a,
                        _phone(None, index + 2000, ethiopia=ethiopia),
                        _avatar(index + 2),
                    ),
                    (
                        f"stylist2@{slug}.local",
                        stylist_b,
                        _phone(None, index + 3000, ethiopia=ethiopia),
                        _avatar(index + 3),
                    ),
                ],
                "merchant_id": f"DEMO-{index + 1:04d}-{slug.upper()}"[:100],
                "merchant_email": f"payments@{slug}.local",
                "services": _services(row, org_category, currency, index),
            }
        )
        if index < len(PAYPAL_SANDBOX_MERCHANT_OVERRIDES):
            definitions[-1].update(PAYPAL_SANDBOX_MERCHANT_OVERRIDES[index])
    return definitions
