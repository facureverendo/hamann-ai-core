"""
Project Insights Models - Models for auto-generated and manually editable project insights
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class Deliverable(BaseModel):
    """Deliverable/Milestone from the project roadmap"""
    id: str
    name: str
    description: Optional[str] = None
    due_date: str  # ISO format date
    progress: float = 0.0  # 0.0 to 1.0
    status: str = "planned"  # planned, in_progress, completed, at_risk
    created_at: str
    updated_at: str
    source: str = "auto"  # auto or manual


class Risk(BaseModel):
    """Project risk identification and tracking"""
    id: str
    title: str
    description: str
    severity: str  # critical, high, medium, low
    sector: str  # Engineering, Design, Business, Operations, etc.
    status: str = "active"  # active, mitigated, resolved
    mitigation_plan: Optional[str] = None
    probability: Optional[float] = None  # 0.0 to 1.0
    impact: Optional[str] = None
    created_at: str
    updated_at: str
    source: str = "auto"  # auto or manual


class TeamMember(BaseModel):
    """Team member workload tracking"""
    id: str
    name: str
    role: Optional[str] = None
    assigned_tasks_count: int = 0
    total_story_points: float = 0.0
    workload_percentage: float = 0.0  # 0-100
    status: str = "active"  # active, overloaded, available
    created_at: str
    updated_at: str


class ActionItem(BaseModel):
    """Action item from a meeting"""
    task: str
    owner: str
    done: bool = False
    due_date: Optional[str] = None


class Meeting(BaseModel):
    """Meeting summary and recap"""
    id: str
    title: str
    date: str  # ISO format date
    participants: int
    summary: Optional[str] = None
    decisions: List[str] = []
    action_items: List[ActionItem] = []
    transcript_file: Optional[str] = None
    created_at: str
    updated_at: str


class PRDDecision(BaseModel):
    """PRD decision/change tracking"""
    id: str
    description: str
    section_affected: Optional[str] = None
    timestamp: str
    change_type: str  # added, modified, removed
    details: Optional[str] = None


class WeeklySummary(BaseModel):
    """Weekly AI-generated project summary"""
    id: str
    week_start: str  # ISO format date
    week_end: str  # ISO format date
    completion_percentage: float
    summary: str  # Main narrative summary
    highlights: List[str] = []
    blockers: List[str] = []
    next_steps: List[str] = []
    created_at: str
    updated_at: str
    is_manual_edit: bool = False


# Request/Response models for API

class CreateDeliverableRequest(BaseModel):
    name: str
    description: Optional[str] = None
    due_date: str
    progress: float = 0.0
    status: str = "planned"


class UpdateDeliverableRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    progress: Optional[float] = None
    status: Optional[str] = None


class CreateRiskRequest(BaseModel):
    title: str
    description: str
    severity: str
    sector: str
    mitigation_plan: Optional[str] = None
    probability: Optional[float] = None
    impact: Optional[str] = None


class UpdateRiskRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    sector: Optional[str] = None
    status: Optional[str] = None
    mitigation_plan: Optional[str] = None
    probability: Optional[float] = None
    impact: Optional[str] = None


class CreateMeetingRequest(BaseModel):
    title: str
    date: str
    participants: int
    summary: Optional[str] = None
    decisions: List[str] = []
    action_items: List[ActionItem] = []


class UpdateMeetingRequest(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    participants: Optional[int] = None
    summary: Optional[str] = None
    decisions: Optional[List[str]] = None
    action_items: Optional[List[ActionItem]] = None


class CreateTeamMemberRequest(BaseModel):
    name: str
    role: Optional[str] = None


class UpdateTeamMemberRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    assigned_tasks_count: Optional[int] = None
    total_story_points: Optional[float] = None
    workload_percentage: Optional[float] = None
    status: Optional[str] = None
