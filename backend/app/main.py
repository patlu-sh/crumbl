from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.database import engine, Base
from app.api.router import api_router
from app.api.endpoints import redirect as redirect_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


_DESCRIPTION = """
**Crumbl** is a lightweight URL shortener service.

## Features

- **Shorten** any valid HTTP/HTTPS URL into a 6-character alias.
- **Redirect** visitors from `/{alias}` to the original URL.
- **Manage** your links — update the destination or archive a URL.
- **Analytics** — view per-day click counts for the last 7 days.

## Rate Limiting

The `POST /api/shorten` endpoint is rate-limited.  
When the limit is exceeded the API returns **429 Too Many Requests** with a
`retry_after_seconds` field so clients can show a countdown.
"""

_TAGS_METADATA = [
    {
        "name": "shorten",
        "description": "Create a new short URL from a long destination URL.",
    },
    {
        "name": "urls",
        "description": "List, update, and archive existing short URLs.",
    },
    {
        "name": "analytics",
        "description": "Per-alias click analytics broken down by day.",
    },
    {
        "name": "redirect",
        "description": "Public redirect endpoint — resolves an alias to its destination.",
    },
    {
        "name": "health",
        "description": "Service health-check.",
    },
]

app = FastAPI(
    title="Crumbl — URL Shortener API",
    version="1.0.0",
    description=_DESCRIPTION,
    openapi_tags=_TAGS_METADATA,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    contact={
        "name": "Crumbl",
        "url": "https://github.com/probin-sir/crumbl",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/health", tags=["health"], summary="Health check", description="Returns `{\"status\": \"ok\"}` when the service is running.")
async def health():
    return {"status": "ok"}


app.include_router(redirect_router.router)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    detail = exc.detail
    if isinstance(detail, dict):
        return JSONResponse(status_code=exc.status_code, content=detail)
    return JSONResponse(status_code=exc.status_code, content={"detail": detail})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
