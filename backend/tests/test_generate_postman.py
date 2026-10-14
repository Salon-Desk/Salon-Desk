"""Tests for Postman collection generation helpers."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from scripts.generate_postman_collection import (
    DEFAULT_OUTPUT,
    GeneratorError,
    convert_openapi_to_postman,
    export_openapi_schema,
    generate,
    main,
    validate_postman_collection,
)


def test_export_openapi_schema_writes_valid_document(tmp_path: Path) -> None:
    dest = tmp_path / "openapi.json"
    schema = export_openapi_schema(dest)

    assert dest.is_file()
    assert schema["openapi"].startswith("3.")
    assert "/api/v1/auth/sign-in" in schema["paths"]
    assert "/health" in schema["paths"]
    loaded = json.loads(dest.read_text(encoding="utf-8"))
    assert loaded["paths"] == schema["paths"]


def test_validate_postman_collection_accepts_v21(tmp_path: Path) -> None:
    path = tmp_path / "collection.json"
    path.write_text(
        json.dumps(
            {
                "info": {
                    "name": "SalonDesk",
                    "schema": (
                        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
                    ),
                },
                "item": [],
            }
        ),
        encoding="utf-8",
    )
    data = validate_postman_collection(path)
    assert data["info"]["name"] == "SalonDesk"


def test_validate_postman_collection_rejects_invalid_json(tmp_path: Path) -> None:
    path = tmp_path / "bad.json"
    path.write_text("{not-json", encoding="utf-8")
    with pytest.raises(GeneratorError, match="not valid JSON"):
        validate_postman_collection(path)


def test_validate_postman_collection_rejects_missing_schema(tmp_path: Path) -> None:
    path = tmp_path / "collection.json"
    path.write_text(json.dumps({"info": {"name": "x"}, "item": []}), encoding="utf-8")
    with pytest.raises(GeneratorError, match="Unexpected Postman schema"):
        validate_postman_collection(path)


def test_convert_openapi_to_postman_missing_node(tmp_path: Path) -> None:
    openapi = tmp_path / "openapi.json"
    openapi.write_text("{}", encoding="utf-8")
    out = tmp_path / "collection.json"

    with (
        patch(
            "scripts.generate_postman_collection.shutil.which",
            return_value=None,
        ),
        pytest.raises(GeneratorError, match="Node.js is required"),
    ):
        convert_openapi_to_postman(openapi, out)


def test_convert_openapi_to_postman_nonzero_exit(tmp_path: Path) -> None:
    openapi = tmp_path / "openapi.json"
    openapi.write_text("{}", encoding="utf-8")
    out = tmp_path / "collection.json"

    failed = MagicMock(returncode=1, stdout="", stderr="boom")
    with (
        patch(
            "scripts.generate_postman_collection._ensure_node_available",
            return_value="npx",
        ),
        patch(
            "scripts.generate_postman_collection.subprocess.run",
            return_value=failed,
        ),
        pytest.raises(GeneratorError, match="openapi-to-postmanv2 failed"),
    ):
        convert_openapi_to_postman(openapi, out, npx_bin="npx")


def test_generate_success(tmp_path: Path) -> None:
    out = tmp_path / "postman" / "collection.json"
    collection = {
        "info": {
            "name": "SalonDesk API",
            "schema": ("https://schema.getpostman.com/json/collection/v2.1.0/collection.json"),
        },
        "item": [{"name": "Auth"}],
    }

    def fake_convert(openapi_path: Path, output_path: Path, **_: object) -> None:
        assert openapi_path.is_file()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(collection), encoding="utf-8")

    with patch(
        "scripts.generate_postman_collection.convert_openapi_to_postman",
        side_effect=fake_convert,
    ):
        result = generate(out)

    assert result == out
    assert validate_postman_collection(out)["item"][0]["name"] == "Auth"


def test_main_returns_nonzero_on_generator_error() -> None:
    with patch(
        "scripts.generate_postman_collection.generate",
        side_effect=GeneratorError("nope"),
    ):
        assert main(["-o", str(DEFAULT_OUTPUT)]) == 1


def test_main_returns_zero_on_success(tmp_path: Path) -> None:
    out = tmp_path / "collection.json"
    with patch(
        "scripts.generate_postman_collection.generate",
        return_value=out,
    ):
        assert main(["-o", str(out)]) == 0
