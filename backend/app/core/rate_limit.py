from typing import Tuple
from collections import defaultdict
from datetime import datetime, timedelta, timezone
import asyncio
from app.core.config import get_settings

_settings = get_settings()


class InMemoryRateLimiter:
    """Fixed-window rate limiter using in-memory storage."""

    def __init__(self):
        self._requests: dict[str, list[datetime]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def check_rate_limit(
        self, ip: str, limit: int, window_seconds: int, bucket: str = "default"
    ) -> Tuple[bool, int]:
        """
        Check if request is allowed. Returns (allowed, retry_after_seconds).
        """
        key = f"{bucket}:{ip}"
        async with self._lock:
            now = datetime.now(timezone.utc)
            cutoff = now - timedelta(seconds=window_seconds)

            if key in self._requests:
                self._requests[key] = [
                    req_time for req_time in self._requests[key] if req_time > cutoff
                ]

            request_count = len(self._requests[key])

            if request_count >= limit:
                oldest = self._requests[key][0]
                retry_after = int(
                    (oldest + timedelta(seconds=window_seconds) - now).total_seconds()
                )
                return False, max(0, retry_after)

            self._requests[key].append(now)
            return True, 0

    def reset(self):
        """Reset all rate limit data - useful for testing."""
        self._requests.clear()


_rate_limiter = InMemoryRateLimiter()


async def check_rate_limit_shorten(ip: str) -> Tuple[bool, int]:
    return await _rate_limiter.check_rate_limit(
        ip,
        _settings.RATE_LIMIT_SHORTEN_REQUESTS,
        _settings.RATE_LIMIT_SHORTEN_WINDOW,
        bucket="shorten",
    )


async def check_rate_limit_api(ip: str) -> Tuple[bool, int]:
    return await _rate_limiter.check_rate_limit(
        ip,
        _settings.RATE_LIMIT_API_REQUESTS,
        _settings.RATE_LIMIT_API_WINDOW,
        bucket="api",
    )
