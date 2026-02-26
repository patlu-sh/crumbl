from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "sqlite+aiosqlite:///./shortener.db"
    API_STR: str = "/api"

    # Rate limiting (in-memory)
    RATE_LIMIT_SHORTEN_REQUESTS: int = 5
    RATE_LIMIT_SHORTEN_WINDOW: int = 60
    RATE_LIMIT_API_REQUESTS: int = 20
    RATE_LIMIT_API_WINDOW: int = 60

    # Caching (in-memory)
    URL_CACHE_MAX_SIZE: int = 10000  # Cache up to 10k URLs
    URL_CACHE_TTL_SECONDS: int = 600  # 10 minutes
    ANALYTICS_CACHE_MAX_SIZE: int = 1000  # Cache up to 1k analytics results
    ANALYTICS_CACHE_TTL_SECONDS: int = 60  # 1 minute


@lru_cache
def get_settings() -> Settings:
    return Settings()
