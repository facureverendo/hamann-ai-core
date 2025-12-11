"""
App Settings Model - Configuración global de la aplicación
"""

from pydantic import BaseModel
from typing import Optional
import json
from pathlib import Path


class AppSettings(BaseModel):
    """Configuración de modos de la aplicación"""
    show_software_factory_mode: bool = True
    show_product_mode: bool = True
    default_mode: str = "product"  # "product" o "software_factory"
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON storage"""
        return self.model_dump()
    
    @staticmethod
    def get_settings_file() -> Path:
        """Get path to settings file"""
        # Settings file at project root
        return Path(__file__).parent.parent.parent / "settings.json"
    
    @classmethod
    def load(cls) -> "AppSettings":
        """Load settings from file or return defaults"""
        settings_file = cls.get_settings_file()
        if settings_file.exists():
            try:
                with open(settings_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return cls(**data)
            except Exception as e:
                print(f"Error loading settings: {e}, using defaults")
                return cls()
        return cls()
    
    def save(self):
        """Save settings to file"""
        settings_file = self.get_settings_file()
        with open(settings_file, 'w', encoding='utf-8') as f:
            json.dump(self.to_dict(), f, indent=2, ensure_ascii=False)
