"""
Workspace Processor Service - Procesa proyectos completos desde 0 (Software Factory)
"""

import os
import sys
import json
from pathlib import Path
from typing import Optional, Dict, List
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv

# Add parent directories to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / 'src'))

from src.ingestor import process_inputs_folder
from src.language_detector import detect_language
from src.workspace_analysis_template import WorkspaceAnalysisPrompt
from api.models.workspace import Workspace, WorkspaceAnalysis, ModuleSuggestion, TechStackRecommendation

load_dotenv()

WORKSPACES_DIR = project_root / "workspaces"


class WorkspaceProcessor:
    """Procesa workspaces (proyectos completos)"""
    
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        WORKSPACES_DIR.mkdir(exist_ok=True)
    
    def get_workspace_dir(self, workspace_id: str) -> Path:
        """Get workspace directory path"""
        return WORKSPACES_DIR / workspace_id
    
    def get_workspace_file(self, workspace_id: str) -> Path:
        """Get workspace state file path"""
        return self.get_workspace_dir(workspace_id) / "workspace.json"
    
    def load_workspace(self, workspace_id: str) -> Optional[Workspace]:
        """Load workspace from file"""
        workspace_file = self.get_workspace_file(workspace_id)
        if workspace_file.exists():
            with open(workspace_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return Workspace(**data)
        return None
    
    def save_workspace(self, workspace: Workspace):
        """Save workspace to file"""
        workspace_dir = self.get_workspace_dir(workspace.id)
        workspace_dir.mkdir(parents=True, exist_ok=True)
        
        workspace_file = self.get_workspace_file(workspace.id)
        workspace.updated_at = datetime.now().isoformat()
        
        with open(workspace_file, 'w', encoding='utf-8') as f:
            json.dump(workspace.to_dict(), f, indent=2, ensure_ascii=False)
    
    def analyze_workspace(self, workspace_id: str) -> Dict:
        """
        Analiza los documentos del workspace con AI para generar análisis completo.
        
        Este es el paso CRÍTICO que diferencia workspace de feature:
        - Procesa MÚLTIPLES documentos (brief, specs, referencias)
        - Genera análisis comprehensivo del proyecto
        - Sugiere módulos y stack tecnológico
        - Proporciona estimaciones
        """
        workspace = self.load_workspace(workspace_id)
        if not workspace:
            raise ValueError(f"Workspace {workspace_id} not found")
        
        workspace_dir = self.get_workspace_dir(workspace_id)
        documents_dir = workspace_dir / "documents"
        
        if not documents_dir.exists() or not any(documents_dir.iterdir()):
            raise ValueError("No documents found in workspace")
        
        # Paso 1: Procesar documentos y generar contexto unificado
        print(f"Processing documents for workspace {workspace_id}...")
        unified_context = process_inputs_folder(str(documents_dir), self.client)
        
        # Detectar idioma
        lang_info = detect_language(unified_context, self.client)
        language_code = lang_info["language_code"]
        workspace.language_code = language_code
        
        # Guardar contexto unificado
        context_file = workspace_dir / "context.txt"
        with open(context_file, 'w', encoding='utf-8') as f:
            f.write(unified_context)
        
        workspace.documents_processed = True
        self.save_workspace(workspace)
        
        # Paso 2: Generar análisis completo con AI
        print(f"Generating comprehensive analysis for workspace {workspace_id}...")
        analysis_prompt = WorkspaceAnalysisPrompt.get_analysis_prompt(
            unified_context, 
            language_code
        )
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "Eres un arquitecto de software senior experto en análisis de proyectos completos."
                    },
                    {
                        "role": "user",
                        "content": analysis_prompt
                    }
                ],
                temperature=0.7,
                max_tokens=4096
            )
            
            analysis_text = response.choices[0].message.content
            
            # Guardar análisis completo en markdown
            analysis_file = workspace_dir / "analysis.md"
            with open(analysis_file, 'w', encoding='utf-8') as f:
                f.write(analysis_text)
            
            # Parsear análisis (simplificado - en producción usarías un parser más robusto)
            analysis = self._parse_analysis(analysis_text, workspace_id)
            
            # Guardar análisis estructurado
            workspace.analysis = analysis
            workspace.analysis_completed = True
            self.save_workspace(workspace)
            
            return {
                "workspace_id": workspace_id,
                "status": "completed",
                "language_code": language_code,
                "analysis_summary": analysis_text[:500] + "...",
                "full_analysis_file": str(analysis_file)
            }
            
        except Exception as e:
            print(f"Error generating analysis: {e}")
            raise
    
    def _parse_analysis(self, analysis_text: str, workspace_id: str) -> WorkspaceAnalysis:
        """
        Parsea el texto del análisis en estructura WorkspaceAnalysis.
        Versión simplificada - en producción usarías un parser más robusto.
        """
        
        # Extraer secciones principales (simplificado)
        lines = analysis_text.split('\n')
        
        executive_summary = ""
        architecture_overview = ""
        
        current_section = None
        for line in lines:
            if "## 1. RESUMEN EJECUTIVO" in line or "## 1. EXECUTIVE SUMMARY" in line:
                current_section = "executive"
            elif "## 6. ARQUITECTURA" in line or "## 6. HIGH-LEVEL ARCHITECTURE" in line:
                current_section = "architecture"
            elif line.startswith("## "):
                current_section = None
            elif current_section == "executive" and line.strip():
                executive_summary += line + "\n"
            elif current_section == "architecture" and line.strip():
                architecture_overview += line + "\n"
        
        # Crear análisis estructurado (versión básica)
        analysis = WorkspaceAnalysis(
            workspace_id=workspace_id,
            executive_summary=executive_summary.strip() or "Ver archivo analysis.md para detalles completos",
            architecture_overview=architecture_overview.strip() or "Ver archivo analysis.md para detalles completos",
            project_scope={},
            business_objectives=[],
            identified_features=[],
            suggested_modules=[],
            technical_risks=[],
            business_risks=[]
        )
        
        return analysis
    
    def suggest_tech_stack(self, workspace_id: str, requirements: Dict) -> TechStackRecommendation:
        """
        Sugiere stack tecnológico basado en requerimientos.
        Caso de uso futuro preparado en la arquitectura.
        """
        # Implementación futura
        return TechStackRecommendation(
            frontend=["React", "TypeScript", "TailwindCSS"],
            backend=["Python", "FastAPI"],
            database=["PostgreSQL"],
            infrastructure=["Docker", "AWS"]
        )
    
    def estimate_resources(
        self, 
        workspace_id: str, 
        team_size: Optional[int] = None,
        deadline: Optional[str] = None
    ) -> Dict:
        """
        Estima recursos necesarios dado:
        - Tamaño de equipo (estima tiempo)
        - Deadline (estima equipo necesario)
        
        Caso de uso futuro preparado en la arquitectura.
        """
        # Implementación futura
        return {
            "message": "Resource estimation feature coming soon",
            "team_size": team_size,
            "deadline": deadline
        }
