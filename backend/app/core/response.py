from datetime import UTC, datetime
from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: dict[str, Any] | None = None


class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    message: str | None = None
    timestamp: str


class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
    timestamp: str


def success(data: T, message: str | None = None) -> SuccessResponse[T]:
    """Create a standardized success response."""
    return SuccessResponse[T](
        data=data,
        message=message,
        timestamp=datetime.now(UTC).isoformat(),
    )


def error(code: str, message: str, details: dict[str, Any] | None = None) -> ErrorResponse:
    """Create a standardized error response."""
    return ErrorResponse(
        error=ErrorDetail(code=code, message=message, details=details),
        timestamp=datetime.now(UTC).isoformat(),
    )
