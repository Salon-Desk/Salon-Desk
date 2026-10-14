from fastapi import APIRouter

router = APIRouter(prefix="/settlements", tags=["settlements"])


@router.post("/{booking_id}/mark-show")
async def mark_show(booking_id: str) -> dict[str, str]:
    return {"detail": "not implemented", "booking_id": booking_id}
