from fastapi import APIRouter
from app.api.endpoints import shorten, urls, analytics

api_router = APIRouter()
api_router.include_router(shorten.router, prefix="")
api_router.include_router(urls.router, prefix="")
api_router.include_router(analytics.router, prefix="")
