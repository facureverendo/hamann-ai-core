"""
Insights API routes - CRUD endpoints for project insights
"""

from fastapi import APIRouter, HTTPException
from typing import List
from pathlib import Path
import json
from datetime import datetime
import uuid

from api.models.insights import (
    Deliverable, Risk, TeamMember, Meeting, PRDDecision, WeeklySummary,
    CreateDeliverableRequest, UpdateDeliverableRequest,
    CreateRiskRequest, UpdateRiskRequest,
    CreateMeetingRequest, UpdateMeetingRequest,
    CreateTeamMemberRequest, UpdateTeamMemberRequest
)

router = APIRouter()

PROJECTS_DIR = Path(__file__).parent.parent.parent / "projects"


def get_project_dir(project_id: str) -> Path:
    """Get project directory path"""
    return PROJECTS_DIR / project_id


def load_json_file(file_path: Path, default_key: str):
    """Load JSON file or return default structure"""
    if file_path.exists():
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {default_key: [], "generated_at": datetime.now().isoformat()}


def save_json_file(file_path: Path, data: dict):
    """Save JSON file"""
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# ============================================================================
# DELIVERABLES ENDPOINTS
# ============================================================================

@router.get("/{project_id}/deliverables")
async def get_deliverables(project_id: str):
    """Get all deliverables for a project"""
    project_dir = get_project_dir(project_id)
    deliverables_file = project_dir / "deliverables.json"
    
    data = load_json_file(deliverables_file, "deliverables")
    return {"deliverables": data.get("deliverables", [])}


@router.post("/{project_id}/deliverables")
async def create_deliverable(project_id: str, request: CreateDeliverableRequest):
    """Create a new deliverable"""
    project_dir = get_project_dir(project_id)
    deliverables_file = project_dir / "deliverables.json"
    
    data = load_json_file(deliverables_file, "deliverables")
    
    # Create new deliverable
    new_deliverable = Deliverable(
        id=f"del_{uuid.uuid4().hex[:8]}",
        name=request.name,
        description=request.description,
        due_date=request.due_date,
        progress=request.progress,
        status=request.status,
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat(),
        source="manual"
    )
    
    data["deliverables"].append(new_deliverable.model_dump())
    save_json_file(deliverables_file, data)
    
    return new_deliverable


@router.put("/{project_id}/deliverables/{deliverable_id}")
async def update_deliverable(project_id: str, deliverable_id: str, request: UpdateDeliverableRequest):
    """Update an existing deliverable"""
    project_dir = get_project_dir(project_id)
    deliverables_file = project_dir / "deliverables.json"
    
    data = load_json_file(deliverables_file, "deliverables")
    
    # Find and update deliverable
    found = False
    for deliverable in data["deliverables"]:
        if deliverable["id"] == deliverable_id:
            if request.name is not None:
                deliverable["name"] = request.name
            if request.description is not None:
                deliverable["description"] = request.description
            if request.due_date is not None:
                deliverable["due_date"] = request.due_date
            if request.progress is not None:
                deliverable["progress"] = request.progress
            if request.status is not None:
                deliverable["status"] = request.status
            deliverable["updated_at"] = datetime.now().isoformat()
            found = True
            break
    
    if not found:
        raise HTTPException(status_code=404, detail="Deliverable not found")
    
    save_json_file(deliverables_file, data)
    return {"status": "success", "message": "Deliverable updated"}


@router.delete("/{project_id}/deliverables/{deliverable_id}")
async def delete_deliverable(project_id: str, deliverable_id: str):
    """Delete a deliverable"""
    project_dir = get_project_dir(project_id)
    deliverables_file = project_dir / "deliverables.json"
    
    data = load_json_file(deliverables_file, "deliverables")
    
    # Filter out the deliverable
    original_length = len(data["deliverables"])
    data["deliverables"] = [d for d in data["deliverables"] if d["id"] != deliverable_id]
    
    if len(data["deliverables"]) == original_length:
        raise HTTPException(status_code=404, detail="Deliverable not found")
    
    save_json_file(deliverables_file, data)
    return {"status": "success", "message": "Deliverable deleted"}


# ============================================================================
# RISKS ENDPOINTS
# ============================================================================

@router.get("/{project_id}/risks")
async def get_risks(project_id: str):
    """Get all risks for a project"""
    project_dir = get_project_dir(project_id)
    risks_file = project_dir / "risks.json"
    
    data = load_json_file(risks_file, "risks")
    return {"risks": data.get("risks", [])}


@router.post("/{project_id}/risks")
async def create_risk(project_id: str, request: CreateRiskRequest):
    """Create a new risk"""
    project_dir = get_project_dir(project_id)
    risks_file = project_dir / "risks.json"
    
    data = load_json_file(risks_file, "risks")
    
    # Create new risk
    new_risk = Risk(
        id=f"risk_{uuid.uuid4().hex[:8]}",
        title=request.title,
        description=request.description,
        severity=request.severity,
        sector=request.sector,
        status="active",
        mitigation_plan=request.mitigation_plan,
        probability=request.probability,
        impact=request.impact,
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat(),
        source="manual"
    )
    
    data["risks"].append(new_risk.model_dump())
    save_json_file(risks_file, data)
    
    return new_risk


@router.put("/{project_id}/risks/{risk_id}")
async def update_risk(project_id: str, risk_id: str, request: UpdateRiskRequest):
    """Update an existing risk"""
    project_dir = get_project_dir(project_id)
    risks_file = project_dir / "risks.json"
    
    data = load_json_file(risks_file, "risks")
    
    # Find and update risk
    found = False
    for risk in data["risks"]:
        if risk["id"] == risk_id:
            if request.title is not None:
                risk["title"] = request.title
            if request.description is not None:
                risk["description"] = request.description
            if request.severity is not None:
                risk["severity"] = request.severity
            if request.sector is not None:
                risk["sector"] = request.sector
            if request.status is not None:
                risk["status"] = request.status
            if request.mitigation_plan is not None:
                risk["mitigation_plan"] = request.mitigation_plan
            if request.probability is not None:
                risk["probability"] = request.probability
            if request.impact is not None:
                risk["impact"] = request.impact
            risk["updated_at"] = datetime.now().isoformat()
            found = True
            break
    
    if not found:
        raise HTTPException(status_code=404, detail="Risk not found")
    
    save_json_file(risks_file, data)
    return {"status": "success", "message": "Risk updated"}


@router.delete("/{project_id}/risks/{risk_id}")
async def delete_risk(project_id: str, risk_id: str):
    """Delete a risk"""
    project_dir = get_project_dir(project_id)
    risks_file = project_dir / "risks.json"
    
    data = load_json_file(risks_file, "risks")
    
    # Filter out the risk
    original_length = len(data["risks"])
    data["risks"] = [r for r in data["risks"] if r["id"] != risk_id]
    
    if len(data["risks"]) == original_length:
        raise HTTPException(status_code=404, detail="Risk not found")
    
    save_json_file(risks_file, data)
    return {"status": "success", "message": "Risk deleted"}


# ============================================================================
# TEAM MEMBERS ENDPOINTS
# ============================================================================

@router.get("/{project_id}/team-members")
async def get_team_members(project_id: str):
    """Get all team members for a project"""
    project_dir = get_project_dir(project_id)
    team_file = project_dir / "team_members.json"
    
    data = load_json_file(team_file, "team_members")
    return {"team_members": data.get("team_members", [])}


@router.post("/{project_id}/team-members")
async def create_team_member(project_id: str, request: CreateTeamMemberRequest):
    """Create a new team member"""
    project_dir = get_project_dir(project_id)
    team_file = project_dir / "team_members.json"
    
    data = load_json_file(team_file, "team_members")
    
    # Create new team member
    new_member = TeamMember(
        id=f"tm_{uuid.uuid4().hex[:8]}",
        name=request.name,
        role=request.role,
        assigned_tasks_count=0,
        total_story_points=0.0,
        workload_percentage=0.0,
        status="available",
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    )
    
    data["team_members"].append(new_member.model_dump())
    save_json_file(team_file, data)
    
    return new_member


@router.put("/{project_id}/team-members/{member_id}")
async def update_team_member(project_id: str, member_id: str, request: UpdateTeamMemberRequest):
    """Update an existing team member"""
    project_dir = get_project_dir(project_id)
    team_file = project_dir / "team_members.json"
    
    data = load_json_file(team_file, "team_members")
    
    # Find and update team member
    found = False
    for member in data["team_members"]:
        if member["id"] == member_id:
            if request.name is not None:
                member["name"] = request.name
            if request.role is not None:
                member["role"] = request.role
            if request.assigned_tasks_count is not None:
                member["assigned_tasks_count"] = request.assigned_tasks_count
            if request.total_story_points is not None:
                member["total_story_points"] = request.total_story_points
            if request.workload_percentage is not None:
                member["workload_percentage"] = request.workload_percentage
            if request.status is not None:
                member["status"] = request.status
            member["updated_at"] = datetime.now().isoformat()
            found = True
            break
    
    if not found:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    save_json_file(team_file, data)
    return {"status": "success", "message": "Team member updated"}


@router.delete("/{project_id}/team-members/{member_id}")
async def delete_team_member(project_id: str, member_id: str):
    """Delete a team member"""
    project_dir = get_project_dir(project_id)
    team_file = project_dir / "team_members.json"
    
    data = load_json_file(team_file, "team_members")
    
    # Filter out the team member
    original_length = len(data["team_members"])
    data["team_members"] = [m for m in data["team_members"] if m["id"] != member_id]
    
    if len(data["team_members"]) == original_length:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    save_json_file(team_file, data)
    return {"status": "success", "message": "Team member deleted"}


@router.post("/{project_id}/team-members/sync-from-backlog")
async def sync_team_from_backlog(project_id: str):
    """Recalculate team workload from backlog CSV"""
    from api.services.insights_generator import InsightsGenerator
    from openai import OpenAI
    import os
    
    project_dir = get_project_dir(project_id)
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    generator = InsightsGenerator(client, project_dir)
    team_members = generator.generate_team_workload()
    
    # Save team members
    team_file = project_dir / "team_members.json"
    save_json_file(team_file, {
        "team_members": [tm.model_dump() for tm in team_members],
        "generated_at": datetime.now().isoformat()
    })
    
    return {"status": "success", "message": "Team workload synced from backlog", "team_members": [tm.model_dump() for tm in team_members]}


# ============================================================================
# MEETINGS ENDPOINTS
# ============================================================================

@router.get("/{project_id}/meetings")
async def get_meetings(project_id: str):
    """Get all meetings for a project"""
    project_dir = get_project_dir(project_id)
    meetings_file = project_dir / "meetings.json"
    
    data = load_json_file(meetings_file, "meetings")
    return {"meetings": data.get("meetings", [])}


@router.post("/{project_id}/meetings")
async def create_meeting(project_id: str, request: CreateMeetingRequest):
    """Create a new meeting"""
    project_dir = get_project_dir(project_id)
    meetings_file = project_dir / "meetings.json"
    
    data = load_json_file(meetings_file, "meetings")
    
    # Create new meeting
    new_meeting = Meeting(
        id=f"meeting_{uuid.uuid4().hex[:8]}",
        title=request.title,
        date=request.date,
        participants=request.participants,
        summary=request.summary,
        decisions=request.decisions,
        action_items=request.action_items,
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    )
    
    data["meetings"].append(new_meeting.model_dump())
    save_json_file(meetings_file, data)
    
    return new_meeting


@router.put("/{project_id}/meetings/{meeting_id}")
async def update_meeting(project_id: str, meeting_id: str, request: UpdateMeetingRequest):
    """Update an existing meeting"""
    project_dir = get_project_dir(project_id)
    meetings_file = project_dir / "meetings.json"
    
    data = load_json_file(meetings_file, "meetings")
    
    # Find and update meeting
    found = False
    for meeting in data["meetings"]:
        if meeting["id"] == meeting_id:
            if request.title is not None:
                meeting["title"] = request.title
            if request.date is not None:
                meeting["date"] = request.date
            if request.participants is not None:
                meeting["participants"] = request.participants
            if request.summary is not None:
                meeting["summary"] = request.summary
            if request.decisions is not None:
                meeting["decisions"] = request.decisions
            if request.action_items is not None:
                meeting["action_items"] = [item.model_dump() for item in request.action_items]
            meeting["updated_at"] = datetime.now().isoformat()
            found = True
            break
    
    if not found:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    save_json_file(meetings_file, data)
    return {"status": "success", "message": "Meeting updated"}


@router.delete("/{project_id}/meetings/{meeting_id}")
async def delete_meeting(project_id: str, meeting_id: str):
    """Delete a meeting"""
    project_dir = get_project_dir(project_id)
    meetings_file = project_dir / "meetings.json"
    
    data = load_json_file(meetings_file, "meetings")
    
    # Filter out the meeting
    original_length = len(data["meetings"])
    data["meetings"] = [m for m in data["meetings"] if m["id"] != meeting_id]
    
    if len(data["meetings"]) == original_length:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    save_json_file(meetings_file, data)
    return {"status": "success", "message": "Meeting deleted"}


# ============================================================================
# PRD DECISIONS ENDPOINTS
# ============================================================================

@router.get("/{project_id}/prd-decisions")
async def get_prd_decisions(project_id: str, limit: int = 10):
    """Get recent PRD decisions (latest changes)"""
    project_dir = get_project_dir(project_id)
    decisions_file = project_dir / "prd_decisions.json"
    
    data = load_json_file(decisions_file, "decisions")
    decisions = data.get("decisions", [])
    
    # Sort by timestamp descending and limit
    decisions_sorted = sorted(decisions, key=lambda x: x.get("timestamp", ""), reverse=True)
    
    return {"decisions": decisions_sorted[:limit]}


# ============================================================================
# WEEKLY SUMMARY ENDPOINTS
# ============================================================================

@router.get("/{project_id}/weekly-summary")
async def get_weekly_summary(project_id: str):
    """Get weekly summary (uses cache if less than 24h old)"""
    project_dir = get_project_dir(project_id)
    summary_file = project_dir / "weekly_summary.json"
    
    data = load_json_file(summary_file, "summary")
    
    # Check if we need to regenerate (older than 24 hours)
    generated_at = data.get("generated_at", "")
    should_regenerate = False
    
    if generated_at:
        try:
            from datetime import datetime
            generated_time = datetime.fromisoformat(generated_at)
            age_hours = (datetime.now() - generated_time).total_seconds() / 3600
            should_regenerate = age_hours > 24
        except:
            should_regenerate = True
    else:
        should_regenerate = True
    
    if should_regenerate:
        # Regenerate summary
        from api.services.insights_generator import InsightsGenerator
        from openai import OpenAI
        import os
        
        client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        generator = InsightsGenerator(client, project_dir)
        
        try:
            summary = generator.generate_weekly_summary()
            data["summary"] = summary.model_dump()
            data["generated_at"] = datetime.now().isoformat()
            save_json_file(summary_file, data)
        except Exception as e:
            print(f"Error regenerating summary: {e}")
            # Return cached version if exists
            if "summary" not in data:
                raise HTTPException(status_code=500, detail="Failed to generate summary")
    
    return data.get("summary", {})


@router.post("/{project_id}/weekly-summary/regenerate")
async def regenerate_weekly_summary(project_id: str):
    """Force regenerate weekly summary"""
    from api.services.insights_generator import InsightsGenerator
    from openai import OpenAI
    import os
    
    project_dir = get_project_dir(project_id)
    summary_file = project_dir / "weekly_summary.json"
    
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    generator = InsightsGenerator(client, project_dir)
    
    summary = generator.generate_weekly_summary()
    
    save_json_file(summary_file, {
        "summary": summary.model_dump(),
        "generated_at": datetime.now().isoformat()
    })
    
    return {"status": "success", "message": "Weekly summary regenerated", "summary": summary.model_dump()}


@router.put("/{project_id}/weekly-summary")
async def update_weekly_summary(project_id: str, summary_text: str):
    """Manually edit the weekly summary"""
    project_dir = get_project_dir(project_id)
    summary_file = project_dir / "weekly_summary.json"
    
    data = load_json_file(summary_file, "summary")
    
    if "summary" not in data:
        raise HTTPException(status_code=404, detail="Weekly summary not found")
    
    data["summary"]["summary"] = summary_text
    data["summary"]["is_manual_edit"] = True
    data["summary"]["updated_at"] = datetime.now().isoformat()
    
    save_json_file(summary_file, data)
    
    return {"status": "success", "message": "Weekly summary updated"}
