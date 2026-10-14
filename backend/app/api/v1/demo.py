from fastapi import APIRouter, HTTPException, status

from app.core.config import get_settings
from app.scripts.seed import run_seed

router = APIRouter(prefix="/demo", tags=["demo"])


@router.post("/reset")
async def reset_demo() -> dict[str, str]:
    """Re-seed a fresh database for judges (clear + seed)."""
    settings = get_settings()
    if settings.environment == "production":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="Demo reset is disabled in production",
        )
    await run_seed(clear=True)
    return {"detail": "demo database cleared and re-seeded"}
