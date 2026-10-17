import logging

from botocore.exceptions import ClientError
from fastapi import APIRouter, HTTPException, Response, status

from app.services.storage_service import storage_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/storage", tags=["storage"])


@router.get("/{bucket}/{key:path}")
async def get_storage_object(bucket: str, key: str) -> Response:
    """Stream object from RustFS object storage bucket."""
    try:
        data, content_type = await storage_service.async_get_object(key=key, bucket_name=bucket)
        return Response(
            content=data,
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=86400",
            },
        )
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "")
        if code in ("NoSuchKey", "404", "NotFound"):
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Object not found") from exc
        logger.warning("Error fetching object %s from bucket %s: %s", key, bucket, exc)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail="Object storage error") from exc
    except Exception as exc:
        logger.warning("Failed to retrieve storage object %s/%s: %s", bucket, key, exc)
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Object not found") from exc
