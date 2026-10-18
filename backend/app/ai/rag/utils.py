"""Utility functions for RAG service."""

import math


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two points on Earth in kilometers."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def build_search_query(message: str, prior_turns: list[str] | None = None) -> str:
    """Build search query from current message and recent conversation history."""
    parts = [*(prior_turns or [])[-3:], message]
    return " ".join(p.strip() for p in parts if p and p.strip())
