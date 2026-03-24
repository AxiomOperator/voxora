from fastapi import APIRouter
from app.services.diagnostics_service import get_full_status

router = APIRouter()


@router.get("/status")
def diagnostics_status():
    return get_full_status()
