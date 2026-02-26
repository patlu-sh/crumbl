from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.analytics import AnalyticsResponse, DayCount
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])
analytics_service = AnalyticsService()


@router.get(
    "/{alias}",
    response_model=AnalyticsResponse,
    summary="Get click analytics for an alias",
    description=(
        "Returns click counts broken down by calendar day for the **last 7 days**.\n\n"
        "Results are cached; cache is invalidated when a new redirect is recorded."
    ),
    response_description="Analytics data with per-day click counts.",
    responses={
        404: {
            "description": "Alias not found.",
            "content": {
                "application/json": {"example": {"detail": "Alias not found"}}
            },
        }
    },
)
async def get_analytics(
    alias: str,
    db: AsyncSession = Depends(get_db),
) -> AnalyticsResponse:
    data = await analytics_service.get_clicks_by_day(db, alias, use_cache=True)
    if data is None:
        raise HTTPException(status_code=404, detail="Alias not found")
    return AnalyticsResponse(
        alias=alias,
        clicks_by_day=[DayCount(date=d, clicks=c) for d, c in data],
    )
