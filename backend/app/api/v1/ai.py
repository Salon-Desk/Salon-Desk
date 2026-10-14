from fastapi import APIRouter

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/booking-assistant")
async def booking_assistant() -> dict[str, str]:
    return {"detail": "not implemented"}


@router.post("/owner-copilot")
async def owner_copilot() -> dict[str, str]:
    return {"detail": "not implemented"}
