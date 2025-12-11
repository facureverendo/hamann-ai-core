"""
Projects API routes - Modular project processing
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Optional, Dict
from pydantic import BaseModel
from pathlib import Path
import json
import shutil
import os
from datetime import datetime

from api.services.project_processor import ProjectProcessor
import sys
from pathlib import Path as PathLib

# Add src to path to import PRD template
sys.path.insert(0, str(PathLib(__file__).parent.parent.parent / 'src'))
from prd_template import EnterprisePRDTemplate

router = APIRouter()
processor = ProjectProcessor()

PROJECTS_DIR = Path(__file__).parent.parent.parent / "projects"


class ProjectSummary(BaseModel):
    id: str
    name: str
    status: str
    progress: float
    created_at: str
    updated_at: str


class ProjectDetail(BaseModel):
    id: str
    name: str
    status: str
    progress: float
    created_at: str
    updated_at: str
    description: Optional[str] = None
    state: Optional[Dict] = None


class CreateProjectRequest(BaseModel):
    name: str


@router.get("/", response_model=List[ProjectSummary])
async def list_projects():
    """List all available projects"""
    projects = []
    
    if PROJECTS_DIR.exists():
        for project_dir in PROJECTS_DIR.iterdir():
            if project_dir.is_dir():
                state_file = project_dir / "state.json"
                if state_file.exists():
                    with open(state_file, 'r', encoding='utf-8') as f:
                        state_data = json.load(f)
                        state = processor.load_state(state_data['project_id'])
                        if state:
                            # Calculate progress based on completed steps
                            steps = [
                                state.inputs_processed,
                                state.gaps_analyzed,
                                state.questions_generated,
                                state.prd_built,
                                state.backlog_generated
                            ]
                            progress = sum(steps) / len(steps) if steps else 0.0
                            
                            projects.append(ProjectSummary(
                                id=state.project_id,
                                name=state.project_name,
                                status="active",
                                progress=progress,
                                created_at=state.created_at,
                                updated_at=state.updated_at
                            ))
    
    return projects


@router.post("/")
async def create_project(
    name: str = Form(...),
    files: List[UploadFile] = File(...)
):
    """Create a new project with name and upload files"""
    if not files:
        raise HTTPException(status_code=400, detail="At least one file is required")
    
    # Generate project ID
    project_id = f"project_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Create project
    state = processor.create_project(project_id, name)
    
    # Save uploaded files
    project_dir = processor.get_project_dir(project_id)
    inputs_dir = project_dir / "inputs"
    inputs_dir.mkdir(parents=True, exist_ok=True)
    
    saved_files = []
    for file in files:
        # Validate file type
        allowed_extensions = {'.pdf', '.txt', '.md', '.mp3', '.mp4', '.wav', '.m4a', '.ogg', '.flac'}
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"File type {file_ext} not allowed. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Save file
        file_path = inputs_dir / file.filename
        with open(file_path, 'wb') as f:
            shutil.copyfileobj(file.file, f)
        saved_files.append(file.filename)
    
    return {
        "id": project_id,
        "name": name,
        "status": "created",
        "files_uploaded": len(saved_files),
        "files": saved_files,
        "message": "Project created successfully. You can now process inputs."
    }


@router.get("/{project_id}/status")
async def get_project_status(project_id: str):
    """Get project processing status"""
    state = processor.load_state(project_id)
    if not state:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return state.to_dict()


@router.post("/{project_id}/process-inputs")
async def process_inputs(project_id: str):
    """Process uploaded input files and generate unified context"""
    try:
        result = processor.process_inputs(project_id)
        return {
            "status": "success",
            "message": "Inputs processed successfully",
            **result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing inputs: {str(e)}")


@router.post("/{project_id}/analyze-gaps")
async def analyze_gaps(project_id: str):
    """Analyze input context and detect gaps"""
    try:
        result = processor.analyze_gaps(project_id)
        return {
            "status": "success",
            "message": "Gaps analyzed successfully",
            **result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        error_detail = f"Error analyzing gaps: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # Log to console for debugging
        raise HTTPException(status_code=500, detail=f"Error analyzing gaps: {str(e)}")


@router.get("/{project_id}/questions")
async def get_questions(project_id: str):
    """Get generated questions for gaps"""
    state = processor.load_state(project_id)
    if not state:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not state.questions_generated:
        raise HTTPException(status_code=400, detail="Questions not generated yet")
    
    project_dir = processor.get_project_dir(project_id)
    questions_file = project_dir / "questions.json"
    
    if questions_file.exists():
        with open(questions_file, 'r', encoding='utf-8') as f:
            questions = json.load(f)
        return {"questions": questions}
    
    return {"questions": []}


@router.post("/{project_id}/generate-questions")
async def generate_questions(project_id: str, max_questions: int = 15):
    """Generate questions for gaps"""
    try:
        result = processor.generate_questions(project_id, max_questions)
        return {
            "status": "success",
            "message": "Questions generated successfully",
            **result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating questions: {str(e)}")


@router.post("/{project_id}/build-prd")
async def build_prd(project_id: str, answers: Optional[Dict[str, str]] = None):
    """Build PRD from analysis and user answers"""
    try:
        result = processor.build_prd(project_id, answers or {})
        return {
            "status": "success",
            "message": "PRD built successfully",
            **result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building PRD: {str(e)}")


@router.post("/{project_id}/generate-backlog")
async def generate_backlog(project_id: str):
    """Generate backlog from PRD"""
    try:
        result = processor.generate_backlog(project_id)
        return {
            "status": "success",
            "message": "Backlog generated successfully",
            **result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating backlog: {str(e)}")


@router.get("/{project_id}/context")
async def get_context(project_id: str):
    """Get processed unified context"""
    state = processor.load_state(project_id)
    if not state:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not state.context_generated:
        raise HTTPException(status_code=400, detail="Context not generated yet")
    
    project_dir = processor.get_project_dir(project_id)
    context_file = project_dir / "context.txt"
    
    if context_file.exists():
        with open(context_file, 'r', encoding='utf-8') as f:
            context = f.read()
        return {
            "context": context,
            "length": len(context),
            "language_code": state.language_code
        }
    
    raise HTTPException(status_code=404, detail="Context file not found")


def translate_text(text: str, target_language: str, client) -> str:
    """Translate text to target language using OpenAI"""
    if target_language == "en":
        return text  # Already in English
    
    language_names = {
        "es": "Spanish",
        "pt": "Portuguese",
        "fr": "French",
        "de": "German"
    }
    
    target_lang_name = language_names.get(target_language, "Spanish")
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": f"You are a professional translator. Translate the following text to {target_lang_name}. Keep the same tone and technical terminology. Return ONLY the translation, no explanations."
                },
                {
                    "role": "user",
                    "content": text
                }
            ],
            temperature=0.3,
            max_tokens=500
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Translation error: {e}")
        return text  # Return original if translation fails


def translate_list(texts: List[str], target_language: str, client) -> List[str]:
    """Translate a list of texts to target language using OpenAI (batch translation)"""
    if target_language == "en":
        return texts  # Already in English
    
    if not texts:
        return []
    
    language_names = {
        "es": "Spanish",
        "pt": "Portuguese",
        "fr": "French",
        "de": "German"
    }
    
    target_lang_name = language_names.get(target_language, "Spanish")
    
    # Combine all texts with numbered markers
    combined_text = "\n".join([f"{i+1}. {text}" for i, text in enumerate(texts)])
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": f"You are a professional translator. Translate the following numbered list to {target_lang_name}. Keep the same tone and technical terminology. Return the translations in the same numbered format (1. translation, 2. translation, etc.). Return ONLY the translations, no explanations."
                },
                {
                    "role": "user",
                    "content": combined_text
                }
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        # Parse the response back into a list
        translated_text = response.choices[0].message.content.strip()
        # Extract numbered items
        translated_items = []
        for line in translated_text.split('\n'):
            line = line.strip()
            # Remove leading number and period if present
            if line and (line[0].isdigit() or line.startswith('-')):
                # Remove number prefix (e.g., "1. " or "- ")
                cleaned = line.split('. ', 1)[-1] if '. ' in line else line.split('- ', 1)[-1] if line.startswith('- ') else line
                translated_items.append(cleaned)
            elif line:
                translated_items.append(line)
        
        # Ensure we have the same number of items
        if len(translated_items) == len(texts):
            return translated_items
        else:
            # Fallback: translate individually
            return [translate_text(text, target_language, client) for text in texts]
    except Exception as e:
        print(f"Batch translation error: {e}, falling back to individual translation")
        # Fallback: translate individually
        return [translate_text(text, target_language, client) for text in texts]


@router.get("/{project_id}/gaps")
async def get_gaps(project_id: str):
    """Get analyzed gaps with enriched section information (cached for performance)"""
    try:
        state = processor.load_state(project_id)
        if not state:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if not state.gaps_analyzed:
            raise HTTPException(status_code=400, detail="Gaps not analyzed yet")
        
        project_dir = processor.get_project_dir(project_id)
        analysis_file = project_dir / "analysis.json"
        enriched_gaps_cache = project_dir / "enriched_gaps.json"
        
        if not analysis_file.exists():
            # Si el estado dice que está analizado pero no hay archivo, retornar vacío
            return {
                "gaps_count": 0,
                "gaps": [],
                "message": "Analysis file not found, but gaps were marked as analyzed"
            }
        
        try:
            # Check if we have a cached version that's newer than the analysis file
            if enriched_gaps_cache.exists():
                cache_mtime = enriched_gaps_cache.stat().st_mtime
                analysis_mtime = analysis_file.stat().st_mtime
                
                # If cache is newer than analysis file, use cached version
                if cache_mtime >= analysis_mtime:
                    with open(enriched_gaps_cache, 'r', encoding='utf-8') as f:
                        cached_data = json.load(f)
                        return cached_data
            
            # If no cache or cache is outdated, generate enriched gaps
            with open(analysis_file, 'r', encoding='utf-8') as f:
                analysis_data = json.load(f)
            
            gaps = analysis_data.get("gaps", [])
            product_name = analysis_data.get("product_name", "")
            explicit_features = analysis_data.get("explicit_features", [])
            extracted_info = analysis_data.get("extracted_info", {}) or {}
            
            # Get project language code
            language_code = state.language_code or "en"
            
            # Initialize OpenAI client for translations
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                # If no API key, skip translation and use English
                client = None
            else:
                from openai import OpenAI
                client = OpenAI(api_key=api_key)
            
            # Enrich gaps with section information from PRD template
            enriched_gaps = []
            for gap in gaps:
                section_key = gap.get("section_key")
                section = EnterprisePRDTemplate.get_section(section_key)
                
                enriched_gap = gap.copy()
                
                if section:
                    # Translate section description if client is available
                    try:
                        if client and language_code != "en":
                            enriched_gap["description"] = translate_text(section.description, language_code, client)
                        else:
                            enriched_gap["description"] = section.description
                    except Exception as e:
                        print(f"Error translating description for {section_key}: {e}")
                        enriched_gap["description"] = section.description  # Fallback to original
                    
                    # Translate guiding questions if client is available (batch translation)
                    try:
                        if client and language_code != "en":
                            enriched_gap["guiding_questions"] = translate_list(section.guiding_questions, language_code, client)
                        else:
                            enriched_gap["guiding_questions"] = section.guiding_questions
                    except Exception as e:
                        print(f"Error translating questions for {section_key}: {e}")
                        enriched_gap["guiding_questions"] = section.guiding_questions  # Fallback to original
                else:
                    enriched_gap["description"] = ""
                    enriched_gap["guiding_questions"] = []
                
                # Add priority label in Spanish
                priority = gap.get("priority", "optional")
                priority_labels = {
                    "critical": "Crítico",
                    "important": "Importante",
                    "optional": "Opcional"
                }
                enriched_gap["priority_label"] = priority_labels.get(priority, priority)
                
                # Enrich context if missing or empty
                if not enriched_gap.get("context") or enriched_gap.get("context") == "":
                    context_parts = []
                    
                    if product_name and product_name != "Producto Sin Nombre":
                        context_parts.append(f"Producto: {product_name}")
                    
                    # Add related extracted information
                    related_sections = []
                    if section_key == "ux_flows" and "functional_requirements" in extracted_info:
                        related_sections.append("functional_requirements")
                    elif section_key == "acceptance_criteria" and "functional_requirements" in extracted_info:
                        related_sections.append("functional_requirements")
                    elif section_key == "risks_challenges" and "solution_overview" in extracted_info:
                        related_sections.append("solution_overview")
                    
                    if related_sections:
                        context_parts.append("\nInformación relacionada disponible:")
                        for rel_key in related_sections:
                            rel_section = EnterprisePRDTemplate.get_section(rel_key)
                            if rel_section and rel_key in extracted_info:
                                content_preview = extracted_info[rel_key][:150] + "..." if len(extracted_info[rel_key]) > 150 else extracted_info[rel_key]
                                context_parts.append(f"- {rel_section.title}: {content_preview}")
                    
                    if explicit_features:
                        context_parts.append(f"\nFeatures identificadas: {', '.join(explicit_features[:3])}")
                        if len(explicit_features) > 3:
                            context_parts.append(f"(y {len(explicit_features) - 3} más)")
                    
                    enriched_gap["context"] = "\n".join(context_parts) if context_parts else f"Esta sección no fue encontrada en el documento analizado. Es necesaria para completar el PRD."
                
                enriched_gaps.append(enriched_gap)
        
            result = {
                "gaps_count": analysis_data.get("gaps_count", 0),
                "gaps": enriched_gaps
            }
            
            # Cache the enriched gaps for future requests
            with open(enriched_gaps_cache, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            
            return result
        except Exception as e:
            import traceback
            error_detail = f"Error processing gaps: {str(e)}\n{traceback.format_exc()}"
            print(error_detail)  # Log to console for debugging
            raise HTTPException(status_code=500, detail=f"Error processing gaps: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Error in get_gaps endpoint: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # Log to console for debugging
        raise HTTPException(status_code=500, detail=f"Error getting gaps: {str(e)}")


@router.get("/{project_id}/backlog")
async def get_backlog(project_id: str):
    """Get project backlog"""
    state = processor.load_state(project_id)
    if not state:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not state.backlog_generated:
        raise HTTPException(status_code=400, detail="Backlog not generated yet")
    
    project_dir = processor.get_project_dir(project_id)
    outputs_dir = project_dir / "outputs"
    
    # Look for the most recent backlog file (with or without timestamp)
    backlog_files = list(outputs_dir.glob("jira_backlog*.csv"))
    
    if backlog_files:
        # Get the most recent file
        backlog_file = max(backlog_files, key=lambda f: f.stat().st_mtime)
        
        # Parse CSV and normalize column names to snake_case
        import pandas as pd
        df = pd.read_csv(backlog_file)
        
        # Normalize column names: "Issue Type" -> "issue_type", "Story Points" -> "story_points"
        df.columns = df.columns.str.lower().str.replace(' ', '_')
        
        return {"items": df.to_dict('records')}
    
    return {"items": []}


@router.get("/{project_id}/risks")
async def get_risks(project_id: str):
    """Get project risks - DEPRECATED: Use /api/projects/{id}/risks from insights router"""
    # For backward compatibility, redirect to insights endpoint
    project_dir = processor.get_project_dir(project_id)
    risks_file = project_dir / "risks.json"
    
    if risks_file.exists():
        with open(risks_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return {"risks": data.get("risks", [])}
    
    return {"risks": []}


@router.get("/{project_id}/timeline")
async def get_timeline(project_id: str):
    """Get predictive timeline with deliverables"""
    # Read deliverables from insights
    project_dir = processor.get_project_dir(project_id)
    deliverables_file = project_dir / "deliverables.json"
    
    deliverables = []
    if deliverables_file.exists():
        with open(deliverables_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            deliverables_data = data.get("deliverables", [])
            
            # Convert to timeline format
            for d in deliverables_data:
                deliverables.append({
                    "id": d.get("id"),
                    "name": d.get("name"),
                    "due_date": d.get("due_date"),
                    "progress": d.get("progress", 0.0)
                })
    
    # Generate milestones based on deliverables
    milestones = []
    for idx, d in enumerate(deliverables[:3]):  # First 3 as milestones
        status = "completed" if d["progress"] >= 1.0 else ("at-risk" if d["progress"] < 0.3 else "in-progress")
        milestones.append({
            "id": f"m{idx+1}",
            "name": d["name"],
            "date": d["due_date"],
            "status": status
        })
    
    return {
        "milestones": milestones,
        "deliverables": deliverables,
        "delay_zones": []  # Can be calculated based on at-risk deliverables
    }


@router.get("/{project_id}/meetings")
async def get_meetings(project_id: str):
    """Get meeting summaries - DEPRECATED: Use /api/projects/{id}/meetings from insights router"""
    # For backward compatibility, redirect to insights endpoint
    project_dir = processor.get_project_dir(project_id)
    meetings_file = project_dir / "meetings.json"
    
    if meetings_file.exists():
        with open(meetings_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return {"meetings": data.get("meetings", [])}
    
    return {"meetings": []}


@router.get("/{project_id}", response_model=ProjectDetail)
async def get_project(project_id: str):
    """Get project details"""
    state = processor.load_state(project_id)
    if not state:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Calculate progress
    steps = [
        state.inputs_processed,
        state.gaps_analyzed,
        state.questions_generated,
        state.prd_built,
        state.backlog_generated
    ]
    progress = sum(steps) / len(steps) if steps else 0.0
    
    return ProjectDetail(
        id=state.project_id,
        name=state.project_name,
        status="active",
        progress=progress,
        created_at=state.created_at,
        updated_at=state.updated_at,
        description=None,
        state=state.to_dict()
    )


# Interactive Questions Endpoints

@router.get("/{project_id}/interactive-questions/session")
async def get_interactive_session(project_id: str, max_questions: int = 15):
    """Start or resume an interactive questions session (uses cache if available)"""
    try:
        # Try to get cached questions first
        result = processor.start_interactive_session(project_id, max_questions, force_regenerate=False)
        return {
            "status": "success",
            **result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        error_detail = f"Error starting interactive session: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=f"Error starting interactive session: {str(e)}")


class AnswerRequest(BaseModel):
    section_key: str
    answer: str
    skipped: bool = False
    question: str = ""
    section_title: str = ""


@router.post("/{project_id}/interactive-questions/answer")
async def save_interactive_answer(project_id: str, request: AnswerRequest):
    """Save a user's answer to a question"""
    try:
        result = processor.save_answer(
            project_id, 
            request.section_key, 
            request.answer, 
            request.skipped,
            request.question,
            request.section_title
        )
        return {
            "status": "success",
            **result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving answer: {str(e)}")


@router.post("/{project_id}/interactive-questions/regenerate")
async def regenerate_interactive_questions(project_id: str, max_questions: int = 15):
    """Regenerate questions based on current answers (forces new API call)"""
    try:
        # Get current session state
        session_state = processor.get_session_state(project_id)
        
        # Load answers file and increment regeneration count
        project_dir = processor.get_project_dir(project_id)
        answers_file = project_dir / "answers.json"
        
        if answers_file.exists():
            with open(answers_file, 'r', encoding='utf-8') as f:
                answers_data = json.load(f)
            
            answers_data['regeneration_count'] = answers_data.get('regeneration_count', 0) + 1
            answers_data['last_regenerated'] = datetime.now().isoformat()
            
            with open(answers_file, 'w', encoding='utf-8') as f:
                json.dump(answers_data, f, indent=2, ensure_ascii=False)
        
        # Force regenerate questions (will call OpenAI API)
        result = processor.start_interactive_session(project_id, max_questions, force_regenerate=True)
        
        return {
            "status": "success",
            "message": "Questions regenerated successfully",
            **result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        error_detail = f"Error regenerating questions: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=f"Error regenerating questions: {str(e)}")


@router.post("/{project_id}/interactive-questions/finalize")
async def finalize_interactive_session(project_id: str):
    """Finalize the interactive session"""
    try:
        result = processor.finalize_session(project_id)
        return {
            "status": "success",
            "message": "Interactive session finalized successfully",
            **result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error finalizing session: {str(e)}")
