"""Context formatting for LLM prompts."""

from .constants import (
    DEFAULT_RECOMMENDATION_LIMIT,
    RetrievedChunk,
    RetrievedContext,
    ServiceRecommendation,
    StylistRecommendation,
    persona_for_portal,
)


def format_context_text(
    chunks: list[RetrievedChunk],
    recommendations: list[ServiceRecommendation],
    stylists: list[StylistRecommendation] | None = None,
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

    if stylists:
        lines.append("Available stylists / staff (from live platform data):")
        for st in stylists:
            lines.append(
                f"- {st.name} ({st.role})"
                + (f" at {st.organization_name}" if st.organization_name else "")
                + (f" · Specialties: {st.bio}" if st.bio else "")
                + (f" · Rating: {st.rating}★" if st.rating else "")
            )

    for chunk in chunks:
        lines.append(f"From {chunk.entity_type}/{chunk.title}: {chunk.content}")

    return "\n".join(lines)


def build_voice_rag_instruction(
    retrieved: RetrievedContext,
    *,
    portal: str = "client",
) -> str:
    """Build instruction for voice agent based on retrieved context."""
    support = portal in {"merchant", "admin"}

    if retrieved.intent == "greeting" or retrieved.is_greeting:
        if support:
            return (
                "They just said hello. Reply like a helpful teammate — one warm sentence "
                "and ask what part of the console they need help with. No lists."
            )
        return (
            "They just said hello. Reply like a person — one warm sentence "
            "and ask what they are hoping to get done. No lists."
        )

    if support:
        if not retrieved.chunks and not retrieved.context_text:
            return (
                "No verified help docs matched this turn. "
                "Do not invent UI steps or permissions. "
                "Ask which screen or task they need help with."
            )
        return (
            "Use ONLY the verified help context below. "
            "Explain how to use the system in 1–2 short spoken sentences. "
            "Do not book appointments or recommend salons to consumers. "
            "No markdown or lists.\n\n"
            f"{retrieved.context_text}"
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


def build_chat_system_prompt(
    retrieved: RetrievedContext,
    *,
    portal: str = "client",
) -> str:
    """Build system prompt for chat interface based on retrieved context."""
    parts = [persona_for_portal(portal)]
    support = portal in {"merchant", "admin"}

    if retrieved.intent == "greeting" or retrieved.is_greeting:
        if support:
            parts.append(
                "They just said hello. Reply in one or two friendly sentences. "
                "Ask what part of the console they need help with — do not pitch booking."
            )
        else:
            parts.append(
                "They just said hello. Reply in one or two friendly sentences. "
                "Do not list questions or explain how booking works."
            )
        return "\n\n".join(parts)

    if retrieved.intent == "farewell":
        parts.append("They are saying goodbye. Wish them well in one short sentence.")
        return "\n\n".join(parts)

    if support:
        parts.append(
            "When they ask how to do something, answer with short numbered steps "
            "using the verified help below (sidebar page + button names)."
        )
        if retrieved.context_text:
            parts.append(
                "Verified help you can use (do not invent other steps):\n" + retrieved.context_text
            )
        else:
            parts.append(
                "No matching help docs this turn. Ask which screen or task they mean — "
                "do not invent UI labels or permissions."
            )
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
