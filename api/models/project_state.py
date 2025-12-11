"""
Project State Model - Tracks the state of each project's processing steps
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProjectState(BaseModel):
    """State of a project's processing steps (Feature/PRD)"""
    project_id: str
    project_name: str
    created_at: str
    updated_at: str
    
    # Workspace reference (None for standalone features)
    workspace_id: Optional[str] = None
    
    # Feature status within workspace
    feature_status: Optional[str] = None  # "idea", "backlog", "in_progress", "completed", "discarded"
    is_idea: bool = False  # True if this is just an idea (no documents/content)
    
    # Processing steps status
    inputs_processed: bool = False
    context_generated: bool = False
    gaps_analyzed: bool = False
    questions_generated: bool = False
    prd_built: bool = False
    backlog_generated: bool = False
    insights_generated: bool = False
    
    # Interactive session status
    interactive_session_active: bool = False
    questions_answered_count: Optional[int] = 0
    questions_skipped_count: Optional[int] = 0
    
    # Optional data
    language_code: Optional[str] = None
    context_length: Optional[int] = None
    gaps_count: Optional[int] = None
    questions_count: Optional[int] = None
    
    # Versioning
    current_version: int = 1
    version_history: List[dict] = []

    # Brief lifecycle (para features sin documentos iniciales)
    brief_generated: bool = False
    brief_content: Optional[str] = None
    brief_ready_for_prd: bool = False
    brief_iterations: int = 0
    brief_deleted_sections: List[str] = []
    prd_deleted_sections: List[str] = []
    prd_deleted_blocks: List[dict] = []
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON storage"""
        return self.model_dump()

