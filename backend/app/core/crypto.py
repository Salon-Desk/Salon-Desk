import hashlib
import logging
from base64 import b64decode, b64encode
from functools import lru_cache

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def sha256_hex(data: str | bytes) -> str:
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def chain_hash(previous_hash: str, payload: str) -> str:
    """Append payload to a SHA-256 hash chain."""
    return sha256_hex(f"{previous_hash}:{payload}")


@lru_cache(maxsize=1)
def _load_or_create_private_key() -> Ed25519PrivateKey:
    settings = get_settings()
    if settings.ed25519_private_key:
        raw = b64decode(settings.ed25519_private_key)
        return Ed25519PrivateKey.from_private_bytes(raw)
    logger.warning(
        "ED25519_PRIVATE_KEY is not configured in settings; using a cached singleton key. "
        "Set ED25519_PRIVATE_KEY in production to persist signatures across restarts."
    )
    return Ed25519PrivateKey.generate()


def sign_message(message: str | bytes) -> str:
    """Sign a message with Ed25519; returns base64 signature."""
    if isinstance(message, str):
        message = message.encode("utf-8")
    private_key = _load_or_create_private_key()
    return b64encode(private_key.sign(message)).decode("ascii")


def verify_signature(
    message: str | bytes,
    signature_b64: str,
    public_key: Ed25519PublicKey | None = None,
) -> bool:
    if isinstance(message, str):
        message = message.encode("utf-8")
    if public_key is None:
        private_key = _load_or_create_private_key()
        public_key = private_key.public_key()
    try:
        public_key.verify(b64decode(signature_b64), message)
        return True
    except Exception:
        return False


def export_public_key_b64() -> str:
    private_key = _load_or_create_private_key()
    public_bytes = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    return b64encode(public_bytes).decode("ascii")
