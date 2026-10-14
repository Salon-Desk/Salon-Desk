import json
from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

LLMProvider = Literal["groq", "ollama", "openai"]

_DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost",
    "http://127.0.0.1:3000",
    "https://paypalai.hackathon.huludelala.com",
    "http://paypalai.hackathon.huludelala.com",
]


def _normalize_origin(origin: str) -> str:
    return origin.strip().strip('"').strip("'").rstrip("/")


def parse_cors_origins(value: object) -> list[str]:
    """Accept JSON arrays, comma-separated lists, or already-parsed lists."""
    if value is None or value == "":
        return list(_DEFAULT_CORS_ORIGINS)
    if isinstance(value, (list, tuple, set)):
        origins = [_normalize_origin(str(item)) for item in value]
        return [o for o in origins if o]
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return list(_DEFAULT_CORS_ORIGINS)
        if text.startswith("["):
            try:
                parsed = json.loads(text)
            except json.JSONDecodeError:
                # Docker --env-file sometimes leaves outer quotes; strip and retry.
                try:
                    parsed = json.loads(text.strip('"').strip("'"))
                except json.JSONDecodeError:
                    parsed = None
            if isinstance(parsed, list):
                origins = [_normalize_origin(str(item)) for item in parsed]
                return [o for o in origins if o]
        origins = [_normalize_origin(part) for part in text.split(",")]
        return [o for o in origins if o]
    return list(_DEFAULT_CORS_ORIGINS)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        # Prefer backend/.env, then repo-root .env (monorepo / Compose).
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Salon Desk"
    environment: str = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/salondesk"

    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60 * 24
    algorithm: str = "HS256"

    cors_origins: list[str] = Field(default_factory=lambda: list(_DEFAULT_CORS_ORIGINS))
    # Optional regex for preview / hackathon subdomains (Starlette CORSMiddleware).
    cors_origin_regex: str | None = r"https?://(.*\.)?huludelala\.com"

    # PayPal
    paypal_client_id: str = ""
    paypal_client_secret: str = ""
    paypal_webhook_id: str = ""
    paypal_api_base: str = "https://api-m.sandbox.paypal.com"

    # LLM — select one provider via LLM_PROVIDER
    llm_provider: LLMProvider = "groq"
    openai_api_key: str = ""
    openai_model: str = "gpt-4.1-mini"
    openai_base_url: str = "https://api.openai.com/v1"
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"
    groq_base_url: str = "https://api.groq.com/openai/v1"
    ollama_model: str = "llama3.2:1b"
    ollama_base_url: str = "http://localhost:11434/v1"
    ollama_api_key: str = "ollama"
    llm_timeout_seconds: float = Field(default=60.0, ge=1.0)

    # Embeddings / RAG (Ollama)
    ollama_host: str = "http://localhost:11434"
    ollama_embed_model: str = "all-minilm"
    rag_chunk_limit: int = Field(default=6, ge=1, le=20)
    voice_rag_timeout_s: float = Field(default=4.5, ge=0.5)
    voice_rag_chunk_limit: int = Field(default=6, ge=1, le=20)

    # LiveKit voice agent
    livekit_url: str = ""
    livekit_api_key: str = ""
    livekit_api_secret: str = ""
    livekit_agent_name: str = "salondesk-voice"
    deepgram_api_key: str = ""
    voice_stt_provider: str = "deepgram"
    voice_tts_provider: str = "deepgram"
    voice_llm_provider: LLMProvider | None = None

    # Ed25519 signing key (PEM or base64); empty = generate ephemeral in dev
    ed25519_private_key: str = ""

    @field_validator("cors_origins", mode="before")
    @classmethod
    def normalize_cors_origins(cls, value: object) -> list[str]:
        return parse_cors_origins(value)

    @field_validator("cors_origin_regex", mode="before")
    @classmethod
    def normalize_cors_origin_regex(cls, value: object) -> str | None:
        if value is None:
            return r"https?://(.*\.)?huludelala\.com"
        if isinstance(value, str):
            text = value.strip()
            if text.lower() in {"", "none", "null", "disabled", "off"}:
                return None
            return text
        return None

    @field_validator("llm_provider", mode="before")
    @classmethod
    def normalize_llm_provider(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower()
        return value

    @property
    def active_llm_model(self) -> str:
        if self.llm_provider == "openai":
            return self.openai_model
        if self.llm_provider == "ollama":
            return self.ollama_model
        return self.groq_model

    @property
    def active_llm_base_url(self) -> str:
        if self.llm_provider == "openai":
            return self.openai_base_url.rstrip("/")
        if self.llm_provider == "ollama":
            return self.ollama_base_url.rstrip("/")
        return self.groq_base_url.rstrip("/")

    @property
    def active_llm_api_key(self) -> str:
        if self.llm_provider == "openai":
            return self.openai_api_key
        if self.llm_provider == "ollama":
            # Local Ollama usually ignores auth; default placeholder is fine.
            return self.ollama_api_key or "ollama"
        return self.groq_api_key

    @property
    def active_voice_llm_provider(self) -> LLMProvider:
        return self.voice_llm_provider or self.llm_provider


@lru_cache
def get_settings() -> Settings:
    return Settings()
