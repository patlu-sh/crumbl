from datetime import datetime, date
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Click


class ClickRepository:
    async def create(self, db: AsyncSession, url_id: int) -> Click:
        click = Click(url_id=url_id)
        db.add(click)
        await db.flush()
        await db.refresh(click)
        return click

    async def count_by_url_and_date_range(
        self, db: AsyncSession, url_id: int, start: date, end: date
    ) -> list[tuple[date, int]]:
        """Returns list of (date, count) for each day in [start, end] that has clicks."""
        stmt = (
            select(
                func.date(Click.clicked_at).label("day"),
                func.count(Click.id).label("cnt"),
            )
            .where(
                Click.url_id == url_id,
                func.date(Click.clicked_at) >= start,
                func.date(Click.clicked_at) <= end,
            )
            .group_by(func.date(Click.clicked_at))
        )
        result = await db.execute(stmt)
        return [(row[0], row[1]) for row in result.all()]
