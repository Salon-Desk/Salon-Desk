import logging

from fastapi import APIRouter, HTTPException, status

from app.core.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/demo", tags=["demo"])


@router.post("/reset")
async def reset_demo() -> dict[str, str]:
    """Re-seed a fresh database for judges (clear + seed + knowledge ingest)."""
    from scripts.seed import run_seed

    settings = get_settings()
    if settings.environment == "production":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="Demo reset is disabled in production",
        )
    await run_seed(clear=True)
    try:
        from scripts.ingest_knowledge import ingest

        await ingest(clear=True)
    except Exception as exc:
        logger.warning("Knowledge ingestion skipped during demo reset: %s", exc)
    return {"detail": "demo database cleared and re-seeded"}
