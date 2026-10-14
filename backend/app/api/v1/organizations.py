from fastapi import APIRouter

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("/me")
async def get_my_organization() -> dict[str, str]:
    return {"detail": "not implemented"}
