from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import demo, health
from app.api.v1.api import api_router
from app.core.config import get_settings
from app.core.exceptions import (
    ForbiddenError,
    NotFoundError,
    PolicyViolationException,
    SalonDeskError,
    UnauthorizedError,
)


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        debug=settings.debug,
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
        return JSONResponse(status_code=404, content={"detail": exc.message})

    @application.exception_handler(UnauthorizedError)
    async def unauthorized_handler(_request: Request, exc: UnauthorizedError) -> JSONResponse:
        return JSONResponse(status_code=401, content={"detail": exc.message})

    @application.exception_handler(ForbiddenError)
    async def forbidden_handler(_request: Request, exc: ForbiddenError) -> JSONResponse:
        return JSONResponse(status_code=403, content={"detail": exc.message})

    @application.exception_handler(PolicyViolationException)
    async def policy_handler(_request: Request, exc: PolicyViolationException) -> JSONResponse:
        return JSONResponse(status_code=400, content={"detail": exc.message})

    @application.exception_handler(SalonDeskError)
    async def app_error_handler(_request: Request, exc: SalonDeskError) -> JSONResponse:
        return JSONResponse(status_code=400, content={"detail": exc.message})

    application.include_router(health.router)
    application.include_router(demo.router, prefix="/api")
    application.include_router(api_router, prefix=settings.api_v1_prefix)

    return application


app = create_app()
