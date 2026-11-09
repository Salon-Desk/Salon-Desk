"""JSON extraction and normalization utilities for AI agent and LLM outputs."""

from __future__ import annotations

import json
import re
from typing import Any


def extract_json(text: str | None) -> dict[str, Any] | None:
    """Extract a dictionary from raw JSON or a JSON code-block embedded in text."""
    if not text:
        return None
    cleaned = text.strip()
    try:
        data = json.loads(cleaned)
        return data if isinstance(data, dict) else None
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", cleaned)
    if not match:
        return None
    try:
        data = json.loads(match.group(0))
        return data if isinstance(data, dict) else None
    except json.JSONDecodeError:
        return None
