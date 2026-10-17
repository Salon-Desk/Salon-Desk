import logging
import mimetypes
import uuid

import anyio
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class StorageService:
    """S3-compatible object storage service (RustFS) with sync/async interfaces."""

    def __init__(self) -> None:
        self._client = None

    def get_client(self):
        if self._client is None:
            settings = get_settings()
            self._client = boto3.client(
                "s3",
                endpoint_url=settings.rustfs_endpoint_url,
                aws_access_key_id=settings.rustfs_access_key,
                aws_secret_access_key=settings.rustfs_secret_key,
                region_name=settings.rustfs_region,
                config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
            )
        return self._client

    def ensure_bucket_exists(self, bucket_name: str | None = None) -> bool:
        settings = get_settings()
        bucket = bucket_name or settings.rustfs_bucket
        client = self.get_client()
        try:
            client.head_bucket(Bucket=bucket)
            return True
        except ClientError:
            try:
                client.create_bucket(Bucket=bucket)
                logger.info("Created RustFS bucket: %s", bucket)
                return True
            except Exception as create_exc:
                logger.error("Failed to create bucket %s: %s", bucket, create_exc)
                return False
        except Exception as exc:
            logger.warning("Error checking bucket %s: %s", bucket, exc)
            return False

    def upload_bytes(
        self,
        data: bytes,
        filename: str,
        content_type: str | None = None,
        folder: str = "uploads",
        bucket_name: str | None = None,
    ) -> tuple[str, str]:
        """
        Upload raw bytes to RustFS.
        Returns a tuple of (object_key, public_url).
        """
        settings = get_settings()
        bucket = bucket_name or settings.rustfs_bucket
        self.ensure_bucket_exists(bucket)

        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
        clean_ext = "".join(c for c in ext if c.isalnum()) or "bin"
        unique_id = uuid.uuid4().hex
        key = f"{folder}/{unique_id}.{clean_ext}"

        if not content_type:
            guessed, _ = mimetypes.guess_type(filename)
            content_type = guessed or "application/octet-stream"

        client = self.get_client()
        client.put_object(
            Bucket=bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )

        base_url = settings.storage_public_base_url.rstrip("/")
        public_url = f"{base_url}/{bucket}/{key}"
        return key, public_url

    def get_object(self, key: str, bucket_name: str | None = None) -> tuple[bytes, str]:
        settings = get_settings()
        bucket = bucket_name or settings.rustfs_bucket
        client = self.get_client()
        resp = client.get_object(Bucket=bucket, Key=key)
        body = resp["Body"].read()
        content_type = resp.get("ContentType", "application/octet-stream")
        return body, content_type

    def delete_object(self, key: str, bucket_name: str | None = None) -> bool:
        settings = get_settings()
        bucket = bucket_name or settings.rustfs_bucket
        client = self.get_client()
        try:
            client.delete_object(Bucket=bucket, Key=key)
            return True
        except Exception as exc:
            logger.warning("Failed to delete object %s: %s", key, exc)
            return False

    # Async wrappers using anyio.to_thread.run_sync
    async def async_ensure_bucket(self, bucket_name: str | None = None) -> bool:
        return await anyio.to_thread.run_sync(self.ensure_bucket_exists, bucket_name)

    async def async_upload_bytes(
        self,
        data: bytes,
        filename: str,
        content_type: str | None = None,
        folder: str = "uploads",
        bucket_name: str | None = None,
    ) -> tuple[str, str]:
        return await anyio.to_thread.run_sync(
            self.upload_bytes, data, filename, content_type, folder, bucket_name
        )

    async def async_get_object(self, key: str, bucket_name: str | None = None) -> tuple[bytes, str]:
        return await anyio.to_thread.run_sync(self.get_object, key, bucket_name)

    async def async_delete_object(self, key: str, bucket_name: str | None = None) -> bool:
        return await anyio.to_thread.run_sync(self.delete_object, key, bucket_name)


storage_service = StorageService()
