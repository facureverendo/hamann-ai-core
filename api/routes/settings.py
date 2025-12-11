"""
Settings API routes - Configuración de la aplicación
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from api.models.app_settings import AppSettings

router = APIRouter()


class UpdateSettingsRequest(BaseModel):
    show_software_factory_mode: bool
    show_product_mode: bool
    default_mode: str


@router.get("/")
async def get_settings():
    """Obtiene la configuración actual de la aplicación"""
    settings = AppSettings.load()
    return settings.to_dict()


@router.put("/")
async def update_settings(request: UpdateSettingsRequest):
    """Actualiza la configuración de la aplicación"""
    # Validar que al menos un modo esté habilitado
    if not request.show_software_factory_mode and not request.show_product_mode:
        raise HTTPException(
            status_code=400,
            detail="At least one mode must be enabled"
        )
    
    # Validar default_mode
    if request.default_mode not in ["product", "software_factory"]:
        raise HTTPException(
            status_code=400,
            detail="default_mode must be 'product' or 'software_factory'"
        )
    
    # Validar que el modo por defecto esté habilitado
    if request.default_mode == "product" and not request.show_product_mode:
        raise HTTPException(
            status_code=400,
            detail="Cannot set default_mode to 'product' when product mode is disabled"
        )
    if request.default_mode == "software_factory" and not request.show_software_factory_mode:
        raise HTTPException(
            status_code=400,
            detail="Cannot set default_mode to 'software_factory' when software factory mode is disabled"
        )
    
    # Guardar configuración
    settings = AppSettings(
        show_software_factory_mode=request.show_software_factory_mode,
        show_product_mode=request.show_product_mode,
        default_mode=request.default_mode
    )
    settings.save()
    
    return {
        "status": "success",
        "message": "Settings updated successfully",
        "settings": settings.to_dict()
    }
