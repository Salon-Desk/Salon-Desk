from decimal import Decimal
from uuid import uuid4

from app.services.livekit_tokens import build_room_name, parse_language_from_room_name
from app.services.rag_service import (
    RetrievedChunk,
    RetrievedContext,
    ServiceRecommendation,
    build_chat_system_prompt,
    build_search_query,
    build_voice_rag_instruction,
    detect_intent,
    detect_language,
    format_context_text,
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
    assert "booking" in text.lower() or "scheduling" in text.lower()
    assert "service_id=abc" in text


def test_chat_system_prompt_grounds_recommendations() -> None:
    prompt = build_chat_system_prompt(RetrievedContext(context_text="Recommended: Manicure at $25"))
    assert "verified" in prompt.lower() or "Verified" in prompt
    assert "Manicure" in prompt


def test_room_name_encodes_language() -> None:
    name = build_room_name(language="am")
    assert parse_language_from_room_name(name) == "am"
    assert "-agent-am-" in name
