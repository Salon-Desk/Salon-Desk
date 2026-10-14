from fastapi import APIRouter

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/salons/pending")
async def list_pending_salons() -> dict[str, str]:
    return {"detail": "not implemented"}
