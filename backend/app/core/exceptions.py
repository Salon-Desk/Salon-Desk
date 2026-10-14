class SalonDeskError(Exception):
    """Base application error."""

    def __init__(self, message: str = "An application error occurred") -> None:
        self.message = message
        super().__init__(message)


class PolicyViolationException(SalonDeskError):
    """Raised when a deterministic policy rule is violated."""

    def __init__(self, message: str = "Policy violation") -> None:
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
