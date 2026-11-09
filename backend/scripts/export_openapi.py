#!/usr/bin/env python3
"""Export FastAPI OpenAPI JSON schema to a file."""

from __future__ import annotations

import json
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.main import app  # noqa: E402


def main() -> None:
    output_path = Path(sys.argv[1]) if len(sys.argv) > 1 else BACKEND_ROOT / "openapi.json"
    schema = app.openapi()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(schema, indent=2), encoding="utf-8")
    print(f"Exported OpenAPI schema ({len(schema.get('paths', {}))} paths) to {output_path}")


if __name__ == "__main__":
    main()
