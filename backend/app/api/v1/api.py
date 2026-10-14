from fastapi import APIRouter

from app.api.v1 import (
    admin,
    ai,
    auth,
    bookings,
    organizations,
    settlements,
    webhooks,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(admin.router)
api_router.include_router(organizations.router)
api_router.include_router(bookings.router)
api_router.include_router(settlements.router)
api_router.include_router(webhooks.router)
api_router.include_router(ai.router)
