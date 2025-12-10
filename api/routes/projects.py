"""
Projects API routes - Modular project processing
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Optional, Dict
from pydantic import BaseModel
from pathlib import Path
import json
import shutil
from datetime import datetime

from api.services.project_processor import ProjectProcessor

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


@router.get("/{project_id}/gaps")
async def get_gaps(project_id: str):
    """Get analyzed gaps"""
    state = processor.load_state(project_id)
    if not state:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not state.gaps_analyzed:
        raise HTTPException(status_code=400, detail="Gaps not analyzed yet")
    
    project_dir = processor.get_project_dir(project_id)
    analysis_file = project_dir / "analysis.json"
    
    if not analysis_file.exists():
        # Si el estado dice que está analizado pero no hay archivo, retornar vacío
        return {
            "gaps_count": 0,
            "gaps": [],
            "message": "Analysis file not found, but gaps were marked as analyzed"
        }
    
    try:
        with open(analysis_file, 'r', encoding='utf-8') as f:
            analysis_data = json.load(f)
        return {
            "gaps_count": analysis_data.get("gaps_count", 0),
            "gaps": analysis_data.get("gaps", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading analysis file: {str(e)}")


@router.get("/{project_id}/backlog")
async def get_backlog(project_id: str):
    """Get project backlog"""
    state = processor.load_state(project_id)
    if not state:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not state.backlog_generated:
        raise HTTPException(status_code=400, detail="Backlog not generated yet")
    
    project_dir = processor.get_project_dir(project_id)
    backlog_file = project_dir / "outputs" / "jira_backlog.csv"
    
    if backlog_file.exists():
        # In production, parse CSV and return structured data
        import pandas as pd
        df = pd.read_csv(backlog_file)
        return {"items": df.to_dict('records')}
    
    return {"items": []}


@router.get("/{project_id}/risks")
async def get_risks(project_id: str):
    """Get project risks"""
    return {
        "risks": [
            {
                "id": "risk-1",
                "title": "Security review pending",
                "severity": "critical",
                "sector": "Engineering",
                "description": "Security review is blocking deployment"
            }
        ]
    }


@router.get("/{project_id}/timeline")
async def get_timeline(project_id: str):
    """Get predictive timeline"""
    return {
        "milestones": [
            {"id": "m1", "name": "Milestone 1", "date": "2024-12-15", "status": "completed"},
            {"id": "m2", "name": "Milestone 2", "date": "2024-12-20", "status": "at-risk"},
            {"id": "m3", "name": "Milestone 3", "date": "2024-12-25", "status": "planned"}
        ],
        "deliverables": [
            {"id": "d1", "name": "Deliverable A", "due_date": "2024-12-15", "progress": 0.8},
            {"id": "d2", "name": "Deliverable B", "due_date": "2024-12-20", "progress": 0.6}
        ],
        "delay_zones": [
            {"start": "2024-12-18", "end": "2024-12-22", "severity": "medium"}
        ]
    }


@router.get("/{project_id}/meetings")
async def get_meetings(project_id: str):
    """Get meeting summaries"""
    return {
        "meetings": [
            {
                "id": "meeting-1",
                "title": "Sprint Planning Meeting",
                "date": "2024-12-10",
                "participants": 5,
                "decisions": ["Feature scope approved", "Timeline adjusted"],
                "action_items": [
                    {"task": "Complete PRD review", "owner": "Alice", "done": False}
                ]
            }
        ]
    }


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
