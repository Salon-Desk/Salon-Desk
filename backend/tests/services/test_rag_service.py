from decimal import Decimal
from uuid import uuid4

from app.services.livekit_tokens import build_room_name, parse_language_from_room_name
from app.services.rag_service import (
    DEFAULT_RECOMMENDATION_LIMIT,
    EXPANDED_RECOMMENDATION_LIMIT,
    RetrievedChunk,
    RetrievedContext,
    ServiceRecommendation,
    build_chat_system_prompt,
    build_search_query,
    build_voice_rag_instruction,
    detect_intent,
    detect_language,
    format_context_text,
    recommendation_limit_for,
    select_recommendations,
    wants_more_recommendations,
)


def test_detect_language_english() -> None:
    assert detect_language("I want a haircut") == "en"


def test_detect_language_amharic() -> None:
    assert detect_language("ሰላም ፀጉር መቁረጥ እፈልጋለሁ") == "am"


def test_detect_intent_booking() -> None:
    assert detect_intent("I want to book an appointment") == "booking"


def test_detect_intent_discover() -> None:
    assert detect_intent("Do you have hair color?") == "discover"


def test_build_search_query_includes_prior_turns() -> None:
    q = build_search_query("which service?", prior_turns=["Tell me about Selam", "haircut"])
    assert "Selam" in q
    assert "which service?" in q


def test_format_context_includes_recommendations() -> None:
    svc_id = uuid4()
    org_id = uuid4()
    cards = [
        ServiceRecommendation(
            service_id=svc_id,
            organization_id=org_id,
            name="Women's Haircut",
            organization_name="Selam Hair Studio",
            base_price=Decimal("45.00"),
            duration_minutes=60,
            category_name="Hair",
        )
    ]
    chunks = [
        RetrievedChunk(
            entity_type="policy",
            entity_id=None,
            org_id=org_id,
            title="Cancellation",
            content="Free cancel 24h before",
        )
    ]
    text = format_context_text(chunks, cards)
    assert "Women's Haircut" in text
    assert "Selam Hair Studio" in text
    assert "Free cancel 24h" in text
    assert str(svc_id) in text


def test_voice_instruction_with_context() -> None:
    ctx = RetrievedContext(
        chunks=[
            RetrievedChunk(
                entity_type="service",
                entity_id=uuid4(),
                org_id=uuid4(),
                title="Haircut",
                content="Women's Haircut at Selam",
            )
        ],
        context_text="Recommended services (from live platform data):\n- Women's Haircut",
        detected_language="en",
        intent="discover",
    )
    text = build_voice_rag_instruction(ctx)
    assert "Women's Haircut" in text
    assert "No markdown" in text


def test_voice_instruction_empty() -> None:
    text = build_voice_rag_instruction(RetrievedContext())
    assert "No verified salon data" in text


def test_voice_instruction_booking() -> None:
    text = build_voice_rag_instruction(
        RetrievedContext(intent="booking", context_text="service_id=abc")
    )
    assert "book" in text.lower() or "scheduling" in text.lower()
    assert "service_id=abc" in text


def test_chat_system_prompt_grounds_recommendations() -> None:
    prompt = build_chat_system_prompt(RetrievedContext(context_text="Recommended: Manicure at $25"))
    assert "verified" in prompt.lower() or "Verified" in prompt
    assert "Manicure" in prompt
    assert "markdown tables" in prompt.lower() or "do not use markdown" in prompt.lower()


def test_chat_system_prompt_greeting_is_conversational() -> None:
    prompt = build_chat_system_prompt(RetrievedContext(intent="greeting", is_greeting=True))
    assert "hello" in prompt.lower()
    assert "checklist" in prompt.lower() or "numbered" in prompt.lower()


def test_wants_more_recommendations() -> None:
    assert wants_more_recommendations("show me a few more options")
    assert wants_more_recommendations("any others?")
    assert not wants_more_recommendations("am searching for good hair salon")
    assert recommendation_limit_for("hair salon") == DEFAULT_RECOMMENDATION_LIMIT
    assert recommendation_limit_for("show more") == EXPANDED_RECOMMENDATION_LIMIT


def _card(name: str, category: str, org_name: str, org_id=None) -> ServiceRecommendation:
    return ServiceRecommendation(
        service_id=uuid4(),
        organization_id=org_id or uuid4(),
        name=name,
        organization_name=org_name,
        base_price=Decimal("45.00"),
        duration_minutes=60,
        category_name=category,
    )


def test_select_recommendations_caps_at_three() -> None:
    org_id = uuid4()
    cards = [
        _card("Women's Haircut", "Hair", "Selam Hair Studio", org_id),
        _card("Men's Haircut", "Hair", "Selam Hair Studio", org_id),
        _card("Hair Color", "Hair", "Selam Hair Studio", org_id),
        _card("Manicure", "Nails", "Selam Hair Studio", org_id),
        _card("Express Facial", "Spa", "Selam Hair Studio", org_id),
    ]
    picked = select_recommendations(cards, query="am searching for good hair salone")
    assert len(picked) == 3
    assert all(card.category_name == "Hair" for card in picked)


def test_select_recommendations_expands_when_asked() -> None:
    org_id = uuid4()
    cards = [_card(f"Service {i}", "Hair", "Selam Hair Studio", org_id) for i in range(6)]
    picked = select_recommendations(
        cards, query="show me more hair options", limit=EXPANDED_RECOMMENDATION_LIMIT
    )
    assert len(picked) == 6


def test_room_name_encodes_language() -> None:
    name = build_room_name(language="am")
    assert parse_language_from_room_name(name) == "am"
    assert "-agent-am-" in name


def test_room_name_encodes_portal() -> None:
    from app.services.livekit_tokens import parse_portal_from_room_name

    name = build_room_name(language="en", portal="merchant")
    assert parse_portal_from_room_name(name) == "merchant"
    assert "salondesk-merchant-agent-en-" in name


def test_support_chat_prompt_rejects_booking() -> None:
    prompt = build_chat_system_prompt(
        RetrievedContext(context_text="Open Services to edit price."),
        portal="merchant",
    )
    assert "merchant" in prompt.lower() or "org console" in prompt.lower()
    assert "Do NOT book" in prompt or "do not book" in prompt.lower()


def test_haversine_km_and_distance_format() -> None:
    from app.ai.rag_service import haversine_km

    # Distance between Bole (8.9806, 38.7578) and Kazanchis (9.0175, 38.7692) is approx 4.3 km
    dist = haversine_km(8.9806, 38.7578, 9.0175, 38.7692)
    assert 3.5 < dist < 5.0

    card = ServiceRecommendation(
        service_id=uuid4(),
        organization_id=uuid4(),
        name="Precision Fade",
        organization_name="The Executive Barber Club",
        base_price=Decimal("25.00"),
        duration_minutes=30,
        physical_address="Bole Atlas",
        distance_km=1.2,
    )
    formatted = format_context_text([], [card])
    assert "1.2 km away" in formatted
    assert "Bole Atlas" in formatted


def test_is_salon_hunt_and_service_request() -> None:
    from app.ai.rag.recommendations import is_salon_hunt, is_service_request

    assert is_salon_hunt("Which salons or spas are near Bole?") is True
    assert is_salon_hunt("I want a haircut and beard trim") is False
    assert is_service_request("Show me available haircut services") is True
    assert is_service_request("How does the platform hold $0 authorization?") is False


def test_compress_conversation_history() -> None:
    from app.ai.chat_context import compress_conversation_history

    short_history = [
        {"role": "user", "content": "Hi there"},
        {"role": "assistant", "content": "Hello! How can I help?"},
    ]
    compressed_short = compress_conversation_history(short_history, max_turns=6)
    assert compressed_short == short_history

    long_history = [
        {"role": "user" if i % 2 == 0 else "assistant", "content": f"Turn message {i}"}
        for i in range(16)
    ]
    compressed_long = compress_conversation_history(long_history, max_turns=4)
    assert len(compressed_long) == 5  # 1 summary + 4 preserved recent turns
    assert "[Prior Conversation Context Summary:" in compressed_long[0]["content"]
    assert compressed_long[-1]["content"] == "Turn message 15"
