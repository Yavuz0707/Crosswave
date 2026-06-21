"""Application settings loaded from environment variables / .env."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralized, validated configuration.

    Values are read from environment variables (and a local ``.env`` file in
    development). See ``.env.example`` for the full list.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ---- App ----
    app_env: str = "development"
    app_name: str = "Crosswave API"
    api_v1_prefix: str = "/api/v1"

    # ---- Database ----
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/crosswave",
        description="Async SQLAlchemy database URL (asyncpg driver).",
    )
    db_echo: bool = False

    # ---- Auth (JWT) ----
    jwt_secret: str = Field(default="change-me", min_length=1)
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 1 day

    # ---- YouTube Data API v3 ----
    youtube_api_key: str | None = None
    youtube_api_base_url: str = "https://www.googleapis.com/youtube/v3"

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() in {"production", "prod"}


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()


settings = get_settings()
