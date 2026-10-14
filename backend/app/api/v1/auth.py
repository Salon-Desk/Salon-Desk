from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/sign-up")
async def sign_up() -> dict[str, str]:
    return {"detail": "not implemented"}


@router.post("/sign-in")
async def sign_in() -> dict[str, str]:
    return {"detail": "not implemented"}


@router.post("/demo")
async def judge_demo_auth() -> dict[str, str]:
    """1-click Judge Demo auth."""
    return {"detail": "not implemented"}
