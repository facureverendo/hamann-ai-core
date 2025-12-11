"""
Workspaces API routes - Manejo de proyectos completos (Software Factory)
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Optional, Dict
from pydantic import BaseModel
from pathlib import Path
import json
import shutil
from datetime import datetime

from api.models.workspace import Workspace, WorkspaceAnalysis, DocumentVersion, FeatureSuggestion
from api.services.workspace_processor import WorkspaceProcessor

router = APIRouter()
processor = WorkspaceProcessor()

WORKSPACES_DIR = Path(__file__).parent.parent.parent / "workspaces"
WORKSPACES_DIR.mkdir(exist_ok=True)


class WorkspaceSummary(BaseModel):
    id: str
    name: str
    description: str
    type: str
    status: str
    progress: float
    created_at: str
    updated_at: str
    features_count: int


class WorkspaceDetail(BaseModel):
    id: str
    name: str
    description: str
    type: str
    status: str
    progress: float
    created_at: str
    updated_at: str
    features: List[str]
    analysis: Optional[Dict] = None
    document_history: Optional[List[Dict]] = None
    analysis_version: Optional[int] = None
    last_analysis_at: Optional[str] = None
    documents_processed: Optional[bool] = None


class CreateWorkspaceRequest(BaseModel):
    name: str
    description: str
    type: str = "software_factory"


@router.get("/", response_model=List[WorkspaceSummary])
async def list_workspaces():
    """Lista todos los workspaces disponibles"""
    workspaces = []
    
    if WORKSPACES_DIR.exists():
        for workspace_dir in WORKSPACES_DIR.iterdir():
            if workspace_dir.is_dir():
                state_file = workspace_dir / "workspace.json"
                if state_file.exists():
                    with open(state_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        workspace = Workspace(**data)
                        
                        # Calcular progreso
                        steps_completed = sum([
                            workspace.documents_processed,
                            workspace.analysis_completed
                        ])
                        progress = steps_completed / 2.0 if steps_completed else 0.0
                        
                        workspaces.append(WorkspaceSummary(
                            id=workspace.id,
                            name=workspace.name,
                            description=workspace.description,
                            type=workspace.type,
                            status="active",
                            progress=progress,
                            created_at=workspace.created_at,
                            updated_at=workspace.updated_at,
                            features_count=len(workspace.features)
                        ))
    
    return workspaces


@router.post("/")
async def create_workspace(
    name: str = Form(...),
    description: str = Form(...),
    type: str = Form("software_factory"),
    files: List[UploadFile] = File(...)
):
    """Crea un nuevo workspace con documentos iniciales"""
    if not files:
        raise HTTPException(status_code=400, detail="At least one file is required")
    
    # Generar workspace ID
    workspace_id = f"workspace_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Crear workspace
    workspace = Workspace(
        id=workspace_id,
        name=name,
        description=description,
        type=type,
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    )
    
    # Guardar archivos
    workspace_dir = WORKSPACES_DIR / workspace_id
    workspace_dir.mkdir(parents=True, exist_ok=True)
    
    documents_dir = workspace_dir / "documents"
    documents_dir.mkdir(exist_ok=True)
    
    saved_files = []
    document_history = []
    for file in files:
        # Validar tipo de archivo
        allowed_extensions = {'.pdf', '.txt', '.md', '.docx'}
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"File type {file_ext} not allowed. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Guardar archivo
        file_path = documents_dir / file.filename
        file_size = 0
        with open(file_path, 'wb') as f:
            shutil.copyfileobj(file.file, f)
            file_size = file_path.stat().st_size
        
        saved_files.append(file.filename)
        
        # Añadir a historial como documento inicial
        document_history.append(DocumentVersion(
            filename=file.filename,
            uploaded_at=datetime.now().isoformat(),
            version=1,
            size=file_size,
            is_initial=True
        ))
    
    workspace.context_documents = saved_files
    workspace.document_history = document_history
    
    # Guardar estado del workspace
    processor.save_workspace(workspace)
    
    return {
        "id": workspace_id,
        "name": name,
        "description": description,
        "status": "created",
        "files_uploaded": len(saved_files),
        "files": saved_files,
        "message": "Workspace created successfully. You can now analyze documents."
    }


@router.get("/{workspace_id}")
async def get_workspace(workspace_id: str):
    """Obtiene los detalles de un workspace"""
    workspace = processor.load_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Calcular progreso
    steps_completed = sum([
        workspace.documents_processed,
        workspace.analysis_completed
    ])
    progress = steps_completed / 2.0 if steps_completed else 0.0
    
    return WorkspaceDetail(
        id=workspace.id,
        name=workspace.name,
        description=workspace.description,
        type=workspace.type,
        status="active",
        progress=progress,
        created_at=workspace.created_at,
        updated_at=workspace.updated_at,
        features=workspace.features,
        analysis=workspace.analysis.to_dict() if workspace.analysis else None,
        document_history=[doc.to_dict() for doc in workspace.document_history] if workspace.document_history else None,
        analysis_version=workspace.analysis_version,
        last_analysis_at=workspace.last_analysis_at,
        documents_processed=workspace.documents_processed
    )


@router.post("/{workspace_id}/documents")
async def add_documents(
    workspace_id: str,
    files: List[UploadFile] = File(...),
    notes: Optional[str] = Form(None)
):
    """Añade documentos adicionales al workspace"""
    workspace = processor.load_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    if not files:
        raise HTTPException(status_code=400, detail="At least one file is required")
    
    workspace_dir = WORKSPACES_DIR / workspace_id
    documents_dir = workspace_dir / "documents"
    documents_dir.mkdir(exist_ok=True)
    
    # Obtener nombres de archivos existentes para detectar duplicados
    existing_files = {doc.filename for doc in workspace.document_history}
    
    saved_files = []
    for file in files:
        # Validar tipo de archivo
        allowed_extensions = {'.pdf', '.txt', '.md', '.docx'}
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"File type {file_ext} not allowed. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Determinar nombre del archivo (si existe, incrementar versión)
        base_filename = file.filename
        if base_filename in existing_files:
            # Encontrar la versión más alta de este archivo
            versions = [doc.version for doc in workspace.document_history 
                       if doc.filename.startswith(base_filename.rsplit('.', 1)[0])]
            max_version = max(versions) if versions else 1
            new_version = max_version + 1
            
            # Crear nombre con versión
            name_parts = base_filename.rsplit('.', 1)
            versioned_filename = f"{name_parts[0]}_v{new_version}.{name_parts[1]}"
        else:
            versioned_filename = base_filename
            new_version = 1
        
        # Guardar archivo
        file_path = documents_dir / versioned_filename
        file_size = 0
        with open(file_path, 'wb') as f:
            shutil.copyfileobj(file.file, f)
            file_size = file_path.stat().st_size
        
        saved_files.append(versioned_filename)
        
        # Añadir a historial como documento nuevo
        workspace.document_history.append(DocumentVersion(
            filename=versioned_filename,
            uploaded_at=datetime.now().isoformat(),
            version=new_version,
            size=file_size,
            is_initial=False
        ))
        
        # Actualizar lista de documentos
        if versioned_filename not in workspace.context_documents:
            workspace.context_documents.append(versioned_filename)
    
    # Marcar que necesita re-análisis
    workspace.documents_processed = False
    workspace.updated_at = datetime.now().isoformat()
    processor.save_workspace(workspace)
    
    return {
        "status": "success",
        "files_added": saved_files,
        "total_documents": len(workspace.context_documents),
        "requires_reanalysis": True,
        "message": f"Added {len(saved_files)} document(s). Re-analysis recommended."
    }


@router.post("/{workspace_id}/analyze")
async def analyze_workspace(
    workspace_id: str,
    merge_with_existing: bool = True
):
    """Analiza los documentos del workspace con AI"""
    try:
        result = processor.analyze_workspace(workspace_id, merge_with_existing=merge_with_existing)
        return {
            "status": "success",
            "message": "Workspace analyzed successfully",
            "analysis": result,
            "merged": merge_with_existing,
            "analysis_version": result.get("analysis_version", 1)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing workspace: {str(e)}")


@router.get("/{workspace_id}/features")
async def get_workspace_features(workspace_id: str):
    """Obtiene las features/PRDs de un workspace con sus estados"""
    workspace = processor.load_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Importar aquí para evitar importación circular
    from api.services.project_processor import ProjectProcessor
    
    project_processor = ProjectProcessor()
    features = []
    
    for feature_id in workspace.features:
        state = project_processor.load_state(feature_id)
        if state:
            features.append({
                "id": feature_id,
                "name": state.project_name,
                "status": state.feature_status or "in_progress",
                "is_idea": state.is_idea,
                "created_at": state.created_at,
                "updated_at": state.updated_at,
                "prd_built": state.prd_built,
                "workspace_id": state.workspace_id
            })
    
    # Agrupar por estado
    grouped = {
        "ideas": [f for f in features if f["is_idea"]],
        "backlog": [f for f in features if f["status"] == "backlog"],
        "in_progress": [f for f in features if f["status"] == "in_progress"],
        "completed": [f for f in features if f["status"] == "completed"],
        "discarded": [f for f in features if f["status"] == "discarded"]
    }
    
    return {
        "workspace_id": workspace_id,
        "features": features,
        "grouped": grouped,
        "suggestions": [s.to_dict() for s in workspace.feature_suggestions] if workspace.feature_suggestions else []
    }


@router.get("/{workspace_id}/feature-suggestions")
async def get_feature_suggestions(workspace_id: str):
    """
    Genera sugerencias de features basadas en:
    - Análisis del workspace (módulos identificados y sugeridos)
    - Features ya creadas (para no duplicar)
    - Descripción del proyecto
    """
    workspace = processor.load_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Si ya hay sugerencias guardadas, retornarlas
    if workspace.feature_suggestions:
        return {
            "suggestions": [s.to_dict() for s in workspace.feature_suggestions],
            "generated_at": workspace.updated_at
        }
    
    # Generar nuevas sugerencias con AI
    suggestions = processor.generate_feature_suggestions(workspace_id)
    
    # Guardar en workspace
    workspace.feature_suggestions = suggestions
    workspace.updated_at = datetime.now().isoformat()
    processor.save_workspace(workspace)
    
    return {
        "suggestions": [s.to_dict() for s in suggestions],
        "generated_at": datetime.now().isoformat()
    }


@router.post("/{workspace_id}/feature-suggestions/{suggestion_id}/status")
async def update_suggestion_status(
    workspace_id: str,
    suggestion_id: str,
    status: str = Form(...)  # "accepted", "discarded", "completed", "backlog"
):
    """Actualiza el estado de una sugerencia"""
    workspace = processor.load_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Encontrar y actualizar sugerencia
    found = False
    for suggestion in workspace.feature_suggestions:
        if suggestion.id == suggestion_id:
            suggestion.status = status
            found = True
            break
    
    if not found:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    workspace.updated_at = datetime.now().isoformat()
    processor.save_workspace(workspace)
    return {"status": "success", "suggestion_id": suggestion_id, "new_status": status}


@router.post("/{workspace_id}/features")
async def create_workspace_feature(
    workspace_id: str,
    name: str = Form(...),
    files: Optional[List[UploadFile]] = File(None),
    status: str = Form("in_progress"),  # "idea", "backlog", "in_progress"
    description: Optional[str] = Form(None)
):
    """
    Crea una feature con estado específico.
    
    - Si status="idea": no requiere archivos, solo nombre y descripción
    - Si status="backlog" o "in_progress": puede tener archivos opcionales
    """
    workspace = processor.load_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Validar estado
    valid_statuses = ["idea", "backlog", "in_progress", "completed", "discarded"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    is_idea = status == "idea"
    
    # Si es idea, no debe tener archivos
    if is_idea and files:
        raise HTTPException(status_code=400, detail="Ideas no requieren archivos")
    
    # Importar aquí para evitar importación circular
    from api.services.project_processor import ProjectProcessor
    from api.models.project_state import ProjectState
    
    project_processor = ProjectProcessor()
    
    # Generar feature ID
    feature_id = f"feature_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Crear feature con referencia al workspace
    state = ProjectState(
        project_id=feature_id,
        project_name=name,
        workspace_id=workspace_id,
        feature_status=status,
        is_idea=is_idea,
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    )
    
    # Si hay archivos y no es idea, guardarlos
    saved_files = []
    if files and not is_idea:
        feature_dir = project_processor.get_project_dir(feature_id)
        inputs_dir = feature_dir / "inputs"
        inputs_dir.mkdir(parents=True, exist_ok=True)
        
        for file in files:
            file_path = inputs_dir / file.filename
            with open(file_path, 'wb') as f:
                shutil.copyfileobj(file.file, f)
            saved_files.append(file.filename)
    
    # Guardar estado
    project_processor.save_state(state)
    
    # Actualizar workspace
    workspace.features.append(feature_id)
    workspace.updated_at = datetime.now().isoformat()
    processor.save_workspace(workspace)
    
    return {
        "id": feature_id,
        "workspace_id": workspace_id,
        "name": name,
        "status": status,
        "is_idea": is_idea,
        "files_uploaded": len(saved_files),
        "files": saved_files,
        "message": "Feature created successfully in workspace."
    }


@router.delete("/{workspace_id}")
async def delete_workspace(workspace_id: str):
    """Elimina un workspace y todas sus features"""
    workspace = processor.load_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Eliminar todas las features del workspace
    from api.services.project_processor import ProjectProcessor
    project_processor = ProjectProcessor()
    
    for feature_id in workspace.features:
        feature_dir = project_processor.get_project_dir(feature_id)
        if feature_dir.exists():
            shutil.rmtree(feature_dir)
    
    # Eliminar el workspace
    workspace_dir = WORKSPACES_DIR / workspace_id
    if workspace_dir.exists():
        shutil.rmtree(workspace_dir)
    
    return {"message": f"Workspace {workspace_id} deleted successfully"}
