from fastapi import APIRouter
from app.services.settings_service import get_settings_info, get_model_info

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("")
def read_settings():
    return get_settings_info()


@router.get("/runtime")
def read_runtime():
    return get_model_info()
