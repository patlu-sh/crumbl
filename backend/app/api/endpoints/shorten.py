from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.dependencies import rate_limit_shorten_dependency, get_client_ip
from app.schemas.shorten import ShortenRequest, ShortenResponse
from app.schemas.errors import RateLimitErrorResponse
from app.services.url_service import UrlService

router = APIRouter(prefix="/shorten", tags=["shorten"])
url_service = UrlService()

_ERROR_RESPONSES = {
    400: {
        "description": "Invalid or unsupported URL.",
        "content": {
            "application/json": {
                "example": {"detail": "Invalid URL: scheme must be http or https"}
            }
        },
    },
    429: {
        "description": "Rate limit exceeded — too many shortening requests.",
        "model": RateLimitErrorResponse,
    },
}


@router.post(
    "",
    response_model=ShortenResponse,
    status_code=201,
    summary="Shorten a URL",
    description=(
        "Accepts a long URL and returns a short alias.\n\n"
        "The alias is a random 6-character alphanumeric string.\n\n"
        "This endpoint is **rate-limited**. When the limit is hit the response "
        "is `429 Too Many Requests` and the body contains `retry_after_seconds`."
    ),
    response_description="Short URL successfully created.",
    responses=_ERROR_RESPONSES,
    dependencies=[Depends(rate_limit_shorten_dependency)],
)
async def shorten(
    body: ShortenRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> ShortenResponse:
    ok, err = url_service.validate_input_url(body.url)
    if not ok:
        raise HTTPException(status_code=400, detail=err or "Invalid URL")
    base_url = str(request.base_url).rstrip("/")
    alias, short_url = await url_service.shorten(db, body.url, base_url)
    return ShortenResponse(alias=alias, short_url=short_url)
