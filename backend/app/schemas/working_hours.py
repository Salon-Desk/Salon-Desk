import re

from pydantic import BaseModel, Field, field_validator

TIME_PATTERN = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


def validate_time_str(v: str) -> str:
    if not isinstance(v, str) or not TIME_PATTERN.match(v):
        raise ValueError(f"Invalid time format '{v}'. Must be HH:MM in 24-hour format.")
    return v


def parse_minutes(time_str: str) -> int:
    h, m = map(int, time_str.split(":"))
    return h * 60 + m


class WorkingHoursDay(BaseModel):
    """List of [start, end] time windows for a single weekday."""

    windows: list[list[str]] = Field(default_factory=list)

    @field_validator("windows")
    @classmethod
    def validate_windows(cls, windows: list[list[str]]) -> list[list[str]]:
        validated: list[list[str]] = []
        parsed_intervals: list[tuple[int, int]] = []

        for item in windows:
            if not isinstance(item, (list, tuple)) or len(item) != 2:
                raise ValueError("Each time window must be a [start, end] pair.")
            start = validate_time_str(str(item[0]))
            end = validate_time_str(str(item[1]))

            start_min = parse_minutes(start)
            end_min = parse_minutes(end)
            if start_min >= end_min:
                raise ValueError(f"Start time '{start}' must be before end time '{end}'.")

            # Check overlap with previous intervals
            for prev_start, prev_end in parsed_intervals:
                if not (end_min <= prev_start or start_min >= prev_end):
                    raise ValueError(f"Time window [{start}, {end}] overlaps with existing window.")

            parsed_intervals.append((start_min, end_min))
            validated.append([start, end])

        # Sort intervals chronologically
        validated.sort(key=lambda w: parse_minutes(w[0]))
        return validated


class WorkingHoursSchema(BaseModel):
    """Canonical weekly operating hours definition."""

    mon: list[list[str]] = Field(default_factory=lambda: [["09:00", "18:00"]])
    tue: list[list[str]] = Field(default_factory=lambda: [["09:00", "18:00"]])
    wed: list[list[str]] = Field(default_factory=lambda: [["09:00", "18:00"]])
    thu: list[list[str]] = Field(default_factory=lambda: [["09:00", "18:00"]])
    fri: list[list[str]] = Field(default_factory=lambda: [["09:00", "18:00"]])
    sat: list[list[str]] = Field(default_factory=lambda: [["10:00", "16:00"]])
    sun: list[list[str]] = Field(default_factory=list)

    @field_validator("mon", "tue", "wed", "thu", "fri", "sat", "sun", mode="before")
    @classmethod
    def validate_day_windows(cls, v: object) -> list[list[str]]:
        if v is None:
            return []
        if isinstance(v, list):
            return WorkingHoursDay.validate_windows(v)
        raise ValueError("Day schedule must be a list of [start, end] time windows.")

    @classmethod
    def default_schedule(cls) -> "WorkingHoursSchema":
        return cls()
