from fastapi import APIRouter

from app.api.deps import DbSession, PlatformAdmin
from app.schemas.platform import AdminDashboardOut
from app.services import analytics_service

router = APIRouter(prefix="/admin", tags=["platform"])


@router.get("/dashboard", response_model=AdminDashboardOut)
async def dashboard(user: PlatformAdmin, db: DbSession) -> AdminDashboardOut:
    _ = user
    return await analytics_service.get_admin_dashboard(db)
