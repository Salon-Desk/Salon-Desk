import json
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.ai.chat_agent import (
    execute_get_salon_services,
    resolve_organization_by_name,
    run_chat_agent,
)
from app.models.enums import OrganizationStatus


@pytest.mark.asyncio
async def test_resolve_organization_by_name():
    mock_session = AsyncMock()
    org_id = uuid4()
    mock_org = MagicMock()
    mock_org.id = org_id
    mock_org.name = "Lovely Beauty Spa"
    mock_org.status = OrganizationStatus.APPROVED

    exec_result = MagicMock()
    exec_result.scalar_one_or_none.return_value = mock_org
    mock_session.execute.return_value = exec_result

    # Substring / name match
    res = await resolve_organization_by_name(mock_session, "Lovely Beauty Spa")
    assert res is not None
    assert res.name == "Lovely Beauty Spa"

    # UUID match
    res_uuid = await resolve_organization_by_name(mock_session, str(org_id))
    assert res_uuid is not None

    # Empty match
    empty_res = await resolve_organization_by_name(mock_session, "")
    assert empty_res is None


@pytest.mark.asyncio
async def test_execute_get_salon_services():
    mock_session = AsyncMock()
    org_id = uuid4()
    mock_org = MagicMock()
    mock_org.id = org_id
    mock_org.name = "Lovely Beauty Spa"
    mock_org.picture = None
    mock_org.status = OrganizationStatus.APPROVED

    # Org query result
    org_exec = MagicMock()
    org_exec.scalar_one_or_none.return_value = mock_org

    # Services query result
    svc1 = MagicMock()
    svc1.id = uuid4()
    svc1.organization_id = org_id
    svc1.name = "Swedish Massage"
    svc1.base_price = Decimal("1500.00")
    svc1.duration_minutes = 60
    svc1.category = MagicMock(name="Spa")
    svc1.category.name = "Spa"
    svc1.description = "Full body massage"
    svc1.images = None
    svc1.organization = mock_org

    svc2 = MagicMock()
    svc2.id = uuid4()
    svc2.organization_id = org_id
    svc2.name = "Deep Tissue Massage"
    svc2.base_price = Decimal("1800.00")
    svc2.duration_minutes = 60
    svc2.category = MagicMock(name="Spa")
    svc2.category.name = "Spa"
    svc2.description = "Deep muscle work"
    svc2.images = None
    svc2.organization = mock_org

    svc3 = MagicMock()
    svc3.id = uuid4()
    svc3.organization_id = org_id
    svc3.name = "Body Polish"
    svc3.base_price = Decimal("1200.00")
    svc3.duration_minutes = 50
    svc3.category = MagicMock(name="Spa")
    svc3.category.name = "Spa"
    svc3.description = "Exfoliating polish"
    svc3.images = None
    svc3.organization = mock_org

    s_set = MagicMock()
    s_set.physical_address = "Bole, Addis Ababa"
    s_set.lat = None
    s_set.lng = None

    svc_exec = MagicMock()
    svc_exec.all.return_value = [(svc1, s_set), (svc2, s_set), (svc3, s_set)]

    mock_session.execute.side_effect = [org_exec, svc_exec]

    data, cards = await execute_get_salon_services(mock_session, "Lovely Beauty Spa")
    assert data["status"] == "success"
    assert data["salon_name"] == "Lovely Beauty Spa"
    assert data["total_services"] == 3
    assert len(cards) == 3
    assert cards[0].name == "Swedish Massage"
    assert cards[1].name == "Deep Tissue Massage"
    assert cards[2].name == "Body Polish"


@pytest.mark.asyncio
async def test_run_chat_agent_with_tool_call():
    mock_session = AsyncMock()
    org_id = uuid4()
    mock_org = MagicMock()
    mock_org.id = org_id
    mock_org.name = "Lovely Beauty Spa"
    mock_org.picture = None
    mock_org.status = OrganizationStatus.APPROVED

    org_exec = MagicMock()
    org_exec.scalar_one_or_none.return_value = mock_org

    svc = MagicMock()
    svc.id = uuid4()
    svc.organization_id = org_id
    svc.name = "Swedish Massage"
    svc.base_price = Decimal("1500.00")
    svc.duration_minutes = 60
    svc.category = MagicMock(name="Spa")
    svc.category.name = "Spa"
    svc.description = "Relaxation"
    svc.images = None
    svc.organization = mock_org

    s_set = MagicMock()
    s_set.physical_address = "Addis Ababa"
    s_set.lat = None
    s_set.lng = None

    svc_exec = MagicMock()
    svc_exec.all.return_value = [(svc, s_set)]

    mock_session.execute.side_effect = [org_exec, svc_exec]

    mock_llm = MagicMock()
    # Turn 1: model returns tool call for get_salon_services
    # Turn 2: after tool output, model returns final conversational answer
    mock_llm.chat_completion = AsyncMock(
        side_effect=[
            {
                "role": "assistant",
                "content": "",
                "tool_calls": [
                    {
                        "id": "call_123",
                        "type": "function",
                        "function": {
                            "name": "get_salon_services",
                            "arguments": json.dumps({"salon_name": "Lovely Beauty Spa"}),
                        },
                    }
                ],
            },
            {
                "role": "assistant",
                "content": "Lovely Beauty Spa offers Swedish Massage for 1500 ETB.",
            },
        ]
    )

    messages = [
        {"role": "user", "content": "what are the services that are listed in Lovely Beauty Spa"}
    ]
    reply, recs, orgs = await run_chat_agent(
        mock_llm,
        messages,
        db=mock_session,
    )

    assert "Swedish Massage" in reply
    assert len(recs) == 1
    assert recs[0].name == "Swedish Massage"
    assert mock_llm.chat_completion.call_count == 2


@pytest.mark.asyncio
async def test_run_chat_agent_fallback_on_llm_tool_error():
    mock_session = AsyncMock()
    mock_llm = MagicMock()
    mock_llm.chat_completion = AsyncMock(side_effect=Exception("Provider does not support tools"))
    mock_llm.chat = AsyncMock(return_value="Here is standard assistance.")

    messages = [{"role": "user", "content": "hello"}]
    reply, recs, orgs = await run_chat_agent(
        mock_llm,
        messages,
        db=mock_session,
    )

    assert reply == "Here is standard assistance."
    assert recs == []
    assert orgs == []
