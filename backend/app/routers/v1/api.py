from fastapi import APIRouter
from app.routers import health
from app.routers.v1 import media, jobs, transcripts

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(media.router, prefix="/media", tags=["media"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(transcripts.router, prefix="/transcripts", tags=["transcripts"])
