import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_rate_limit_on_shorten(client_with_rate_limit: AsyncClient):
    """Shorten endpoint should be rate limited (5 req/60s)."""
    # First 5 requests should succeed
    for i in range(5):
        r = await client_with_rate_limit.post(
            "/api/shorten", json={"url": f"https://example{i}.com"}
        )
        assert r.status_code == 201, f"Request {i+1} failed with {r.status_code}"

    # 6th request should be rate limited
    r = await client_with_rate_limit.post(
        "/api/shorten", json={"url": "https://example6.com"}
    )
    assert r.status_code == 429
    data = r.json()
    assert data["error"] == "Rate limit exceeded"
    assert "retry_after_seconds" in data


@pytest.mark.asyncio
async def test_redirect_not_rate_limited(client_with_rate_limit: AsyncClient):
    """
    Redirect endpoint should NOT be rate limited.
    This is critical for a URL shortener to be usable.
    """
    # Create a shortened URL
    r = await client_with_rate_limit.post(
        "/api/shorten", json={"url": "https://example.com"}
    )
    assert r.status_code == 201
    alias = r.json()["alias"]

    # Access the redirect many times (simulating normal usage)
    # All should succeed since redirects have NO rate limiting
    for i in range(20):
        r = await client_with_rate_limit.get(f"/{alias}")
        assert r.status_code == 302, f"Redirect {i+1} should succeed"
        assert r.headers["location"] == "https://example.com"


@pytest.mark.asyncio
async def test_api_endpoints_moderate_rate_limit(client_with_rate_limit: AsyncClient):
    """API read endpoints have moderate rate limiting (20 req/60s)."""
    # Create some URLs first (uses 3 of shorten rate limit)
    for i in range(3):
        await client_with_rate_limit.post(
            "/api/shorten", json={"url": f"https://test{i}.com"}
        )

    # API endpoints have separate, higher limit
    # Should be able to make 20 requests to /api/urls
    success_count = 0
    for i in range(20):
        r = await client_with_rate_limit.get("/api/urls")
        if r.status_code == 200:
            success_count += 1
        else:
            break
    
    assert success_count == 20, "Should allow 20 API requests"
    
    # 21st should be limited
    r = await client_with_rate_limit.get("/api/urls")
    assert r.status_code == 429
