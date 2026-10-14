from fastapi import APIRouter

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.get("/")
async def list_bookings() -> dict[str, str]:
    return {"detail": "not implemented"}
