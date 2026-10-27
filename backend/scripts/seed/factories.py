"""Factory functions for seed data creation."""

from __future__ import annotations

from copy import deepcopy
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking import Booking, BookingService
from app.models.enums import (
    BookingStatus,
    OrgAccountStatus,
    PaymentHoldStatus,
)
from app.models.ledger import PlatformCommission
from app.models.organization import (
    Organization,
    OrgEmployeeShift,
    OrgSettings,
    OrgShift,
)
from app.models.payment import OrgAccount, PaymentHold
from app.models.policy import Consent, OrgCancellationPolicy
from app.models.service import Service, ServiceGiving
from app.models.user import User
from app.services.auth_service import DEFAULT_CANCELLATION_POLICY
from app.services.ledger_service import build_consent_signature

from .constants import (
    AFTERNOON_SHIFT_DATA,
    AFTERNOON_SHIFT_NAME,
    COMMISSION_FRACTION,
    CONSENT_TERMS,
    CONSENT_TERMS_VERSION,
    DEFAULT_COMMISSION_RATE,
    DEFAULT_WORKING_HOURS,
    MORNING_SHIFT_DATA,
    MORNING_SHIFT_NAME,
)
from .helpers import build_user
from .images import AVATAR_IMAGES


async def create_platform_users(session: AsyncSession):
    """Create platform admin and staff users."""
    from app.models.enums import UserRole

    from .constants import PLATFORM_ADMIN_EMAIL, PLATFORM_STAFF_EMAIL

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
    return admin, staff


async def create_categories_and_commissions(session: AsyncSession, categories_data):
    """Create service categories and default commission rules."""
    from app.models.enums import PlatformCommissionType
    from app.models.service import ServiceCategory

    categories = [
        ServiceCategory(name=name, description=description) for name, description in categories_data
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

    return categories, commissions


async def create_organization_with_settings(
    session: AsyncSession,
    org_def: dict,
    owner: User,
    policy: OrgCancellationPolicy,
):
    """Create an organization with settings, shifts, and employees."""
    from app.models.enums import OrganizationStatus

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

    policy.org_id = org.id
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
            approved_by=owner.id,
        )
    )

    return org


async def create_organization_employees(
    session: AsyncSession,
    org: Organization,
    org_def: dict,
    policy: OrgCancellationPolicy,
):
    """Create reception and stylist employees for an organization."""
    from app.models.enums import UserRole

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

    # Create shifts
    morning = OrgShift(org_id=org.id, name=MORNING_SHIFT_NAME, data=deepcopy(MORNING_SHIFT_DATA))
    afternoon = OrgShift(
        org_id=org.id, name=AFTERNOON_SHIFT_NAME, data=deepcopy(AFTERNOON_SHIFT_DATA)
    )
    session.add_all([morning, afternoon])
    await session.flush()

    # Assign shifts to employees
    session.add_all(
        [
            OrgEmployeeShift(user_id=stylist_objs[0].id, org_shift_id=morning.id),
            OrgEmployeeShift(user_id=stylist_objs[1].id, org_shift_id=afternoon.id),
            OrgEmployeeShift(user_id=reception.id, org_shift_id=morning.id),
        ]
    )

    return reception, stylist_objs


async def create_organization_services(
    session: AsyncSession,
    org: Organization,
    org_def: dict,
    policy: OrgCancellationPolicy,
    stylist_objs: list[User],
    categories_dict: dict,
    covers,
    services_to_seed,
):
    """Create services for an organization."""
    from app.models.enums import ServiceStatus

    from .constants import FALLBACK_SERVICE_CATEGORY

    services = []
    for category_name, name, description, price, duration, image_url in services_to_seed:
        category = categories_dict.get(category_name) or categories_dict[FALLBACK_SERVICE_CATEGORY]
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

    await session.flush()

    # Assign services to stylists
    for service in services:
        session.add(ServiceGiving(service_id=service.id, user_id=stylist_objs[0].id))
        session.add(ServiceGiving(service_id=service.id, user_id=stylist_objs[1].id))

    return services


async def create_booking_with_hold(
    session: AsyncSession,
    org: Organization,
    client: User,
    stylist: User,
    service,
    starts_at: datetime,
    customer_notes: str | None,
    currency: str,
):
    """Create a booking with authorized hold."""

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

    return booking
