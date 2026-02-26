import re
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.url_service import UrlService
from app.repositories.click_repository import ClickRepository

router = APIRouter(tags=["redirect"])
url_service = UrlService()
click_repo = ClickRepository()
ALIAS_PATTERN = re.compile(r"^[a-zA-Z0-9]{6}$")


@router.get(
    "/{alias}",
    status_code=302,
    summary="Redirect to original URL",
    description=(
        "Resolves a 6-character alphanumeric alias to its original destination URL "
        "and issues an HTTP **302 Found** redirect.\n\n"
        "Each successful redirect is recorded as a click for analytics purposes."
    ),
    response_description="Redirect to the destination URL.",
    responses={
        302: {"description": "Redirect to the original destination URL."},
        404: {
            "description": "Alias not found or invalid format.",
            "content": {
                "application/json": {"example": {"detail": "Not found"}}
            },
        },
    },
    include_in_schema=True,
)
async def redirect_to_url(
    alias: str,
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    if not alias or not ALIAS_PATTERN.match(alias):
        raise HTTPException(status_code=404, detail="Not found")
    url = await url_service.get_by_alias(db, alias)
    if url is None:
        raise HTTPException(status_code=404, detail="Not found")
    await click_repo.create(db, url_id=url.id)
    return RedirectResponse(url=url.original_url, status_code=302)