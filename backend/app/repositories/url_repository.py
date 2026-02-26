from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Url, Click


class UrlRepository:
    async def get_by_id(self, db: AsyncSession, id: int) -> Url | None:
        result = await db.execute(select(Url).where(Url.id == id))
        return result.scalars().one_or_none()

    async def get_by_alias(self, db: AsyncSession, alias: str) -> Url | None:
        result = await db.execute(select(Url).where(Url.alias == alias))
        return result.scalars().one_or_none()

    async def alias_exists(self, db: AsyncSession, alias: str) -> bool:
        result = await db.execute(select(Url.id).where(Url.alias == alias).limit(1))
        return result.scalar() is not None

    async def create(self, db: AsyncSession, alias: str, original_url: str) -> Url:
        url = Url(alias=alias, original_url=original_url)
        db.add(url)
        await db.flush()
        await db.refresh(url)
        return url

    async def list_all_ordered(self, db: AsyncSession) -> list[tuple[Url, int]]:
        """List all URLs with total_clicks, ORDER BY created_at DESC."""
        subq = (
            select(Click.url_id, func.count(Click.id).label("total_clicks"))
            .group_by(Click.url_id)
        ).subquery()
        stmt = (
            select(Url, func.coalesce(subq.c.total_clicks, 0).label("total_clicks"))
            .outerjoin(subq, Url.id == subq.c.url_id)
            .order_by(Url.created_at.desc())
        )
        result = await db.execute(stmt)
        rows = result.all()
        return [(row[0], int(row[1])) for row in rows]

    async def update_original_url(self, db: AsyncSession, url: Url, new_url: str) -> Url:
        """Update the original URL."""
        url.original_url = new_url
        await db.flush()
        await db.refresh(url)
        return url

    async def toggle_archive(self, db: AsyncSession, url: Url, archived: bool) -> Url:
        """Archive or unarchive a URL."""
        url.archived = archived
        await db.flush()
        await db.refresh(url)
        return url

    async def delete(self, db: AsyncSession, url: Url) -> None:
        """Delete a URL (and cascade delete all clicks)."""
        await db.delete(url)
        await db.flush()
