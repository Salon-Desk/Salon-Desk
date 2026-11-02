import asyncio
import json
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1 import demo
from app.api.v1.api import api_router
from app.api.v1.shared import health
from app.core.config import get_settings
from app.core.exceptions import (
    ForbiddenError,
    NotFoundError,
    PolicyViolationException,
    SalonDeskError,
    UnauthorizedError,
)
from app.core.response import error
from app.tasks.booking_reminders import run_booking_reminder_loop
from app.tasks.hold_expiration import run_hold_expiration_loop


@asynccontextmanager
async def lifespan(_application: FastAPI):
    hold_task = asyncio.create_task(run_hold_expiration_loop())
    reminder_task = asyncio.create_task(run_booking_reminder_loop())
    try:
        yield
    finally:
        hold_task.cancel()
        reminder_task.cancel()
        await asyncio.gather(hold_task, reminder_task, return_exceptions=True)


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        debug=settings.debug,
        lifespan=lifespan,
    )

    @application.middleware("http")
    async def standardize_response_middleware(request: Request, call_next) -> Response:
        response = await call_next(request)

        # Do not alter no-content responses
        if response.status_code in (204, 304):
            return response

        # Skip documentation, health, and storage binary endpoints
        path = request.url.path
        if path in ("/docs", "/redoc", "/openapi.json", "/health") or path.startswith(
            "/api/v1/storage"
        ):
            return response

        # Only process JSON responses
        content_type = response.headers.get("content-type", "")
        if "application/json" not in content_type:
            return response

        # Consume the response body
        body = [chunk async for chunk in response.body_iterator]
        body_bytes = b"".join(body)

        try:
            data = json.loads(body_bytes.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return Response(
                content=body_bytes,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type="application/json",
            )

        # Skip if already standardized (has "success" field)
        if isinstance(data, dict) and "success" in data:
            return Response(
                content=body_bytes,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type="application/json",
            )

        status_code = response.status_code
        is_success = 200 <= status_code < 300

        if is_success:
            message = data.get("message") if isinstance(data, dict) else None
            wrapped = {
                "success": True,
                "data": data,
                "message": message,
                "timestamp": datetime.now(UTC).isoformat(),
            }
        else:
            error_message = None
            if isinstance(data, dict):
                error_message = data.get("detail") or data.get("message") or str(data)

            wrapped = {
                "success": False,
                "error": {
                    "code": f"HTTP_{status_code}",
                    "message": error_message or f"HTTP {status_code} error",
                    "details": data if isinstance(data, dict) and not error_message else None,
                },
                "timestamp": datetime.now(UTC).isoformat(),
            }

        wrapped_bytes = json.dumps(wrapped).encode("utf-8")
        headers = dict(response.headers)
        headers["content-length"] = str(len(wrapped_bytes))
        return Response(
            content=wrapped_bytes,
            status_code=status_code,
            headers=headers,
            media_type="application/json",
        )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=settings.cors_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    @application.exception_handler(NotFoundError)
    async def not_found_handler(_request: Request, exc: NotFoundError) -> JSONResponse:
        return JSONResponse(
            status_code=404,
            content=error(code="NOT_FOUND", message=exc.message).model_dump(),
        )

    @application.exception_handler(UnauthorizedError)
    async def unauthorized_handler(_request: Request, exc: UnauthorizedError) -> JSONResponse:
        return JSONResponse(
            status_code=401,
            content=error(code="UNAUTHORIZED", message=exc.message).model_dump(),
        )

    @application.exception_handler(ForbiddenError)
    async def forbidden_handler(_request: Request, exc: ForbiddenError) -> JSONResponse:
        return JSONResponse(
            status_code=403,
            content=error(code="FORBIDDEN", message=exc.message).model_dump(),
        )

    @application.exception_handler(PolicyViolationException)
    async def policy_handler(_request: Request, exc: PolicyViolationException) -> JSONResponse:
        return JSONResponse(
            status_code=getattr(exc, "status_code", 400),
            content=error(code=exc.code or "POLICY_VIOLATION", message=exc.message).model_dump(),
        )

    @application.exception_handler(SalonDeskError)
    async def app_error_handler(_request: Request, exc: SalonDeskError) -> JSONResponse:
        return JSONResponse(
            status_code=400,
            content=error(code="BAD_REQUEST", message=exc.message).model_dump(),
        )

    @application.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        _request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=error(
                code="HTTP_ERROR",
                message=exc.detail if isinstance(exc.detail, str) else str(exc.detail),
            ).model_dump(),
        )

    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=error(
                code="VALIDATION_ERROR",
                message="Request validation failed",
                details={"errors": exc.errors()},
            ).model_dump(),
        )

    application.include_router(health.router)
    application.include_router(api_router, prefix=settings.api_v1_prefix)
    # Expose both /api/v1/demo/reset (via api_router) and /api/demo/reset (legacy proxy)
    application.add_api_route(
        "/api/demo/reset",
        demo.reset_demo,
        methods=["POST"],
        include_in_schema=False,
    )

    return application


app = create_app()
