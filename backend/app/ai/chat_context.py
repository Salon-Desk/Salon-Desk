"""Conversation history management and context window compression for AI chat."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    pass

from typing import Any

logger = logging.getLogger(__name__)

MAX_HISTORY_TURNS = 6
MAX_HISTORY_CHARS = 2500
PRESERVE_RECENT_TURNS = 4


def _get_turn_data(turn: Any) -> tuple[str, str]:
    if isinstance(turn, dict):
        return str(turn.get("role") or ""), str(turn.get("content") or "")
    return getattr(turn, "role", ""), getattr(turn, "content", "")


def summarize_older_turns(turns: list[Any]) -> str:
    """Produce a concise, compact summary of earlier conversational turns.

    Preserves essential topics, user preferences, and assistant actions
    while discarding wordy conversational filler.
    """
    key_points: list[str] = []
    for turn in turns:
        role_str, content_str = _get_turn_data(turn)
        role = "User" if role_str == "user" else "Assistant"
        clean = content_str.strip()
        # Truncate each turn to essentials
        snippet = clean if len(clean) <= 120 else f"{clean[:117]}..."
        key_points.append(f"{role}: {snippet}")

    return " | ".join(key_points)


def compress_conversation_history(
    history: list[Any],
    max_turns: int = MAX_HISTORY_TURNS,
    max_chars: int = MAX_HISTORY_CHARS,
    preserve_recent: int = PRESERVE_RECENT_TURNS,
) -> list[dict[str, str]]:
    """Compress conversation history if token/character budget or turn limit is exceeded.

    Keeps the most recent turns intact for conversational freshness while condensing
    earlier turns into a single system summary block.
    """
    if not history:
        return []

    parsed = [_get_turn_data(m) for m in history]
    total_chars = sum(len(content) for _, content in parsed)
    if len(history) <= max_turns and total_chars <= max_chars:
        return [{"role": role, "content": content} for role, content in parsed]

    split_index = max(1, len(history) - preserve_recent)
    older_turns = history[:split_index]
    recent_turns = history[split_index:]

    summary_text = summarize_older_turns(older_turns)
    compressed_messages: list[dict[str, str]] = [
        {
            "role": "system",
            "content": f"[Prior Conversation Context Summary: {summary_text}]",
        }
    ]

    for m in recent_turns:
        role, content = _get_turn_data(m)
        compressed_messages.append({"role": role, "content": content})

    logger.debug(
        "Compressed %d turns (%d chars) into summary + %d recent turns",
        len(older_turns),
        total_chars,
        len(recent_turns),
    )
    return compressed_messages
