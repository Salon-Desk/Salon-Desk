from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
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

    cors_origins: list[str] = ["http://localhost:3000"]

    # PayPal
    paypal_client_id: str = ""
    paypal_client_secret: str = ""
    paypal_webhook_id: str = ""
    paypal_api_base: str = "https://api-m.sandbox.paypal.com"

    # AI providers
    deepseek_api_key: str = ""
    groq_api_key: str = ""
    gemini_api_key: str = ""

    # Ed25519 signing key (PEM or base64); empty = generate ephemeral in dev
    ed25519_private_key: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
