from fastapi import APIRouter
from app.routers.v1 import media
from app.routers import health

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(media.router, prefix="/media", tags=["media"])
