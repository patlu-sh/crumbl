# URL Shortener API (Backend)

Rate-limited URL shortener with 6-char aliases, redirect + click tracking, and 7-day analytics. Built with FastAPI and SQLite.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env       # optional: override DATABASE_URL
```

## Run

```bash
uvicorn app.main:app --reload
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/shorten` | Body: `{ "url": "https://..." }`. Returns 201 `{ "alias", "short_url" }`. |
| GET | `/{alias}` | 302 redirect to original URL; records a click. 404 if alias not found. |
| GET | `/api/urls` | List all URLs with `alias`, `original_url`, `total_clicks` (ordered by created_at DESC). |
| GET | `/api/analytics/{alias}` | Clicks by day for last 7 days (YYYY-MM-DD); zero-filled. |

## Rate limit

- In-memory fixed window per IP: strict limit on `/api/shorten`, moderate on read endpoints.
- 429 response: `{ "error": "Rate limit exceeded", "retry_after_seconds": <int> }`.

## Config (.env)

- `DATABASE_URL`: SQLite async (default `sqlite+aiosqlite:///./shortener.db`)
