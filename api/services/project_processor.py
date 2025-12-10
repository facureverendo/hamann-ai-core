"""
Project Processor Service - Orchestrates modular processing of projects
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
from src.prd_builder import analyze_input, generate_questions, build_prd
from src.brain import generate_backlog
from src.exporter import export_backlog
from src.language_detector import detect_language
from src.diagram_generator import add_diagrams_to_prd
from api.models.project_state import ProjectState

load_dotenv()

PROJECTS_DIR = project_root / "projects"


class ProjectProcessor:
    """Handles modular processing of projects"""
    
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        PROJECTS_DIR.mkdir(exist_ok=True)
    
    def get_project_dir(self, project_id: str) -> Path:
        """Get project directory path"""
        return PROJECTS_DIR / project_id
    
    def get_state_file(self, project_id: str) -> Path:
        """Get project state file path"""
        return self.get_project_dir(project_id) / "state.json"
    
    def load_state(self, project_id: str) -> Optional[ProjectState]:
        """Load project state from file"""
        state_file = self.get_state_file(project_id)
        if state_file.exists():
            with open(state_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return ProjectState(**data)
        return None
    
    def save_state(self, state: ProjectState):
        """Save project state to file"""
        project_dir = self.get_project_dir(state.project_id)
        project_dir.mkdir(parents=True, exist_ok=True)
        
        state_file = self.get_state_file(state.project_id)
        with open(state_file, 'w', encoding='utf-8') as f:
            json.dump(state.to_dict(), f, indent=2, ensure_ascii=False)
    
    def create_project(self, project_id: str, project_name: str) -> ProjectState:
        """Create a new project with initial state"""
        state = ProjectState(
            project_id=project_id,
            project_name=project_name,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat()
        )
        self.save_state(state)
        return state
    
    def process_inputs(self, project_id: str) -> Dict:
        """Process uploaded input files and generate unified context"""
        state = self.load_state(project_id)
        if not state:
            raise ValueError(f"Project {project_id} not found")
        
        project_dir = self.get_project_dir(project_id)
        inputs_dir = project_dir / "inputs"
        
        if not inputs_dir.exists() or not any(inputs_dir.iterdir()):
            raise ValueError("No input files found")
        
        # Process inputs
        unified_context = process_inputs_folder(str(inputs_dir), self.client)
        context_length = len(unified_context)
        
        # Detect language
        lang_info = detect_language(unified_context, self.client)
        language_code = lang_info["language_code"]
        
        # Save context
        context_file = project_dir / "context.txt"
        with open(context_file, 'w', encoding='utf-8') as f:
            f.write(unified_context)
        
        # Update state
        state.inputs_processed = True
        state.context_generated = True
        state.language_code = language_code
        state.context_length = context_length
        state.updated_at = datetime.now().isoformat()
        self.save_state(state)
        
        return {
            "context_length": context_length,
            "language_code": language_code,
            "language_name": lang_info["language_name"]
        }
    
    def analyze_gaps(self, project_id: str) -> Dict:
        """Analyze input context and detect gaps"""
        state = self.load_state(project_id)
        if not state:
            raise ValueError(f"Project {project_id} not found")
        
        if not state.context_generated:
            raise ValueError("Context must be generated first. Process inputs first.")
        
        project_dir = self.get_project_dir(project_id)
        context_file = project_dir / "context.txt"
        
        with open(context_file, 'r', encoding='utf-8') as f:
            unified_context = f.read()
        
        # Analyze input
        analysis = analyze_input(unified_context, self.client, language_code=state.language_code or "es")
        
        # Save analysis
        analysis_file = project_dir / "analysis.json"
        gaps_data = []
        for gap in analysis.gaps:
            try:
                # Handle priority - it might be an enum or a string
                if hasattr(gap.priority, 'value'):
                    priority_value = gap.priority.value
                else:
                    priority_value = str(gap.priority)
                
                gaps_data.append({
                    "section_key": gap.section_key,
                    "section_title": gap.section_title,
                    "priority": priority_value,
                    "question": gap.question or "",
                    "context": gap.context or "",
                    "options": gap.options if gap.options else None
                })
            except Exception as e:
                print(f"Error serializing gap {gap.section_key}: {e}")
                # Fallback: create minimal gap data
                gaps_data.append({
                    "section_key": gap.section_key,
                    "section_title": getattr(gap, 'section_title', 'Unknown'),
                    "priority": "optional",
                    "question": "",
                    "context": "",
                    "options": None
                })
        
        with open(analysis_file, 'w', encoding='utf-8') as f:
            json.dump({
                "product_name": analysis.product_name,
                "explicit_features": analysis.explicit_features,
                "inferred_features": analysis.inferred_features,
                "extracted_info": analysis.extracted_info if hasattr(analysis, 'extracted_info') else {},
                "confidence_scores": analysis.confidence_scores if hasattr(analysis, 'confidence_scores') else {},
                "gaps_count": len(analysis.gaps),
                "gaps": gaps_data
            }, f, indent=2, ensure_ascii=False)
        
        # Update state
        state.gaps_analyzed = True
        state.gaps_count = len(analysis.gaps)
        state.updated_at = datetime.now().isoformat()
        self.save_state(state)
        
        return {
            "product_name": analysis.product_name,
            "gaps_count": len(analysis.gaps),
            "gaps": [{
                "section_key": gap.section_key,
                "section_title": gap.section_title,
                "priority": gap.priority.value,
                "question": gap.question,
                "context": gap.context,
                "options": gap.options
            } for gap in analysis.gaps]
        }
    
    def generate_questions(self, project_id: str, max_questions: int = 15) -> Dict:
        """Generate questions for gaps"""
        state = self.load_state(project_id)
        if not state:
            raise ValueError(f"Project {project_id} not found")
        
        if not state.gaps_analyzed:
            raise ValueError("Gaps must be analyzed first")
        
        project_dir = self.get_project_dir(project_id)
        analysis_file = project_dir / "analysis.json"
        
        # Load analysis (simplified - in production would reconstruct AnalysisResult)
        with open(analysis_file, 'r', encoding='utf-8') as f:
            analysis_data = json.load(f)
        
        # For now, we'll need to re-analyze or store the full analysis
        # This is a simplified version - in production, store the full AnalysisResult
        context_file = project_dir / "context.txt"
        with open(context_file, 'r', encoding='utf-8') as f:
            unified_context = f.read()
        
        analysis = analyze_input(unified_context, self.client, language_code=state.language_code or "es")
        questions = generate_questions(analysis, self.client, max_questions=max_questions, language_code=state.language_code or "es")
        
        # Save questions
        questions_file = project_dir / "questions.json"
        with open(questions_file, 'w', encoding='utf-8') as f:
            json.dump([{
                "section_key": q.section_key,
                "section_title": q.section_title,
                "priority": q.priority.value,
                "question": q.question,
                "context": q.context,
                "options": q.options
            } for q in questions], f, indent=2, ensure_ascii=False)
        
        # Update state
        state.questions_generated = True
        state.questions_count = len(questions)
        state.updated_at = datetime.now().isoformat()
        self.save_state(state)
        
        return {
            "questions_count": len(questions),
            "questions": [{
                "section_key": q.section_key,
                "section_title": q.section_title,
                "priority": q.priority.value,
                "question": q.question,
                "context": q.context,
                "options": q.options
            } for q in questions]
        }
    
    def build_prd(self, project_id: str, user_answers: Dict[str, str] = None) -> Dict:
        """Build PRD from analysis and user answers"""
        state = self.load_state(project_id)
        if not state:
            raise ValueError(f"Project {project_id} not found")
        
        if not state.gaps_analyzed:
            raise ValueError("Gaps must be analyzed first")
        
        project_dir = self.get_project_dir(project_id)
        context_file = project_dir / "context.txt"
        
        with open(context_file, 'r', encoding='utf-8') as f:
            unified_context = f.read()
        
        # Re-analyze (or load from stored analysis)
        analysis = analyze_input(unified_context, self.client, language_code=state.language_code or "es")
        
        # Build PRD
        user_answers = user_answers or {}
        prd = build_prd(analysis, user_answers, self.client, language_code=state.language_code or "es")
        
        # Add diagrams
        diagrams = add_diagrams_to_prd(prd.sections, prd.product_name, self.client)
        if diagrams:
            prd.sections['appendix'] = diagrams
        
        # Save PRD
        outputs_dir = project_dir / "outputs"
        outputs_dir.mkdir(exist_ok=True)
        prd_file = outputs_dir / "prd.md"
        with open(prd_file, 'w', encoding='utf-8') as f:
            f.write(prd.to_markdown())
        
        # Update state
        state.prd_built = True
        state.updated_at = datetime.now().isoformat()
        self.save_state(state)
        
        return {
            "prd_path": str(prd_file),
            "is_complete": prd.is_complete(),
            "sections_count": len([s for s in prd.sections.values() if s])
        }
    
    def generate_backlog(self, project_id: str) -> Dict:
        """Generate backlog from PRD"""
        state = self.load_state(project_id)
        if not state:
            raise ValueError(f"Project {project_id} not found")
        
        if not state.prd_built:
            raise ValueError("PRD must be built first")
        
        project_dir = self.get_project_dir(project_id)
        prd_file = project_dir / "outputs" / "prd.md"
        
        with open(prd_file, 'r', encoding='utf-8') as f:
            prd_content = f.read()
        
        # Generate backlog
        backlog_items = generate_backlog(prd_content, self.client)
        
        # Export backlog
        outputs_dir = project_dir / "outputs"
        csv_path, md_path = export_backlog(backlog_items, str(outputs_dir))
        
        # Update state
        state.backlog_generated = True
        state.updated_at = datetime.now().isoformat()
        self.save_state(state)
        
        return {
            "csv_path": csv_path,
            "md_path": md_path,
            "items_count": len(backlog_items)
        }

