import asyncio
import os
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Use in-memory SQLite before app imports so engine picks it up
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
from app.core.config import get_settings
get_settings.cache_clear()

from app.main import app
from app.core.database import get_db, Base

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, future=True)
TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def db_session():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()
        await session.close()


@pytest_asyncio.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    async def override_rate_limit():
        pass  # No-op: disable rate limiting in tests

    from app.api.dependencies import rate_limit_shorten_dependency, rate_limit_api_dependency
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[rate_limit_shorten_dependency] = override_rate_limit
    app.dependency_overrides[rate_limit_api_dependency] = override_rate_limit
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        follow_redirects=False,
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client_with_rate_limit(db_session):
    """Client with rate limiting ENABLED to test rate limit behavior."""
    # Reset rate limiter before each test
    from app.core.rate_limit import _rate_limiter
    _rate_limiter.reset()
    
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    # Note: NOT overriding rate_limit dependencies, so rate limiting is active
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        follow_redirects=False,
    ) as ac:
        yield ac
    app.dependency_overrides.clear()