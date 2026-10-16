from fastapi import APIRouter, HTTPException, status

from app.api.deps import OptionalUser
from app.core.exceptions import SalonDeskError
from app.schemas.chat import LiveKitTokenRequest, LiveKitTokenResponse
from app.services.livekit_tokens import create_participant_token

router = APIRouter(prefix="/livekit", tags=["livekit"])


@router.post("/token", response_model=LiveKitTokenResponse)
async def create_livekit_token(
    body: LiveKitTokenRequest,
    user: OptionalUser = None,
) -> LiveKitTokenResponse:
    """Issue a LiveKit JWT for the voice agent room (browser never sees API secret)."""
    participant_name = body.participant_name
    if not participant_name and user is not None:
        profile_name = ""
        if user.profile:
            profile_name = (
                getattr(user.profile, "full_name", None)
                or f"{getattr(user.profile, 'first_name', '')} {getattr(user.profile, 'last_name', '')}".strip()
            )
        participant_name = profile_name or f"user-{str(user.id)[:8]}"
    try:
        creds = create_participant_token(
            language=body.language,
            participant_name=participant_name,
            metadata=body.metadata,
            room_name=body.room_name,
        )
    except SalonDeskError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail=exc.message) from exc
    return LiveKitTokenResponse(
        token=creds.token,
        server_url=creds.server_url,
        room_name=creds.room_name,
    )
