"""Context formatting for LLM prompts."""

from .constants import (
    CHAT_PERSONA,
    DEFAULT_RECOMMENDATION_LIMIT,
    RetrievedChunk,
    RetrievedContext,
    ServiceRecommendation,
)


def format_context_text(
    chunks: list[RetrievedChunk],
    recommendations: list[ServiceRecommendation],
) -> str:
    """Format retrieved chunks and recommendations into text for LLM context."""
    lines: list[str] = []

    if recommendations:
        lines.append("Recommended services (from live platform data):")
        for card in recommendations:
            dist_part = f" ({card.distance_km} km away)" if card.distance_km is not None else ""
            lines.append(
                f"- {card.name} at {card.organization_name}{dist_part}: "
                f"${card.base_price} / {card.duration_minutes} min"
                + (f" ({card.category_name})" if card.category_name else "")
                + (f" @ {card.physical_address}" if card.physical_address else "")
                + f" [service_id={card.service_id}]"
            )

    for chunk in chunks:
        lines.append(f"From {chunk.entity_type}/{chunk.title}: {chunk.content}")

    return "\n".join(lines)


def build_voice_rag_instruction(retrieved: RetrievedContext) -> str:
    """Build instruction for voice agent based on retrieved context."""
    if retrieved.intent == "greeting" or retrieved.is_greeting:
        return (
            "They just said hello. Reply like a person — one warm sentence "
            "and ask what they are hoping to get done. No lists."
        )

    if retrieved.intent == "booking":
        base = (
            "They want to book. Stay on service, salon, and time. "
            "Use only verified services below. Do not invent availability. "
            "Ask one question if you need it. Speak in 1–2 short sentences."
        )
        if retrieved.context_text:
            return f"{base}\n\n{retrieved.context_text}"
        return base

    if not retrieved.chunks and not retrieved.recommendations:
        return (
            "No verified salon data matched this turn. "
            "Do not invent salons, prices, or slots. "
            "Ask what they want or which area, like a person would."
        )

    more_note = ""
    if len(retrieved.recommendations) > DEFAULT_RECOMMENDATION_LIMIT:
        more_note = " They asked for more options — you may mention these extra picks."

    return (
        "Use ONLY the verified platform context below. "
        "Mention at most three services unless they asked for more. "
        "Speak conversationally in 1–2 short sentences. No markdown or lists."
        f"{more_note}\n\n"
        f"{retrieved.context_text}"
    )


def build_chat_system_prompt(retrieved: RetrievedContext) -> str:
    """Build system prompt for chat interface based on retrieved context."""
    parts = [CHAT_PERSONA]

    if retrieved.intent == "greeting" or retrieved.is_greeting:
        parts.append(
            "They just said hello. Reply in one or two friendly sentences. "
            "Do not list questions or explain how booking works."
        )
        return "\n\n".join(parts)

    if retrieved.intent == "farewell":
        parts.append("They are saying goodbye. Wish them well in one short sentence.")
        return "\n\n".join(parts)

    if retrieved.intent == "booking":
        parts.append(
            "They are trying to book. Clarify service or time in a natural way; "
            "do not wander into unrelated FAQ."
        )

    if len(retrieved.recommendations) > DEFAULT_RECOMMENDATION_LIMIT:
        parts.append(
            "They asked for more options. You may mention these extra picks, still conversationally."
        )

    if retrieved.context_text:
        parts.append(
            "Verified services you can mention (do not invent others):\n" + retrieved.context_text
        )
    else:
        parts.append(
            "No matching salon data this turn. Ask what they want or which area — "
            "do not invent names or prices."
        )

    return "\n\n".join(parts)
