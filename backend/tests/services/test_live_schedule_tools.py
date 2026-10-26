import json
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.ai.tools.booking_lookup import build_lookup_tools
from app.ai.tools.schedule_tools import build_schedule_tools, parse_query_date
from app.models.enums import OrganizationStatus
from app.schemas.booking import AvailabilityOut, TimeSlot
from app.services.availability_service import resolve_org_timezone


def fake_function_tool():
    def decorator(fn):
        return fn

    return decorator


def test_parse_query_date():
    tz = resolve_org_timezone("UTC")
    d_tomorrow = parse_query_date("tomorrow", tz)
    assert d_tomorrow == (datetime.now(UTC) + timedelta(days=1)).date()

    d_today = parse_query_date("today", tz)
    assert d_today == datetime.now(UTC).date()


@pytest.mark.asyncio
async def test_schedule_tools_get_available_slots():
    session_factory = MagicMock()
    mock_session = AsyncMock()
    session_factory.return_value.__aenter__.return_value = mock_session

    org_id = uuid4()
    svc_id = uuid4()

    mock_org = MagicMock()
    mock_org.id = org_id
    mock_org.name = "Lovely Beauty Spa"

    mock_service = MagicMock()
    mock_service.id = svc_id
    mock_service.name = "Swedish Massage"
    mock_service.organization_id = org_id
    mock_service.organization = mock_org

    mock_settings = MagicMock()
    mock_settings.timezone = "UTC"
    mock_settings.physical_address = "456 Serenity Way"
    mock_settings.working_hours = {"mon": [["09:00", "18:00"]]}

    slot1 = TimeSlot(
        starts_at=datetime(2026, 10, 26, 10, 0, tzinfo=UTC),
        ends_at=datetime(2026, 10, 26, 11, 0, tzinfo=UTC),
        available=True,
    )
    slot2 = TimeSlot(
        starts_at=datetime(2026, 10, 26, 14, 0, tzinfo=UTC),
        ends_at=datetime(2026, 10, 26, 15, 0, tzinfo=UTC),
        available=True,
    )

    mock_avail = AvailabilityOut(
        timezone="UTC",
        day="2026-10-26",
        open_windows=[["09:00", "18:00"]],
        slots=[slot1, slot2],
    )

    settings_exec = MagicMock()
    settings_exec.scalar_one_or_none.return_value = mock_settings
    mock_session.execute.return_value = settings_exec

    tools = build_schedule_tools(session_factory, function_tool=fake_function_tool)
    get_available_slots, check_time_slot = tools

    with (
        patch(
            "app.ai.tools.schedule_tools.resolve_service",
            new_callable=AsyncMock,
            return_value=mock_service,
        ),
        patch(
            "app.ai.tools.schedule_tools.get_availability",
            new_callable=AsyncMock,
            return_value=mock_avail,
        ),
    ):
        res = await get_available_slots(service_query="Swedish Massage", day="2026-10-26")
        data = json.loads(res)
        assert data["status"] == "success"
        assert data["organization_name"] == "Lovely Beauty Spa"
        assert data["service_name"] == "Swedish Massage"
        assert data["available_slots_count"] == 2
        assert "10:00 AM" in data["available_slots"]
        assert "2:00 PM" in data["available_slots"]


@pytest.mark.asyncio
async def test_schedule_tools_check_time_slot():
    session_factory = MagicMock()
    mock_session = AsyncMock()
    session_factory.return_value.__aenter__.return_value = mock_session

    org_id = uuid4()
    svc_id = uuid4()

    mock_org = MagicMock()
    mock_org.id = org_id
    mock_org.name = "Lovely Beauty Spa"

    mock_service = MagicMock()
    mock_service.id = svc_id
    mock_service.name = "Swedish Massage"
    mock_service.duration_minutes = 60
    mock_service.organization_id = org_id
    mock_service.organization = mock_org

    mock_settings = MagicMock()
    mock_settings.timezone = "UTC"

    settings_exec = MagicMock()
    settings_exec.scalar_one_or_none.return_value = mock_settings
    mock_session.execute.return_value = settings_exec

    tools = build_schedule_tools(session_factory, function_tool=fake_function_tool)
    _get_available_slots, check_time_slot = tools

    with (
        patch(
            "app.ai.tools.schedule_tools.resolve_service",
            new_callable=AsyncMock,
            return_value=mock_service,
        ),
        patch(
            "app.ai.tools.schedule_tools.check_slot_available",
            new_callable=AsyncMock,
            return_value=True,
        ),
    ):
        res = await check_time_slot(
            service_query="Swedish Massage", time_expression="2026-10-26T14:00:00Z"
        )
        data = json.loads(res)
        assert data["status"] == "available"
        assert data["available"] is True
        assert "Lovely Beauty Spa" in data["message"]


@pytest.mark.asyncio
async def test_booking_lookup_organization_details_with_live_settings():
    session_factory = MagicMock()
    mock_session = AsyncMock()
    session_factory.return_value.__aenter__.return_value = mock_session

    org_id = uuid4()
    mock_org = MagicMock()
    mock_org.id = org_id
    mock_org.name = "Lovely Beauty Spa"
    mock_org.description = "Top rated spa"
    mock_org.status = OrganizationStatus.APPROVED
    mock_org.picture = None
    mock_org.physical_address = "Fallback Addr"

    mock_settings = MagicMock()
    mock_settings.timezone = "America/New_York"
    mock_settings.physical_address = "456 Serenity Way"
    mock_settings.working_hours = {"mon": [["09:00", "18:00"]]}

    mock_service = MagicMock()
    mock_service.id = uuid4()
    mock_service.name = "Swedish Massage"
    mock_service.base_price = 85.00
    mock_service.duration_minutes = 60
    mock_service.category = MagicMock()
    mock_service.category.name = "Spa"
    mock_service.description = "Relaxing full body"

    settings_exec = MagicMock()
    settings_exec.scalar_one_or_none.return_value = mock_settings

    svc_exec = MagicMock()
    svc_exec.scalars.return_value.all.return_value = [mock_service]

    # First call returns settings, second returns services
    mock_session.execute.side_effect = [settings_exec, svc_exec]

    lookup_tools = build_lookup_tools(session_factory, function_tool=fake_function_tool)
    get_org_details = lookup_tools[0]

    with (
        patch(
            "app.ai.tools.booking_lookup.resolve_organization",
            new_callable=AsyncMock,
            return_value=mock_org,
        ),
        patch(
            "app.ai.tools.booking_lookup.get_organization_stylists",
            new_callable=AsyncMock,
            return_value=[{"id": str(uuid4()), "display_name": "Selam Kebede"}],
        ),
    ):
        res = await get_org_details(org_query="Lovely Beauty Spa")
        data = json.loads(res)
        assert data["status"] == "success"
        org_info = data["organization"]
        assert org_info["physical_address"] == "456 Serenity Way"
        assert org_info["timezone"] == "America/New_York"
        assert "Mon: 9 AM - 6 PM" in org_info["working_hours"]
        assert "Selam Kebede" in org_info["stylists"]
        assert len(data["services"]) == 1
        assert data["services"][0]["name"] == "Swedish Massage"
