"""
Workspace Model - Representa un proyecto completo desde 0 (Software Factory)
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DocumentVersion(BaseModel):
    """Versión de un documento con metadata"""
    filename: str
    uploaded_at: str
    version: int = 1  # Incremental por cada actualización del mismo archivo
    size: int
    is_initial: bool = True  # True si fue parte de la creación inicial
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON storage"""
        return self.model_dump()


class ModuleSuggestion(BaseModel):
    """Sugerencia de módulo para el proyecto"""
    name: str  # "Authentication", "Payment Gateway", etc.
    rationale: str  # Por qué es necesario
    priority: str  # "critical", "important", "optional"
    estimated_effort: Optional[str] = None


class TechStackRecommendation(BaseModel):
    """Recomendación de stack tecnológico"""
    frontend: List[str] = []
    backend: List[str] = []
    database: List[str] = []
    infrastructure: List[str] = []
    rationale: dict = {}  # Por qué cada tecnología


class ResourceEstimation(BaseModel):
    """Estimación de recursos del proyecto"""
    # Caso 1: Dado equipo, estimar tiempo
    team_size_input: Optional[int] = None
    estimated_timeline: Optional[str] = None
    
    # Caso 2: Dado deadline, estimar equipo
    deadline_input: Optional[str] = None
    required_team_size: Optional[int] = None
    required_team_composition: Optional[dict] = None
    
    # Detalles
    breakdown_by_module: List[dict] = []
    assumptions: List[str] = []
    confidence_level: Optional[str] = None


class FeatureSuggestion(BaseModel):
    """Sugerencia de feature generada por AI"""
    id: str
    name: str
    description: str
    rationale: str  # Por qué es necesaria
    priority: str  # "critical", "important", "optional"
    source: str  # "ai_analysis", "identified_module", "suggested_module"
    status: str = "pending"  # "pending", "accepted", "discarded", "completed", "backlog"
    created_at: str
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON storage"""
        return self.model_dump()


class WorkspaceAnalysis(BaseModel):
    """Análisis completo del workspace generado por AI"""
    workspace_id: str
    
    # Análisis inicial
    executive_summary: str = ""
    project_scope: dict = {}
    business_objectives: List[str] = []
    
    # Módulos y features
    identified_features: List[dict] = []  # De los docs
    suggested_modules: List[ModuleSuggestion] = []  # Sugeridos por AI
    
    # Stack y arquitectura
    tech_stack_recommendation: Optional[TechStackRecommendation] = None
    architecture_overview: str = ""
    
    # Estimaciones (para casos de uso futuros)
    resource_estimation: Optional[ResourceEstimation] = None
    timeline_estimation: Optional[dict] = None
    
    # Riesgos
    technical_risks: List[str] = []
    business_risks: List[str] = []
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON storage"""
        return self.model_dump()


class Workspace(BaseModel):
    """Workspace - Proyecto contenedor que puede tener múltiples Features/PRDs"""
    id: str
    name: str
    description: str
    type: str = "software_factory"  # "software_factory" o "product"
    created_at: str
    updated_at: str
    
    # Referencias
    features: List[str] = []  # IDs de features/PRDs dentro del workspace
    context_documents: List[str] = []  # Nombres de docs iniciales del proyecto
    
    # Estado del procesamiento
    documents_processed: bool = False
    analysis_completed: bool = False
    
    # Análisis (se genera después de procesar documentos)
    analysis: Optional[WorkspaceAnalysis] = None
    
    # Historial de documentos
    document_history: List[DocumentVersion] = []
    analysis_version: int = 1  # Versión del análisis actual
    last_analysis_at: Optional[str] = None
    
    # Sugerencias de features
    feature_suggestions: List[FeatureSuggestion] = []
    
    # Configuración
    language_code: Optional[str] = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON storage"""
        return self.model_dump()
