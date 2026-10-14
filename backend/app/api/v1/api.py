from fastapi import APIRouter

from app.api.v1 import (
    admin,
    ai,
    auth,
    bookings,
    catalog,
    chat,
    livekit,
    organizations,
    payments,
    settlements,
    webhooks,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(catalog.router)
api_router.include_router(admin.router)
api_router.include_router(organizations.router)
api_router.include_router(bookings.router)
api_router.include_router(payments.router)
api_router.include_router(settlements.router)
api_router.include_router(webhooks.router)
api_router.include_router(ai.router)
api_router.include_router(chat.router)
api_router.include_router(livekit.router)
