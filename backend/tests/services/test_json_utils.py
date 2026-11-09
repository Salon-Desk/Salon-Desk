from app.ai.json_utils import extract_json


def test_extract_json_direct_dict():
    raw = '{"intent": "booking", "service": "Braids", "fee": 30}'
    data = extract_json(raw)
    assert data == {"intent": "booking", "service": "Braids", "fee": 30}


def test_extract_json_embedded_in_markdown():
    raw = """Here is the result of your request:
```json
{
  "win_probability": 94,
  "critique": "Solid cryptographic evidence chain."
}
```
Please let me know if you need more details.
"""
    data = extract_json(raw)
    assert data == {
        "win_probability": 94,
        "critique": "Solid cryptographic evidence chain.",
    }


def test_extract_json_invalid_or_empty():
    assert extract_json("") is None
    assert extract_json(None) is None
    assert extract_json("No JSON here at all.") is None
    assert extract_json("[1, 2, 3]") is None  # Array, not dict
    assert extract_json("{not valid json}") is None
