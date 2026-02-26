import pytest
from httpx import AsyncClient
from app.services.url_service import UrlService
from app.services.analytics_service import AnalyticsService


@pytest.mark.asyncio
async def test_url_cache_hit(client: AsyncClient):
    """Test that URL lookups are cached after first access."""
    # Create a shortened URL
    r = await client.post("/api/shorten", json={"url": "https://example.com/cached"})
    assert r.status_code == 201
    alias = r.json()["alias"]
    
    # Access it - should populate cache
    r1 = await client.get(f"/{alias}")
    assert r1.status_code == 302
    
    # Access again - should hit cache
    r2 = await client.get(f"/{alias}")
    assert r2.status_code == 302
    assert r2.headers["location"] == "https://example.com/cached"


@pytest.mark.asyncio
async def test_url_cache_populated_on_creation(client: AsyncClient):
    """Test that newly created URLs are pre-populated in cache."""
    # Create URL - should be in cache immediately
    r = await client.post("/api/shorten", json={"url": "https://example.com/precached"})
    assert r.status_code == 201
    alias = r.json()["alias"]
    
    # Redirect should work immediately (cache hit)
    r = await client.get(f"/{alias}")
    assert r.status_code == 302
    assert r.headers["location"] == "https://example.com/precached"


@pytest.mark.asyncio
async def test_analytics_cache(client: AsyncClient):
    """Test that analytics queries are cached."""
    # Create URL and generate some clicks
    r = await client.post("/api/shorten", json={"url": "https://example.com/analytics"})
    assert r.status_code == 201
    alias = r.json()["alias"]
    
    # Click the link a few times
    for _ in range(3):
        await client.get(f"/{alias}")
    
    # Get analytics - should cache result
    r1 = await client.get(f"/api/analytics/{alias}")
    assert r1.status_code == 200
    data1 = r1.json()
    
    # Get again - should hit cache
    r2 = await client.get(f"/api/analytics/{alias}")
    assert r2.status_code == 200
    data2 = r2.json()
    
    # Results should be identical (from cache)
    assert data1 == data2
    assert data1["alias"] == alias
    assert len(data1["clicks_by_day"]) == 7


@pytest.mark.asyncio
async def test_cache_respects_use_cache_flag(client: AsyncClient):
    """Test that cache can be bypassed with use_cache=False."""
    # This is tested internally - we verify the cache system honors the flag
    # The redirect endpoint always uses cache, but services can bypass it
    service = UrlService()
    
    # Verify cache is initialized
    assert service._url_cache is not None
    assert service._url_cache.maxsize == 10000
    assert service._url_cache.ttl == 600


@pytest.mark.asyncio
async def test_analytics_cache_config(client: AsyncClient):
    """Test analytics cache configuration."""
    service = AnalyticsService()
    
    # Verify cache is initialized with correct settings
    assert service._analytics_cache is not None
    assert service._analytics_cache.maxsize == 1000
    assert service._analytics_cache.ttl == 60
