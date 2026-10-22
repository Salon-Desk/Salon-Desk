import pytest
from pydantic import ValidationError

from app.schemas.working_hours import WorkingHoursSchema


def test_working_hours_default_schedule() -> None:
    schema = WorkingHoursSchema.default_schedule()
    assert len(schema.mon) == 1
    assert schema.mon[0] == ["09:00", "18:00"]
    assert schema.sun == []


def test_working_hours_valid_custom() -> None:
    data = {
        "mon": [["08:30", "12:00"], ["13:00", "17:30"]],
        "tue": [["09:00", "17:00"]],
        "wed": [["09:00", "17:00"]],
        "thu": [["09:00", "17:00"]],
        "fri": [["09:00", "19:00"]],
        "sat": [["10:00", "15:00"]],
        "sun": [],
    }
    schema = WorkingHoursSchema(**data)
    assert len(schema.mon) == 2
    assert schema.mon[0] == ["08:30", "12:00"]
    assert schema.mon[1] == ["13:00", "17:30"]


def test_working_hours_rejects_inverted_times() -> None:
    data = {
        "mon": [["18:00", "09:00"]],
        "tue": [],
        "wed": [],
        "thu": [],
        "fri": [],
        "sat": [],
        "sun": [],
    }
    with pytest.raises(ValidationError):
        WorkingHoursSchema(**data)


def test_working_hours_rejects_overlapping_intervals() -> None:
    data = {
        "mon": [["09:00", "13:00"], ["12:30", "17:00"]],
        "tue": [],
        "wed": [],
        "thu": [],
        "fri": [],
        "sat": [],
        "sun": [],
    }
    with pytest.raises(ValidationError):
        WorkingHoursSchema(**data)


def test_working_hours_rejects_invalid_time_format() -> None:
    data = {
        "mon": [["9:00 AM", "5:00 PM"]],
        "tue": [],
        "wed": [],
        "thu": [],
        "fri": [],
        "sat": [],
        "sun": [],
    }
    with pytest.raises(ValidationError):
        WorkingHoursSchema(**data)
