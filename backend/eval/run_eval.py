"""Evaluation runner calculating Wilson 95% CI accuracy."""

from __future__ import annotations

import json
import math
from pathlib import Path


def wilson_ci(successes: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n == 0:
        return 0.0, 0.0
    p = successes / n
    denom = 1 + z**2 / n
    centre = p + z**2 / (2 * n)
    margin = z * math.sqrt((p * (1 - p) + z**2 / (4 * n)) / n)
    return (centre - margin) / denom, (centre + margin) / denom


def main() -> None:
    dataset_path = Path(__file__).with_name("dataset.json")
    data = json.loads(dataset_path.read_text(encoding="utf-8"))
    n = len(data)
    # Stub: treat all as incorrect until parser is wired
    successes = 0
    low, high = wilson_ci(successes, n)
    print(f"n={n} accuracy={successes / n if n else 0:.3f} wilson95=({low:.3f}, {high:.3f})")


if __name__ == "__main__":
    main()
