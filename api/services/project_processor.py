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
        
        # Invalidate enriched gaps cache (will be regenerated on next request)
        enriched_gaps_cache = project_dir / "enriched_gaps.json"
        if enriched_gaps_cache.exists():
            enriched_gaps_cache.unlink()
        
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
        """Build PRD from analysis and user answers (includes interactive session answers)"""
        state = self.load_state(project_id)
        if not state:
            raise ValueError(f"Project {project_id} not found")
        
        if not state.gaps_analyzed:
            raise ValueError("Gaps must be analyzed first")
        
        project_dir = self.get_project_dir(project_id)
        context_file = project_dir / "context.txt"
        answers_file = project_dir / "answers.json"
        
        with open(context_file, 'r', encoding='utf-8') as f:
            unified_context = f.read()
        
        # Load interactive session answers if they exist
        interactive_answers = {}
        if answers_file.exists():
            with open(answers_file, 'r', encoding='utf-8') as f:
                answers_data = json.load(f)
                # Extract answers that are not skipped
                for ans in answers_data.get('answers', []):
                    if not ans.get('skipped', False) and ans.get('answer', '').strip():
                        interactive_answers[ans['section_key']] = ans['answer']
                
                print(f"📝 Loaded {len(interactive_answers)} answers from interactive session")
        
        # Re-analyze (or load from stored analysis)
        analysis = analyze_input(unified_context, self.client, language_code=state.language_code or "es")
        
        # Merge provided user_answers with interactive session answers
        # Interactive answers take precedence
        all_answers = {**(user_answers or {}), **interactive_answers}
        
        print(f"📝 Building PRD with {len(all_answers)} total user answers")
        if all_answers:
            print(f"   Sections answered: {', '.join(all_answers.keys())}")
        
        # Build PRD with all answers
        prd = build_prd(analysis, all_answers, self.client, language_code=state.language_code or "es")
        
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
        
        # Generate insights after PRD is built
        print("🔍 Generating project insights from PRD...")
        try:
            from api.services.insights_generator import generate_all_insights
            insights_results = generate_all_insights(project_dir, self.client)
            print(f"✅ Generated {len(insights_results.get('risks', []))} risks, {len(insights_results.get('deliverables', []))} deliverables")
            
            # Update state
            state.insights_generated = True
            state.updated_at = datetime.now().isoformat()
            self.save_state(state)
        except Exception as e:
            print(f"⚠️ Warning: Could not generate insights: {e}")
            import traceback
            traceback.print_exc()
        
        return {
            "prd_path": str(prd_file),
            "is_complete": prd.is_complete(),
            "sections_count": len([s for s in prd.sections.values() if s]),
            "user_answers_count": len(all_answers),
            "user_answers_used": list(all_answers.keys()) if all_answers else []
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
        
        # Regenerate insights after backlog is created (to update team workload and deliverables)
        print("🔍 Regenerating project insights with backlog data...")
        try:
            from api.services.insights_generator import generate_all_insights
            insights_results = generate_all_insights(project_dir, self.client)
            print(f"✅ Updated insights: {len(insights_results.get('team_members', []))} team members, {len(insights_results.get('deliverables', []))} deliverables")
            
            # Update state
            state.insights_generated = True
            state.updated_at = datetime.now().isoformat()
            self.save_state(state)
        except Exception as e:
            print(f"⚠️ Warning: Could not regenerate insights: {e}")
            import traceback
            traceback.print_exc()
        
        return {
            "csv_path": csv_path,
            "md_path": md_path,
            "items_count": len(backlog_items)
        }
    
    def get_cached_questions(self, project_id: str) -> Dict:
        """Get cached questions without re-generating"""
        state = self.load_state(project_id)
        if not state:
            raise ValueError(f"Project {project_id} not found")
        
        project_dir = self.get_project_dir(project_id)
        questions_cache_file = project_dir / "questions_cache.json"
        answers_file = project_dir / "answers.json"
        
        # Load cached questions if they exist
        if not questions_cache_file.exists():
            return None
        
        with open(questions_cache_file, 'r', encoding='utf-8') as f:
            questions_cache = json.load(f)
        
        # Load answers if they exist
        answers_data = {"answers": [], "regeneration_count": 0, "status": "in_progress"}
        if answers_file.exists():
            with open(answers_file, 'r', encoding='utf-8') as f:
                answers_data = json.load(f)
        
        # Update state
        state.interactive_session_active = True
        state.questions_answered_count = len([a for a in answers_data.get('answers', []) if not a.get('skipped', False)])
        state.questions_skipped_count = len([a for a in answers_data.get('answers', []) if a.get('skipped', False)])
        state.updated_at = datetime.now().isoformat()
        self.save_state(state)
        
        return {
            "questions_by_priority": questions_cache.get('questions_by_priority', {}),
            "answered_count": state.questions_answered_count,
            "skipped_count": state.questions_skipped_count,
            "pending_count": questions_cache.get('total_count', 0),
            "regeneration_count": answers_data.get('regeneration_count', 0),
            "previous_answers": answers_data.get('answers', []),
            "cached": True
        }
    
    def start_interactive_session(self, project_id: str, max_questions: int = 15, force_regenerate: bool = False) -> Dict:
        """Start or resume an interactive questions session"""
        state = self.load_state(project_id)
        if not state:
            raise ValueError(f"Project {project_id} not found")
        
        if not state.gaps_analyzed:
            raise ValueError("Gaps must be analyzed first")
        
        project_dir = self.get_project_dir(project_id)
        answers_file = project_dir / "answers.json"
        questions_cache_file = project_dir / "questions_cache.json"
        
        # Try to use cached questions if available and not forcing regeneration
        if not force_regenerate and questions_cache_file.exists():
            print("📦 Using cached questions (no API call)")
            cached_result = self.get_cached_questions(project_id)
            if cached_result:
                return cached_result
        
        print("🔄 Generating new questions (API call to OpenAI)")
        
        # Load or create answers file
        if answers_file.exists():
            with open(answers_file, 'r', encoding='utf-8') as f:
                answers_data = json.load(f)
        else:
            answers_data = {
                "session_started": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat(),
                "answers": [],
                "regeneration_count": 0,
                "status": "in_progress"
            }
            with open(answers_file, 'w', encoding='utf-8') as f:
                json.dump(answers_data, f, indent=2, ensure_ascii=False)
        
        # Load context and analysis
        context_file = project_dir / "context.txt"
        with open(context_file, 'r', encoding='utf-8') as f:
            unified_context = f.read()
        
        # Get existing answers to build enriched context
        previous_answers = {ans['section_key']: ans['answer'] for ans in answers_data.get('answers', []) if not ans.get('skipped', False)}
        
        # Re-analyze with previous answers
        from src.prd_builder import regenerate_questions_with_context
        questions = regenerate_questions_with_context(
            unified_context, 
            previous_answers, 
            self.client, 
            max_questions=max_questions,
            language_code=state.language_code or "es"
        )
        
        # Organize questions by priority
        critical_questions = [q for q in questions if q.priority.value == 'critical']
        important_questions = [q for q in questions if q.priority.value == 'important']
        optional_questions = [q for q in questions if q.priority.value == 'optional']
        
        questions_by_priority = {
            "critical": [{
                "section_key": q.section_key,
                "section_title": q.section_title,
                "priority": q.priority.value,
                "question": q.question,
                "context": q.context,
                "options": q.options
            } for q in critical_questions],
            "important": [{
                "section_key": q.section_key,
                "section_title": q.section_title,
                "priority": q.priority.value,
                "question": q.question,
                "context": q.context,
                "options": q.options
            } for q in important_questions],
            "optional": [{
                "section_key": q.section_key,
                "section_title": q.section_title,
                "priority": q.priority.value,
                "question": q.question,
                "context": q.context,
                "options": q.options
            } for q in optional_questions]
        }
        
        # Cache the questions
        questions_cache = {
            "questions_by_priority": questions_by_priority,
            "total_count": len(questions),
            "generated_at": datetime.now().isoformat()
        }
        with open(questions_cache_file, 'w', encoding='utf-8') as f:
            json.dump(questions_cache, f, indent=2, ensure_ascii=False)
        
        # Update state
        state.interactive_session_active = True
        state.questions_answered_count = len([a for a in answers_data.get('answers', []) if not a.get('skipped', False)])
        state.questions_skipped_count = len([a for a in answers_data.get('answers', []) if a.get('skipped', False)])
        state.updated_at = datetime.now().isoformat()
        self.save_state(state)
        
        return {
            "questions_by_priority": questions_by_priority,
            "answered_count": state.questions_answered_count,
            "skipped_count": state.questions_skipped_count,
            "pending_count": len(questions),
            "regeneration_count": answers_data.get('regeneration_count', 0),
            "previous_answers": answers_data.get('answers', []),
            "cached": False
        }
    
    def save_answer(self, project_id: str, section_key: str, answer: str, skipped: bool, question: str = "", section_title: str = "") -> Dict:
        """Save a user's answer to a question"""
        state = self.load_state(project_id)
        if not state:
            raise ValueError(f"Project {project_id} not found")
        
        project_dir = self.get_project_dir(project_id)
        answers_file = project_dir / "answers.json"
        
        # Load answers
        if answers_file.exists():
            with open(answers_file, 'r', encoding='utf-8') as f:
                answers_data = json.load(f)
        else:
            raise ValueError("Interactive session not started")
        
        # Check if answer already exists for this section
        existing_answer_idx = None
        for idx, ans in enumerate(answers_data['answers']):
            if ans['section_key'] == section_key:
                existing_answer_idx = idx
                break
        
        # Create answer entry
        answer_entry = {
            "section_key": section_key,
            "section_title": section_title,
            "question": question,
            "answer": answer,
            "answered_at": datetime.now().isoformat(),
            "skipped": skipped
        }
        
        # Update or append
        if existing_answer_idx is not None:
            answers_data['answers'][existing_answer_idx] = answer_entry
        else:
            answers_data['answers'].append(answer_entry)
        
        answers_data['last_updated'] = datetime.now().isoformat()
        
        # Save
        with open(answers_file, 'w', encoding='utf-8') as f:
            json.dump(answers_data, f, indent=2, ensure_ascii=False)
        
        # Update state counts
        state.questions_answered_count = len([a for a in answers_data['answers'] if not a.get('skipped', False)])
        state.questions_skipped_count = len([a for a in answers_data['answers'] if a.get('skipped', False)])
        state.updated_at = datetime.now().isoformat()
        self.save_state(state)
        
        return {
            "success": True,
            "answered_count": state.questions_answered_count,
            "skipped_count": state.questions_skipped_count
        }
    
    def get_session_state(self, project_id: str) -> Dict:
        """Get the current state of the interactive session"""
        state = self.load_state(project_id)
        if not state:
            raise ValueError(f"Project {project_id} not found")
        
        project_dir = self.get_project_dir(project_id)
        answers_file = project_dir / "answers.json"
        
        if not answers_file.exists():
            return {
                "session_active": False,
                "answered_count": 0,
                "skipped_count": 0,
                "answers": []
            }
        
        with open(answers_file, 'r', encoding='utf-8') as f:
            answers_data = json.load(f)
        
        return {
            "session_active": state.interactive_session_active,
            "answered_count": state.questions_answered_count,
            "skipped_count": state.questions_skipped_count,
            "regeneration_count": answers_data.get('regeneration_count', 0),
            "answers": answers_data.get('answers', []),
            "status": answers_data.get('status', 'in_progress')
        }
    
    def finalize_session(self, project_id: str) -> Dict:
        """Finalize the interactive session"""
        state = self.load_state(project_id)
        if not state:
            raise ValueError(f"Project {project_id} not found")
        
        project_dir = self.get_project_dir(project_id)
        answers_file = project_dir / "answers.json"
        
        if not answers_file.exists():
            raise ValueError("No active session to finalize")
        
        # Load and update status
        with open(answers_file, 'r', encoding='utf-8') as f:
            answers_data = json.load(f)
        
        answers_data['status'] = 'completed'
        answers_data['completed_at'] = datetime.now().isoformat()
        
        with open(answers_file, 'w', encoding='utf-8') as f:
            json.dump(answers_data, f, indent=2, ensure_ascii=False)
        
        # Update state
        state.interactive_session_active = False
        state.questions_generated = True
        state.questions_count = len(answers_data.get('answers', []))
        state.updated_at = datetime.now().isoformat()
        self.save_state(state)
        
        return {
            "success": True,
            "answered_count": state.questions_answered_count,
            "skipped_count": state.questions_skipped_count,
            "total_questions": state.questions_count
        }

