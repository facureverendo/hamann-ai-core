"""
Project State Model - Tracks the state of each project's processing steps
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProjectState(BaseModel):
    """State of a project's processing steps"""
    project_id: str
    project_name: str
    created_at: str
    updated_at: str
    
    # Processing steps status
    inputs_processed: bool = False
    context_generated: bool = False
    gaps_analyzed: bool = False
    questions_generated: bool = False
    prd_built: bool = False
    backlog_generated: bool = False
    
    # Optional data
    language_code: Optional[str] = None
    context_length: Optional[int] = None
    gaps_count: Optional[int] = None
    questions_count: Optional[int] = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON storage"""
        return self.model_dump()

