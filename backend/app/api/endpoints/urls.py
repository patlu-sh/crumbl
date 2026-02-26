from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.urls import UrlListItem, UpdateUrlRequest, ArchiveUrlRequest
from app.services.url_service import UrlService

router = APIRouter(prefix="/urls", tags=["urls"])
url_service = UrlService()

_404 = {
    "description": "Alias not found.",
    "content": {
        "application/json": {"example": {"detail": "URL not found"}}
    },
}
_400 = {
    "description": "New destination URL is invalid.",
    "content": {
        "application/json": {
            "example": {"detail": "Invalid URL: scheme must be http or https"}
        }
    },
}


@router.get(
    "",
    response_model=list[UrlListItem],
    summary="List all short URLs",
    description="Returns every short URL in the system with its alias, original destination, total click count, and archived status.",
    response_description="Array of URL records.",
)
async def list_urls(db: AsyncSession = Depends(get_db)) -> list[UrlListItem]:
    rows = await url_service.list_all(db)
    return [
        UrlListItem(
            alias=url.alias,
            original_url=url.original_url,
            total_clicks=total_clicks,
            archived=url.archived,
        )
        for url, total_clicks in rows
    ]


@router.patch(
    "/{alias}",
    response_model=UrlListItem,
    summary="Update a URL's destination",
    description="Changes the original destination URL for an existing alias. The alias itself is not modified.",
    response_description="Updated URL record.",
    responses={400: _400, 404: _404},
)
async def update_url(
    alias: str,
    body: UpdateUrlRequest,
    db: AsyncSession = Depends(get_db),
) -> UrlListItem:
    url = await url_service.get_by_alias(db, alias)
    if not url:
        raise HTTPException(status_code=404, detail="URL not found")
    
    # Validate the new URL
    ok, err = url_service.validate_input_url(body.original_url)
    if not ok:
        raise HTTPException(status_code=400, detail=err or "Invalid URL")
    
    updated_url = await url_service.update_url(db, url, body.original_url)
    await db.commit()
    
    # Get total clicks for response
    rows = await url_service.list_all(db)
    for u, clicks in rows:
        if u.alias == alias:
            return UrlListItem(
                alias=updated_url.alias,
                original_url=updated_url.original_url,
                total_clicks=clicks,
                archived=updated_url.archived,
            )
    
    return UrlListItem(
        alias=updated_url.alias,
        original_url=updated_url.original_url,
        total_clicks=0,
        archived=updated_url.archived,
    )


@router.patch(
    "/{alias}/archive",
    response_model=UrlListItem,
    summary="Archive or restore a URL",
    description="Sets the `archived` flag on a URL. Archived URLs still redirect but are hidden from the default list view.",
    response_description="Updated URL record with the new archived status.",
    responses={404: _404},
)
async def archive_url(
    alias: str,
    body: ArchiveUrlRequest,
    db: AsyncSession = Depends(get_db),
) -> UrlListItem:
    url = await url_service.get_by_alias(db, alias)
    if not url:
        raise HTTPException(status_code=404, detail="URL not found")
    
    updated_url = await url_service.archive_url(db, url, body.archived)
    await db.commit()
    
    # Get total clicks for response
    rows = await url_service.list_all(db)
    for u, clicks in rows:
        if u.alias == alias:
            return UrlListItem(
                alias=updated_url.alias,
                original_url=updated_url.original_url,
                total_clicks=clicks,
                archived=updated_url.archived,
            )
    
    return UrlListItem(
        alias=updated_url.alias,
        original_url=updated_url.original_url,
        total_clicks=0,
        archived=updated_url.archived,
    )


@router.delete(
    "/{alias}",
    status_code=204,
    summary="Delete a short URL",
    description="Permanently removes a short URL and all its associated click data. **This action cannot be undone.**",
    response_description="URL deleted — no content returned.",
    responses={404: _404},
)
async def delete_url(
    alias: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    url = await url_service.get_by_alias(db, alias)
    if not url:
        raise HTTPException(status_code=404, detail="URL not found")
    
    await url_service.delete_url(db, url)
    await db.commit()
