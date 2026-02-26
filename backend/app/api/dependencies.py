from fastapi import Request, Depends, HTTPException
from app.core.rate_limit import check_rate_limit_shorten, check_rate_limit_api
from app.schemas.errors import RateLimitErrorResponse


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "127.0.0.1"


async def rate_limit_shorten_dependency(request: Request) -> None:
    """Strict rate limiting for URL creation."""
    ip = get_client_ip(request)
    allowed, retry_after = await check_rate_limit_shorten(ip)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=RateLimitErrorResponse(error="Rate limit exceeded", retry_after_seconds=retry_after).model_dump(),
        )


async def rate_limit_api_dependency(request: Request) -> None:
    """Moderate rate limiting for API read endpoints."""
    ip = get_client_ip(request)
    allowed, retry_after = await check_rate_limit_api(ip)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=RateLimitErrorResponse(error="Rate limit exceeded", retry_after_seconds=retry_after).model_dump(),
        )
