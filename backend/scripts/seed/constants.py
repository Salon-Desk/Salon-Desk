"""Shared demo-seed values that are not catalog rows."""

from decimal import Decimal

DEFAULT_PASSWORD = "Password123!"

PLATFORM_ADMIN_EMAIL = "admin@salondesk.local"
PLATFORM_STAFF_EMAIL = "staff@salondesk.local"

CATEGORY_DEFINITIONS: list[tuple[str, str]] = [
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

DEFAULT_TIMEZONE = "Africa/Addis_Ababa"
DEFAULT_CURRENCY = "USD"
DEFAULT_COMMISSION_RATE = Decimal("5.0000")
COMMISSION_FRACTION = Decimal("0.05")

DEFAULT_WORKING_HOURS = {
    "mon": [["09:00", "18:00"]],
    "tue": [["09:00", "18:00"]],
    "wed": [["09:00", "18:00"]],
    "thu": [["09:00", "18:00"]],
    "fri": [["09:00", "19:00"]],
    "sat": [["09:00", "17:00"]],
    "sun": [["10:00", "15:00"]],
}

MORNING_SHIFT_NAME = "Morning Shift"
MORNING_SHIFT_DATA = {"windows": [["09:00", "13:30"]], "breaks": [["11:15", "11:30"]]}
AFTERNOON_SHIFT_NAME = "Afternoon Shift"
AFTERNOON_SHIFT_DATA = {"windows": [["13:30", "19:00"]], "breaks": [["16:00", "16:15"]]}

CANCELLATION_POLICY_NAME = "Standard 24h Policy"
CONSENT_TERMS = "I authorize a PayPal hold for this booking under the salon cancellation policy."
CONSENT_TERMS_VERSION = "v1"

FALLBACK_SERVICE_CATEGORY = "Hair"
