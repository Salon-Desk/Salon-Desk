from fastapi import APIRouter

router = APIRouter(prefix="/demo", tags=["demo"])


@router.post("/reset")
async def reset_demo() -> dict[str, str]:
    """Re-seed a fresh database for judges."""
    return {"detail": "not implemented"}
