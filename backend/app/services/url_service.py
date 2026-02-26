import random
import string
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from cachetools import TTLCache
from app.core.security import validate_url
from app.repositories.url_repository import UrlRepository
from app.models import Url
from app.core.config import get_settings

ALIAS_LENGTH = 6
ALIAS_CHARS = string.ascii_letters + string.digits


def _random_alias() -> str:
    return "".join(random.choices(ALIAS_CHARS, k=ALIAS_LENGTH))


class UrlService:
    def __init__(self) -> None:
        self.repo = UrlRepository()
        settings = get_settings()
        # TTL cache for hot URL lookups
        self._url_cache: TTLCache = TTLCache(
            maxsize=settings.URL_CACHE_MAX_SIZE,
            ttl=settings.URL_CACHE_TTL_SECONDS
        )
        self._cache_lock = asyncio.Lock()

    def validate_input_url(self, url: str) -> tuple[bool, str | None]:
        ok, err = validate_url(url)
        return ok, err

    async def shorten(
        self, db: AsyncSession, original_url: str, base_url: str
    ) -> tuple[str, str]:
        """Create short URL. Returns (alias, short_url). Regenerates alias on collision."""
        alias = _random_alias()
        while await self.repo.alias_exists(db, alias):
            alias = _random_alias()
        url = await self.repo.create(db, alias=alias, original_url=original_url.strip())
        short_url = f"{base_url.rstrip('/')}/{alias}"
        
        # Pre-populate cache with newly created URL
        # Object is already flushed and refreshed by repository
        async with self._cache_lock:
            self._url_cache[alias] = url
        
        return alias, short_url

    async def get_by_alias(self, db: AsyncSession, alias: str, use_cache: bool = True) -> Url | None:
        """Get URL by alias with in-memory caching for hot URLs.
        
        Note: Cached objects are merged into the current session to avoid
        SQLAlchemy session binding issues.
        """
        # Check cache first
        if use_cache:
            async with self._cache_lock:
                if alias in self._url_cache:
                    cached_url = self._url_cache[alias]
                    # Merge cached object into current session
                    # load=False means don't query DB, just attach to session
                    return await db.run_sync(lambda session: session.merge(cached_url, load=False))
        
        # Cache miss - fetch from DB
        url = await self.repo.get_by_alias(db, alias)
        
        # Store in cache for future requests
        if url and use_cache:
            async with self._cache_lock:
                self._url_cache[alias] = url
        
        return url

    async def list_all(self, db: AsyncSession) -> list[tuple[Url, int]]:
        return await self.repo.list_all_ordered(db)

    async def update_url(self, db: AsyncSession, url: Url, new_url: str) -> Url:
        """Update the original URL of an existing short link."""
        updated_url = await self.repo.update_original_url(db, url, new_url)
        
        # Invalidate cache entry for this alias
        async with self._cache_lock:
            self._url_cache.pop(url.alias, None)
        
        return updated_url

    async def archive_url(self, db: AsyncSession, url: Url, archived: bool) -> Url:
        """Archive or unarchive a URL."""
        updated_url = await self.repo.toggle_archive(db, url, archived)
        
        # Invalidate cache entry for this alias
        async with self._cache_lock:
            self._url_cache.pop(url.alias, None)
        
        return updated_url

    async def delete_url(self, db: AsyncSession, url: Url) -> None:
        """Delete a URL and all its clicks."""
        await self.repo.delete(db, url)
        
        # Remove from cache
        async with self._cache_lock:
            self._url_cache.pop(url.alias, None)
