import uuid
from datetime import UTC, datetime

from app.schemas.organization import (
    CatalogOrganizationOut,
    OrgEmployeeShiftCreate,
    OrgEmployeeShiftOut,
    OrgShiftCreate,
    OrgShiftOut,
)


def test_shift_create_and_out_schemas():
    shift_id = uuid.uuid4()
    org_id = uuid.uuid4()

    create = OrgShiftCreate(name="Morning Shift", data={"windows": [["09:00", "15:00"]]})
    assert create.name == "Morning Shift"
    assert create.data["windows"] == [["09:00", "15:00"]]

    out = OrgShiftOut(
        id=shift_id,
        org_id=org_id,
        name="Morning Shift",
        data={"windows": [["09:00", "15:00"]]},
    )
    assert out.id == shift_id
    assert out.org_id == org_id
    assert out.name == "Morning Shift"


def test_employee_shift_assignment_schemas():
    assignment_id = uuid.uuid4()
    user_id = uuid.uuid4()
    shift_id = uuid.uuid4()
    now = datetime.now(UTC)

    create = OrgEmployeeShiftCreate(user_id=user_id, org_shift_id=shift_id)
    assert create.user_id == user_id
    assert create.org_shift_id == shift_id

    out = OrgEmployeeShiftOut(
        id=assignment_id,
        user_id=user_id,
        org_shift_id=shift_id,
        created_at=now,
        employee_name="Jane Stylist",
        employee_email="jane@example.com",
        shift_name="Morning Shift",
        shift_data={"windows": [["09:00", "15:00"]]},
    )
    assert out.id == assignment_id
    assert out.employee_name == "Jane Stylist"
    assert out.shift_name == "Morning Shift"
    assert out.shift_data["windows"] == [["09:00", "15:00"]]


def test_catalog_organization_out_with_working_hours_and_distance():
    org_id = uuid.uuid4()
    now = datetime.now(UTC)

    weekly_hours = {
        "mon": [["09:00", "18:00"]],
        "tue": [["09:00", "18:00"]],
        "wed": [["09:00", "18:00"]],
        "thu": [["09:00", "18:00"]],
        "fri": [["09:00", "18:00"]],
        "sat": [["10:00", "16:00"]],
        "sun": [],
    }

    org_out = CatalogOrganizationOut(
        id=org_id,
        name="Luxe Atelier",
        description="Boutique hair styling studio",
        picture="https://example.com/salon.jpg",
        status="approved",
        created_at=now,
        physical_address="123 Luxury Ave, Beverly Hills, CA 90210",
        lat=34.0736,
        lng=-118.4004,
        timezone="America/Los_Angeles",
        service_count=8,
        rating_avg=4.95,
        review_count=42,
        distance_km=1.25,
        working_hours=weekly_hours,
    )

    assert org_out.id == org_id
    assert org_out.name == "Luxe Atelier"
    assert float(org_out.lat) == 34.0736
    assert float(org_out.lng) == -118.4004
    assert org_out.distance_km == 1.25
    assert org_out.working_hours["sat"] == [["10:00", "16:00"]]
    assert org_out.working_hours["sun"] == []
