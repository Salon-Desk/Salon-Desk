from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser
from app.core.exceptions import SalonDeskError
from app.schemas.chat import LiveKitTokenRequest, LiveKitTokenResponse
from app.services.livekit_tokens import create_participant_token

router = APIRouter(prefix="/livekit", tags=["livekit"])


@router.post("/token", response_model=LiveKitTokenResponse)
async def create_livekit_token(
    body: LiveKitTokenRequest,
    user: CurrentUser,
) -> LiveKitTokenResponse:
    """Issue a LiveKit JWT for the voice agent room (browser never sees API secret)."""
    _ = user
    try:
        creds = create_participant_token(
            language=body.language,
            participant_name=body.participant_name,
            metadata=body.metadata,
        )
    except SalonDeskError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail=exc.message) from exc
    return LiveKitTokenResponse(
        token=creds.token,
        server_url=creds.server_url,
        room_name=creds.room_name,
    )
