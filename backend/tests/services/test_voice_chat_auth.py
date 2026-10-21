import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.ai.chat_auth import try_handle_chat_auth
from app.ai.chat_booking import try_handle_chat_booking
from app.ai.tools.auth_tools import build_auth_tools
from app.ai.tools.booking_tools import build_booking_tools
from app.core.exceptions import UnauthorizedError
from app.main import create_app
from app.models.enums import BookingStatus, UserRole


@pytest.mark.asyncio
async def test_auth_tools_login_success():
    mock_user = MagicMock()
    mock_user.id = "00000000-0000-0000-0000-000000000001"
    mock_user.email = "test@example.com"
    mock_user.role = UserRole.CLIENT
    mock_user.profile.first_name = "Jane"
    mock_user.profile.last_name = "Doe"
    mock_user.org_id = None

    published_payloads = []

    def on_auth(payload):
        published_payloads.append(payload)

    session_factory = MagicMock()
    mock_session = AsyncMock()
    session_factory.return_value.__aenter__.return_value = mock_session

    with (
        patch("app.services.auth_service.authenticate", return_value=mock_user),
        patch("app.services.auth_service.issue_token", return_value="fake-jwt-token"),
    ):
        login_tool, _signup_tool = build_auth_tools(session_factory, on_auth_success=on_auth)
        res = await login_tool(email="test@example.com", password="SecretPassword123!")
        data = json.loads(res)
        assert data["status"] == "success"
        assert "Jane" in data["message"]
        assert len(published_payloads) == 1
        assert published_payloads[0]["access_token"] == "fake-jwt-token"
        assert published_payloads[0]["user"]["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_auth_tools_login_failure():
    session_factory = MagicMock()
    mock_session = AsyncMock()
    session_factory.return_value.__aenter__.return_value = mock_session

    with patch(
        "app.services.auth_service.authenticate",
        side_effect=UnauthorizedError("Invalid email or password"),
    ):
        login_tool, _ = build_auth_tools(session_factory)
        res = await login_tool(email="wrong@example.com", password="WrongPassword")
        data = json.loads(res)
        assert data["status"] == "error"
        assert "Invalid email or password" in data["message"]


@pytest.mark.asyncio
async def test_auth_tools_signup_success():
    mock_user = MagicMock()
    mock_user.id = "00000000-0000-0000-0000-000000000002"
    mock_user.email = "newuser@example.com"
    mock_user.role = UserRole.CLIENT
    mock_user.profile.first_name = "Alice"
    mock_user.profile.last_name = "Smith"
    mock_user.org_id = None

    published_payloads = []

    def on_auth(payload):
        published_payloads.append(payload)

    session_factory = MagicMock()
    mock_session = AsyncMock()
    session_factory.return_value.__aenter__.return_value = mock_session

    with (
        patch("app.services.auth_service.signup_client", return_value=mock_user),
        patch("app.services.auth_service.issue_token", return_value="signup-jwt-token"),
    ):
        _, signup_tool = build_auth_tools(session_factory, on_auth_success=on_auth)
        res = await signup_tool(
            first_name="Alice",
            last_name="Smith",
            email="newuser@example.com",
            password="StrongPassword123!",
        )
        data = json.loads(res)
        assert data["status"] == "success"
        assert "Alice" in data["message"]
        assert len(published_payloads) == 1
        assert published_payloads[0]["access_token"] == "signup-jwt-token"


@pytest.mark.asyncio
async def test_chat_auth_handler_login():
    mock_llm = AsyncMock()
    mock_llm.chat.return_value = json.dumps(
        {
            "action": "login",
            "email": "user@test.com",
            "password": "Password123!",
        }
    )

    mock_user = MagicMock()
    mock_user.id = "00000000-0000-0000-0000-000000000003"
    mock_user.email = "user@test.com"
    mock_user.role = UserRole.CLIENT
    mock_user.profile.first_name = "Bob"
    mock_user.profile.last_name = "Ross"
    mock_user.org_id = None

    mock_db = AsyncMock()

    with (
        patch("app.services.auth_service.authenticate", return_value=mock_user),
        patch("app.services.auth_service.issue_token", return_value="chat-jwt-token"),
    ):
        handled, reply, token, user_info = await try_handle_chat_auth(
            mock_db,
            mock_llm,
            message="Please log me in with user@test.com and password Password123!",
            history=[],
        )
        assert handled is True
        assert token == "chat-jwt-token"
        assert user_info["email"] == "user@test.com"
        assert "Bob" in reply


@pytest.mark.asyncio
async def test_chat_endpoint_with_auth():
    app = create_app()
    mock_user_info = {
        "id": "00000000-0000-0000-0000-000000000004",
        "email": "chatuser@test.com",
        "role": "client",
        "first_name": "Carol",
        "last_name": "Danvers",
        "name": "Carol Danvers",
        "org_id": None,
    }

    with patch(
        "app.api.v1.client.chat.try_handle_chat_auth",
        return_value=(True, "Welcome Carol!", "jwt-token-123", mock_user_info),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/v1/chat",
                json={"message": "log in carol@test.com pass123"},
            )
            assert resp.status_code == 200
            body = resp.json()
            assert body["success"] is True
            data = body["data"]
            assert data["auth_token"] == "jwt-token-123"
            assert data["user"]["email"] == "chatuser@test.com"
            assert data["reply"] == "Welcome Carol!"


@pytest.mark.asyncio
async def test_booking_tools_book_and_confirm():
    published_events = []

    def on_booking(payload):
        published_events.append(payload)

    session_factory = MagicMock()
    mock_session = AsyncMock()
    session_factory.return_value.__aenter__.return_value = mock_session

    mock_client = MagicMock()
    mock_client.id = "00000000-0000-0000-0000-000000000010"
    mock_client.role = UserRole.CLIENT

    mock_service = MagicMock()
    mock_service.id = "00000000-0000-0000-0000-000000000020"
    mock_service.organization_id = "00000000-0000-0000-0000-000000000030"
    mock_service.name = "Signature Fade"

    mock_booking = MagicMock()
    mock_booking.id = "00000000-0000-0000-0000-000000000040"
    mock_booking.client_id = mock_client.id
    mock_booking.status = BookingStatus.CONFIRMED
    mock_booking.total_price = 45.00

    mock_org = MagicMock()
    mock_org.name = "Crown & Blade"

    client_res = MagicMock()
    client_res.scalar_one_or_none.return_value = mock_client

    srv_res = MagicMock()
    srv_res.scalar_one_or_none.return_value = mock_service

    mock_session.execute.side_effect = [client_res, srv_res]
    mock_session.get.return_value = mock_org

    with (
        patch(
            "app.services.booking_service.create_booking",
            new_callable=AsyncMock,
            return_value=mock_booking,
        ),
        patch("app.services.payment_service.create_consent", new_callable=AsyncMock),
        patch(
            "app.services.payment_service.create_hold",
            new_callable=AsyncMock,
            return_value=(MagicMock(paypal_order_id="STUB-test"), None),
        ),
        patch("app.services.payment_service.complete_hold", new_callable=AsyncMock),
    ):
        tools = build_booking_tools(session_factory, on_booking_success=on_booking)
        assert len(tools) >= 1
        book_tool = tools[0]
        res = await book_tool(service_query="Signature Fade", notes="Book via agent")
        data = json.loads(res)
        assert data["status"] == "success"
        assert data["status_code"] == "CONFIRMED"
        assert "Signature Fade" in data["message"]
        assert len(published_events) == 1
        assert published_events[0]["type"] == "booking_confirmed"
        assert published_events[0]["service_name"] == "Signature Fade"


@pytest.mark.asyncio
async def test_chat_booking_handler():
    mock_llm = AsyncMock()
    mock_llm.chat.return_value = json.dumps(
        {
            "action": "book",
            "service_query": "Balayage",
            "preferred_time": "2026-10-20T14:00:00Z",
            "notes": "Test chat booking",
        }
    )

    mock_db = AsyncMock()
    mock_client = MagicMock()
    mock_client.id = "00000000-0000-0000-0000-000000000011"
    mock_client.role = UserRole.CLIENT

    mock_service = MagicMock()
    mock_service.id = "00000000-0000-0000-0000-000000000021"
    mock_service.organization_id = "00000000-0000-0000-0000-000000000031"
    mock_service.name = "Balayage Highlight"

    mock_booking = MagicMock()
    mock_booking.id = "00000000-0000-0000-0000-000000000041"
    mock_booking.client_id = mock_client.id
    mock_booking.total_price = 120.00

    mock_org = MagicMock()
    mock_org.name = "Selam Salon"

    srv_res = MagicMock()
    srv_res.scalar_one_or_none.return_value = mock_service
    mock_db.execute.return_value = srv_res
    mock_db.get.return_value = mock_org

    with patch(
        "app.services.booking_service.create_booking",
        new_callable=AsyncMock,
        return_value=mock_booking,
    ):
        handled, reply, confirmed = await try_handle_chat_booking(
            mock_db,
            mock_llm,
            message="Please book Balayage tomorrow at 2pm",
            history=[],
            user=mock_client,
        )
        assert handled is True
        assert confirmed is not None
        assert confirmed["status"] == "PENDING"
        assert confirmed["service_name"] == "Balayage Highlight"
        assert confirmed["payment_link"].startswith("/client/book/")
        assert "Balayage Highlight" in reply
        assert "payment link" in reply.lower()


@pytest.mark.asyncio
async def test_chat_endpoint_with_booking_and_org_cards():
    app = create_app()
    mock_booking_info = {
        "id": "00000000-0000-0000-0000-000000000042",
        "service_name": "Silk Press",
        "starts_at": "2026-10-21T14:00:00Z",
        "formatted_time": "Wednesday, Oct 21 at 02:00 PM",
        "total_price": "75.00",
        "status": "CONFIRMED",
    }

    with (
        patch("app.api.v1.client.chat.try_handle_chat_auth", return_value=(False, "", None, None)),
        patch(
            "app.api.v1.client.chat.try_handle_chat_booking",
            return_value=(True, "Booking confirmed!", mock_booking_info),
        ),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/v1/chat",
                json={"message": "book silk press tomorrow"},
            )
            assert resp.status_code == 200
            body = resp.json()
            assert body["success"] is True
            data = body["data"]
            assert data["intent"] == "booking"
            assert data["confirmed_booking"]["status"] == "CONFIRMED"
            assert data["confirmed_booking"]["service_name"] == "Silk Press"
