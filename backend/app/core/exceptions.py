class SalonDeskError(Exception):
    """Base application error."""

    def __init__(self, message: str = "An application error occurred") -> None:
        self.message = message
        super().__init__(message)


class PolicyViolationException(SalonDeskError):
    """Raised when a deterministic policy rule is violated."""

    def __init__(
        self,
        message: str = "Policy violation",
        code: str | None = None,
        status_code: int = 400,
        **kwargs,
    ) -> None:
        if "message" in kwargs:
            message = kwargs.pop("message")
        if "code" in kwargs and not code:
            code = kwargs.pop("code")
        if "status_code" in kwargs:
            status_code = kwargs.pop("status_code")
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(SalonDeskError):
    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message)


class UnauthorizedError(SalonDeskError):
    def __init__(self, message: str = "Unauthorized") -> None:
        super().__init__(message)


class ForbiddenError(SalonDeskError):
    def __init__(self, message: str = "Forbidden") -> None:
        super().__init__(message)


class ConflictError(SalonDeskError):
    def __init__(self, message: str = "Resource conflict") -> None:
        super().__init__(message)
