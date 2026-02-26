import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_shorten_success(client: AsyncClient):
    r = await client.post("/api/shorten", json={"url": "https://example.com/page"})
    assert r.status_code == 201
    data = r.json()
    assert "alias" in data
    assert "short_url" in data
    assert len(data["alias"]) == 6
    assert data["alias"].isalnum()
    assert data["short_url"].endswith("/" + data["alias"])


@pytest.mark.asyncio
async def test_shorten_invalid_url(client: AsyncClient):
    r = await client.post("/api/shorten", json={"url": "not-a-url"})
    assert r.status_code == 400
    assert "detail" in r.json()


@pytest.mark.asyncio
async def test_shorten_missing_scheme(client: AsyncClient):
    r = await client.post("/api/shorten", json={"url": "example.com"})
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_redirect_found(client: AsyncClient):
    shorten_r = await client.post("/api/shorten", json={"url": "https://example.com/target"})
    assert shorten_r.status_code == 201
    alias = shorten_r.json()["alias"]

    r = await client.get(f"/{alias}")
    assert r.status_code == 302
    assert r.headers["location"] == "https://example.com/target"


@pytest.mark.asyncio
async def test_redirect_not_found(client: AsyncClient):
    r = await client.get("/nonex1")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_redirect_invalid_alias_length(client: AsyncClient):
    r = await client.get("/ab")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_list_urls_empty(client: AsyncClient):
    r = await client.get("/api/urls")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_list_urls_with_data(client: AsyncClient):
    await client.post("/api/shorten", json={"url": "https://a.com"})
    await client.post("/api/shorten", json={"url": "https://b.com"})
    r = await client.get("/api/urls")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 2
    for item in data:
        assert "alias" in item
        assert "original_url" in item
        assert "total_clicks" in item
        assert item["total_clicks"] >= 0


@pytest.mark.asyncio
async def test_list_urls_order_and_clicks(client: AsyncClient):
    s1 = await client.post("/api/shorten", json={"url": "https://first.com"})
    s2 = await client.post("/api/shorten", json={"url": "https://second.com"})
    alias1 = s1.json()["alias"]
    alias2 = s2.json()["alias"]
    await client.get(f"/{alias1}")
    await client.get(f"/{alias1}")
    r = await client.get("/api/urls")
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 2
    # Most recent first
    aliases = [x["alias"] for x in data]
    assert alias2 == aliases[0]
    assert alias1 == aliases[1]
    by_alias = {x["alias"]: x for x in data}
    assert by_alias[alias1]["total_clicks"] == 2
    assert by_alias[alias2]["total_clicks"] == 0


@pytest.mark.asyncio
async def test_analytics_not_found(client: AsyncClient):
    r = await client.get("/api/analytics/nonex1")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_analytics_success(client: AsyncClient):
    s = await client.post("/api/shorten", json={"url": "https://example.com"})
    alias = s.json()["alias"]
    r = await client.get(f"/api/analytics/{alias}")
    assert r.status_code == 200
    data = r.json()
    assert data["alias"] == alias
    assert "clicks_by_day" in data
    assert len(data["clicks_by_day"]) == 7
    for day in data["clicks_by_day"]:
        assert "date" in day
        assert "clicks" in day
        assert len(day["date"]) == 10  # YYYY-MM-DD
        assert day["clicks"] >= 0
