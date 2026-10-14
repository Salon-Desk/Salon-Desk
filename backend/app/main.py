from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import demo, health
from app.api.v1.api import api_router
from app.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        debug=settings.debug,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Docker / hosting healthcheck expects GET /health
    application.include_router(health.router)
    # Judge demo reset lives at /api/demo/reset
    application.include_router(demo.router, prefix="/api")
    application.include_router(api_router, prefix=settings.api_v1_prefix)

    return application


app = create_app()
