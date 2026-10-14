#!/usr/bin/env python3
"""Generate a Postman Collection v2.1 from the FastAPI OpenAPI schema.

Requires Node.js and uses `npx openapi-to-postmanv2` for conversion.
Does not start the API server.
"""

from __future__ import annotations

import argparse
import json
import logging
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

logger = logging.getLogger("generate_postman")

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
DEFAULT_OUTPUT = REPO_ROOT / "postman" / "collection.json"
POSTMAN_SCHEMA = "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
CONVERTER_PACKAGE = "openapi-to-postmanv2"


class GeneratorError(Exception):
    """Raised when collection generation fails."""


def export_openapi_schema(destination: Path) -> dict:
    """Import the FastAPI app and write its OpenAPI schema to *destination*."""
    # Ensure backend root is on sys.path when invoked as a script.
    backend = str(BACKEND_ROOT)
    if backend not in sys.path:
        sys.path.insert(0, backend)

    from app.main import app  # noqa: PLC0415 — deferred until path is ready

    schema = app.openapi()
    if not isinstance(schema, dict) or "openapi" not in schema:
        raise GeneratorError("FastAPI app.openapi() did not return a valid schema")

    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(schema, indent=2), encoding="utf-8")
    logger.info(
        "Wrote OpenAPI schema (%s paths) to %s",
        len(schema.get("paths") or {}),
        destination,
    )
    return schema


def _ensure_node_available() -> str:
    node = shutil.which("node")
    if not node:
        raise GeneratorError(
            "Node.js is required but was not found on PATH.\n"
            "Install Node.js 18+ from https://nodejs.org/ then retry.\n"
            f"Conversion uses: npx --yes {CONVERTER_PACKAGE}"
        )
    npx = shutil.which("npx")
    if not npx:
        raise GeneratorError(
            "npx was not found on PATH (usually installed with Node.js).\n"
            "Install Node.js 18+ from https://nodejs.org/ then retry."
        )
    return npx


def convert_openapi_to_postman(
    openapi_path: Path,
    output_path: Path,
    *,
    npx_bin: str | None = None,
) -> None:
    """Run openapi-to-postmanv2 via npx and write the collection to *output_path*."""
    npx = npx_bin or _ensure_node_available()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        npx,
        "--yes",
        CONVERTER_PACKAGE,
        "-s",
        str(openapi_path),
        "-o",
        str(output_path),
        "-p",
    ]
    logger.info("Running: %s", " ".join(cmd))
    try:
        completed = subprocess.run(
            cmd,
            check=False,
            capture_output=True,
            text=True,
            timeout=180,
        )
    except FileNotFoundError as exc:
        raise GeneratorError(
            "Failed to execute npx. Install Node.js 18+ from https://nodejs.org/"
        ) from exc
    except subprocess.TimeoutExpired as exc:
        raise GeneratorError(f"{CONVERTER_PACKAGE} timed out after 180s") from exc

    if completed.returncode != 0:
        stderr = (completed.stderr or "").strip()
        stdout = (completed.stdout or "").strip()
        detail = stderr or stdout or f"exit code {completed.returncode}"
        raise GeneratorError(
            f"{CONVERTER_PACKAGE} failed:\n{detail}\n\n"
            f"Try manually: npx --yes {CONVERTER_PACKAGE} -s <openapi.json> "
            f"-o <collection.json> -p"
        )

    if not output_path.is_file():
        raise GeneratorError(f"Converter exited successfully but did not create {output_path}")


def validate_postman_collection(path: Path) -> dict:
    """Load and validate a Postman Collection v2.1 document."""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise GeneratorError(f"Output is not valid JSON ({path}): {exc}") from exc

    if not isinstance(data, dict):
        raise GeneratorError("Postman collection root must be a JSON object")

    info = data.get("info")
    if not isinstance(info, dict):
        raise GeneratorError("Postman collection is missing info object")

    schema = info.get("schema", "")
    if "collection/v2" not in str(schema):
        raise GeneratorError(
            f"Unexpected Postman schema URI: {schema!r} "
            f"(expected a collection/v2.x schema such as {POSTMAN_SCHEMA})"
        )

    if "item" not in data:
        raise GeneratorError("Postman collection is missing item array")

    return data


def generate(output: Path) -> Path:
    """Export OpenAPI, convert to Postman, validate, and return the output path."""
    with tempfile.TemporaryDirectory(prefix="salondesk-openapi-") as tmp:
        openapi_path = Path(tmp) / "openapi.json"
        export_openapi_schema(openapi_path)
        convert_openapi_to_postman(openapi_path, output)
        collection = validate_postman_collection(output)

    item_count = len(collection.get("item") or [])
    logger.info(
        "Postman collection ready: %s (%s top-level folders/items)",
        output,
        item_count,
    )
    return output


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Generate postman/collection.json from the SalonDesk FastAPI OpenAPI schema "
            f"using {CONVERTER_PACKAGE}."
        )
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Output collection path (default: {DEFAULT_OUTPUT})",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Enable debug logging",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s: %(message)s",
    )
    try:
        generate(args.output.resolve())
    except GeneratorError as exc:
        logger.error("%s", exc)
        return 1
    except Exception:
        logger.exception("Unexpected error while generating Postman collection")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
