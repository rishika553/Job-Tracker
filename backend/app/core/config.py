import json
import os
from typing import List
from pydantic import BeforeValidator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Annotated


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore"
    )

    PROJECT_NAME: str = "CareerTrack"
    ENV: str = "development"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # 15 minutes (short-lived access)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7    # 7 days (long-lived refresh)

    # Database
    USE_SQLITE: bool = True
    SQLITE_DB_FILE: str = "careertrack.db"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "careertrack"

    # Google OAuth Credentials
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"

    # CORS Origins (JSON list format)
    BACKEND_CORS_ORIGINS: Annotated[
        List[str],
        BeforeValidator(lambda v: json.loads(v) if isinstance(v, str) else v)
    ] = []

    @property
    def async_database_url(self) -> str:
        """Asynchronous database connection URL using asyncpg or aiosqlite."""
        if getattr(self, "USE_SQLITE", False):
            return f"sqlite+aiosqlite:///{self.SQLITE_DB_FILE}"
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def sync_database_url(self) -> str:
        """Synchronous database connection URL for Alembic migrations."""
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()
