"""Populate realistic SalonDesk demo data (10 organizations + 100+ services + proper users + platform).

Usage (from backend/):
  uv run python -m scripts.seed
  uv run python -m scripts.seed --clear
"""

from .runner import main, run_seed

__all__ = ["main", "run_seed"]
