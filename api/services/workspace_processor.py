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
    
    def analyze_workspace(self, workspace_id: str, merge_with_existing: bool = True) -> Dict:
        """
        Analiza los documentos del workspace con AI para generar análisis completo.
        
        Si merge_with_existing=True y ya existe análisis:
        - Procesa TODOS los documentos (viejos + nuevos)
        - Genera nuevo análisis completo
        - Hace merge inteligente con análisis anterior
        - Preserva información relevante del análisis anterior
        - Actualiza campos con nueva información
        """
        workspace = self.load_workspace(workspace_id)
        if not workspace:
            raise ValueError(f"Workspace {workspace_id} not found")
        
        workspace_dir = self.get_workspace_dir(workspace_id)
        documents_dir = workspace_dir / "documents"
        
        if not documents_dir.exists() or not any(documents_dir.iterdir()):
            raise ValueError("No documents found in workspace")
        
        # Obtener análisis previo si existe
        previous_analysis = workspace.analysis if workspace.analysis_completed else None
        
        # Paso 1: Procesar TODOS los documentos y generar contexto unificado
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
            language_code,
            previous_analysis=previous_analysis if merge_with_existing else None
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
            
            # Guardar análisis completo en markdown (con versión)
            analysis_version = workspace.analysis_version
            analysis_file = workspace_dir / f"analysis_v{analysis_version}.md"
            with open(analysis_file, 'w', encoding='utf-8') as f:
                f.write(analysis_text)
            
            # También guardar como analysis.md (última versión)
            latest_analysis_file = workspace_dir / "analysis.md"
            with open(latest_analysis_file, 'w', encoding='utf-8') as f:
                f.write(analysis_text)
            
            # Parsear análisis
            new_analysis = self._parse_analysis(analysis_text, workspace_id)
            
            # Paso 3: Hacer merge si hay análisis previo
            if previous_analysis and merge_with_existing:
                merged_analysis = self._merge_analyses(previous_analysis, new_analysis)
            else:
                merged_analysis = new_analysis
            
            # Incrementar versión del análisis
            workspace.analysis_version += 1
            workspace.last_analysis_at = datetime.now().isoformat()
            
            # Guardar análisis estructurado
            workspace.analysis = merged_analysis
            workspace.analysis_completed = True
            self.save_workspace(workspace)
            
            # Paso 4: Actualizar features existentes si hay
            if workspace.features:
                self._update_existing_features(workspace_id, merged_analysis)
            
            return {
                "workspace_id": workspace_id,
                "status": "completed",
                "language_code": language_code,
                "analysis_version": workspace.analysis_version,
                "merged": merge_with_existing and previous_analysis is not None,
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
    
    def _prepare_merge_context(self, previous_analysis: WorkspaceAnalysis) -> str:
        """Prepara contexto del análisis anterior para el prompt"""
        context = f"""
Análisis anterior del proyecto:
- Resumen ejecutivo: {previous_analysis.executive_summary[:500]}...
- Módulos identificados: {len(previous_analysis.identified_features)} módulos
- Módulos sugeridos: {[m.name for m in previous_analysis.suggested_modules]}
- Riesgos técnicos: {len(previous_analysis.technical_risks)} riesgos
- Riesgos de negocio: {len(previous_analysis.business_risks)} riesgos
"""
        return context
    
    def _merge_analyses(
        self, 
        previous: WorkspaceAnalysis, 
        new: WorkspaceAnalysis
    ) -> WorkspaceAnalysis:
        """
        Merge inteligente de análisis:
        - Módulos identificados: combinar listas, eliminar duplicados
        - Módulos sugeridos: actualizar prioridades, añadir nuevos
        - Stack tecnológico: actualizar si hay cambios significativos
        - Riesgos: añadir nuevos, mantener existentes
        - Estimaciones: actualizar si hay cambios de alcance
        """
        # Combinar módulos identificados (eliminar duplicados por nombre)
        merged_features = []
        seen_feature_names = set()
        
        # Primero añadir los nuevos
        for feature in new.identified_features:
            feature_name = feature.get('name', str(feature))
            if feature_name not in seen_feature_names:
                merged_features.append(feature)
                seen_feature_names.add(feature_name)
        
        # Luego añadir los anteriores que no estén duplicados
        for feature in previous.identified_features:
            feature_name = feature.get('name', str(feature))
            if feature_name not in seen_feature_names:
                merged_features.append(feature)
                seen_feature_names.add(feature_name)
        
        # Combinar módulos sugeridos
        merged_suggested_modules = []
        seen_module_names = set()
        
        # Priorizar los nuevos
        for module in new.suggested_modules:
            if module.name not in seen_module_names:
                merged_suggested_modules.append(module)
                seen_module_names.add(module.name)
        
        # Añadir anteriores que no estén duplicados
        for module in previous.suggested_modules:
            if module.name not in seen_module_names:
                merged_suggested_modules.append(module)
                seen_module_names.add(module.name)
        
        # Combinar riesgos (añadir nuevos, mantener anteriores)
        merged_technical_risks = list(previous.technical_risks)
        for risk in new.technical_risks:
            if risk not in merged_technical_risks:
                merged_technical_risks.append(risk)
        
        merged_business_risks = list(previous.business_risks)
        for risk in new.business_risks:
            if risk not in merged_business_risks:
                merged_business_risks.append(risk)
        
        # Usar nuevo resumen ejecutivo (más actualizado)
        # Pero combinar objetivos de negocio
        merged_objectives = list(previous.business_objectives)
        for obj in new.business_objectives:
            if obj not in merged_objectives:
                merged_objectives.append(obj)
        
        # Stack tecnológico: usar el nuevo si existe, sino mantener el anterior
        tech_stack = new.tech_stack_recommendation if new.tech_stack_recommendation else previous.tech_stack_recommendation
        
        # Arquitectura: usar la nueva (más actualizada)
        architecture = new.architecture_overview if new.architecture_overview else previous.architecture_overview
        
        # Crear análisis mergeado
        merged = WorkspaceAnalysis(
            workspace_id=new.workspace_id,
            executive_summary=new.executive_summary or previous.executive_summary,
            project_scope=new.project_scope or previous.project_scope,
            business_objectives=merged_objectives,
            identified_features=merged_features,
            suggested_modules=merged_suggested_modules,
            tech_stack_recommendation=tech_stack,
            architecture_overview=architecture,
            resource_estimation=new.resource_estimation or previous.resource_estimation,
            timeline_estimation=new.timeline_estimation or previous.timeline_estimation,
            technical_risks=merged_technical_risks,
            business_risks=merged_business_risks
        )
        
        return merged
    
    def _update_existing_features(
        self,
        workspace_id: str,
        updated_analysis: WorkspaceAnalysis
    ):
        """
        Actualiza features existentes con información relevante del análisis actualizado.
        """
        from api.services.project_processor import ProjectProcessor
        
        project_processor = ProjectProcessor()
        workspace = self.load_workspace(workspace_id)
        
        if not workspace or not workspace.features:
            return
        
        for feature_id in workspace.features:
            state = project_processor.load_state(feature_id)
            if not state:
                continue
            
            # Extraer información relevante del análisis actualizado
            relevant_info = self._extract_relevant_info_for_feature(
                updated_analysis,
                state.project_name
            )
            
            # Si hay información relevante, actualizar contexto
            if relevant_info:
                feature_dir = project_processor.get_project_dir(feature_id)
                context_file = feature_dir / "context.txt"
                
                if context_file.exists():
                    # Añadir nueva información al contexto
                    with open(context_file, 'r', encoding='utf-8') as f:
                        existing_context = f.read()
                    
                    updated_context = f"""{existing_context}

# ============================================
# Información actualizada del proyecto (Workspace Analysis v{updated_analysis.workspace_id})
# Actualizado: {datetime.now().isoformat()}
# ============================================

{relevant_info}
"""
                    with open(context_file, 'w', encoding='utf-8') as f:
                        f.write(updated_context)
    
    def _extract_relevant_info_for_feature(
        self,
        analysis: WorkspaceAnalysis,
        feature_name: str
    ) -> str:
        """
        Extrae información relevante del análisis para una feature específica.
        """
        relevant_parts = []
        
        # Buscar módulos relacionados con el nombre de la feature
        feature_lower = feature_name.lower()
        
        # Módulos identificados relacionados
        for feature in analysis.identified_features:
            if isinstance(feature, dict):
                feature_info = feature.get('name', '') or feature.get('title', '')
                if feature_lower in feature_info.lower() or feature_info.lower() in feature_lower:
                    relevant_parts.append(f"## Módulo relacionado: {feature_info}")
                    if isinstance(feature, dict) and 'description' in feature:
                        relevant_parts.append(feature['description'])
        
        # Módulos sugeridos relacionados
        for module in analysis.suggested_modules:
            if feature_lower in module.name.lower() or module.name.lower() in feature_lower:
                relevant_parts.append(f"## Módulo sugerido relacionado: {module.name}")
                relevant_parts.append(f"Justificación: {module.rationale}")
                relevant_parts.append(f"Prioridad: {module.priority}")
        
        # Stack tecnológico (siempre relevante)
        if analysis.tech_stack_recommendation:
            relevant_parts.append("## Stack Tecnológico Recomendado:")
            if analysis.tech_stack_recommendation.frontend:
                relevant_parts.append(f"Frontend: {', '.join(analysis.tech_stack_recommendation.frontend)}")
            if analysis.tech_stack_recommendation.backend:
                relevant_parts.append(f"Backend: {', '.join(analysis.tech_stack_recommendation.backend)}")
            if analysis.tech_stack_recommendation.database:
                relevant_parts.append(f"Database: {', '.join(analysis.tech_stack_recommendation.database)}")
        
        # Arquitectura (siempre relevante)
        if analysis.architecture_overview:
            relevant_parts.append("## Arquitectura del Proyecto:")
            relevant_parts.append(analysis.architecture_overview[:500] + "...")
        
        # Riesgos técnicos relevantes
        if analysis.technical_risks:
            relevant_parts.append("## Riesgos Técnicos Identificados:")
            for risk in analysis.technical_risks[:3]:  # Primeros 3
                relevant_parts.append(f"- {risk}")
        
        return "\n\n".join(relevant_parts) if relevant_parts else ""
    
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
