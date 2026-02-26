from datetime import date, timedelta
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from cachetools import TTLCache
from app.repositories.url_repository import UrlRepository
from app.repositories.click_repository import ClickRepository
from app.core.config import get_settings

DAYS = 7


class AnalyticsService:
    def __init__(self) -> None:
        self.url_repo = UrlRepository()
        self.click_repo = ClickRepository()
        settings = get_settings()
        # TTL cache for analytics queries
        self._analytics_cache: TTLCache = TTLCache(
            maxsize=settings.ANALYTICS_CACHE_MAX_SIZE,
            ttl=settings.ANALYTICS_CACHE_TTL_SECONDS
        )
        self._cache_lock = asyncio.Lock()

    def _date_range(self) -> tuple[date, date]:
        end = date.today()
        start = end - timedelta(days=DAYS - 1)
        return start, end

    def _zero_filled_days(self) -> list[tuple[str, int]]:
        start, end = self._date_range()
        out: list[tuple[str, int]] = []
        d = start
        while d <= end:
            out.append((d.strftime("%Y-%m-%d"), 0))
            d += timedelta(days=1)
        return out

    async def get_clicks_by_day(
        self, db: AsyncSession, alias: str, use_cache: bool = True
    ) -> list[tuple[str, int]] | None:
        """
        Returns list of (date_str YYYY-MM-DD, count) for last 7 days, zero-filled.
        Returns None if alias not found.
        Cached for 60 seconds to reduce expensive aggregation queries.
        """
        # Check cache first
        if use_cache:
            async with self._cache_lock:
                if alias in self._analytics_cache:
                    return self._analytics_cache[alias]
        
        url = await self.url_repo.get_by_alias(db, alias)
        if not url:
            return None

        start, end = self._date_range()
        counts = await self.click_repo.count_by_url_and_date_range(
            db, url.id, start, end
        )
        # Handle date format - SQLite returns strings from func.date()
        by_date = {}
        for d, c in counts:
            date_str = d.strftime("%Y-%m-%d") if hasattr(d, 'strftime') else str(d)
            by_date[date_str] = c
        
        result = self._zero_filled_days()
        result = [(d, by_date.get(d, 0)) for d, _ in result]
        
        # Store in cache
        if use_cache:
            async with self._cache_lock:
                self._analytics_cache[alias] = result
        
        return result
