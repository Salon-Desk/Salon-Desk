from fastapi import APIRouter

from app.api.v1 import demo
from app.api.v1.client import assistant, bookings, catalog, chat, livekit, payments
from app.api.v1.org import (
    bookings as org_bookings,
)
from app.api.v1.org import (
    employees,
    finance,
    onboarding,
    settlements,
)
from app.api.v1.org import (
    services as org_services,
)
from app.api.v1.org import (
    settings as org_settings,
)
from app.api.v1.platform import analytics, categories, commissions, orgs, requests, users
from app.api.v1.shared import auth, profile, storage
from app.api.v1.webhooks import paypal

api_router = APIRouter()

# Shared (all portals)
api_router.include_router(auth.router)
api_router.include_router(profile.router)
api_router.include_router(storage.router)

# Platform admin dashboard
for platform_router in (
    analytics.router,
    orgs.router,
    users.router,
    categories.router,
    commissions.router,
    requests.router,
):
    api_router.include_router(platform_router)

# Organization portal
api_router.include_router(onboarding.router)
api_router.include_router(org_settings.router)
api_router.include_router(employees.router)
api_router.include_router(org_services.router)
api_router.include_router(org_bookings.router)
api_router.include_router(settlements.router)
api_router.include_router(finance.router)

# Client application
api_router.include_router(catalog.router)
api_router.include_router(bookings.router)
api_router.include_router(payments.router)
api_router.include_router(chat.router)
api_router.include_router(livekit.router)
api_router.include_router(assistant.router)

# External webhooks
api_router.include_router(paypal.router)

# Demo reset (non-prod only)
api_router.include_router(demo.router)
