from typing import Any, Dict
from fastapi import APIRouter
from app.services.settings_service import get_settings_info, get_model_info, update_settings

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("")
def read_settings():
    return get_settings_info()


@router.patch("")
def patch_settings(payload: Dict[str, Any]):
    return update_settings(payload)


@router.get("/runtime")
def read_runtime():
    return get_model_info()
