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


def format_working_hours(working_hours: dict | None) -> str:
    """Convert working_hours JSON dict into human-readable text."""
    if not isinstance(working_hours, dict):
        return "Mon-Sat 9:00 AM - 6:00 PM"

    day_order = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    day_labels = {
        "mon": "Mon",
        "tue": "Tue",
        "wed": "Wed",
        "thu": "Thu",
        "fri": "Fri",
        "sat": "Sat",
        "sun": "Sun",
    }

    def _fmt(t_str: str) -> str:
        try:
            h, m = map(int, t_str.split(":"))
            meridiem = "AM" if h < 12 else "PM"
            h_12 = h % 12 or 12
            return f"{h_12}:{m:02d} {meridiem}" if m else f"{h_12} {meridiem}"
        except Exception:
            return t_str

    parts: list[str] = []
    for day_key in day_order:
        windows = working_hours.get(day_key)
        day_name = day_labels.get(day_key, day_key.capitalize())
        if not windows:
            parts.append(f"{day_name}: Closed")
        else:
            w_strs = []
            for w in windows:
                if isinstance(w, (list, tuple)) and len(w) == 2:
                    w_strs.append(f"{_fmt(str(w[0]))} - {_fmt(str(w[1]))}")
            if w_strs:
                parts.append(f"{day_name}: {', '.join(w_strs)}")
            else:
                parts.append(f"{day_name}: Closed")

    return ", ".join(parts)
