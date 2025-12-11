"""
Insights Generator Service - AI-powered generation of project insights
"""

import os
import json
import pandas as pd
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from openai import OpenAI
import uuid

from api.models.insights import (
    Deliverable, Risk, TeamMember, WeeklySummary, PRDDecision
)


class InsightsGenerator:
    """Generates project insights using AI and data analysis"""
    
    def __init__(self, client: OpenAI, project_dir: Path):
        self.client = client
        self.project_dir = project_dir
    
    def generate_deliverables(self) -> List[Deliverable]:
        """
        Extract deliverables from backlog (Epics) and PRD
        Returns a list of Deliverable objects
        """
        deliverables = []
        
        # Try to read backlog CSV
        outputs_dir = self.project_dir / "outputs"
        backlog_files = list(outputs_dir.glob("jira_backlog*.csv")) if outputs_dir.exists() else []
        
        if backlog_files:
            # Get the most recent backlog file
            backlog_file = max(backlog_files, key=lambda f: f.stat().st_mtime)
            
            try:
                df = pd.read_csv(backlog_file)
                # Normalize column names
                df.columns = df.columns.str.lower().str.replace(' ', '_')
                
                # Extract Epics
                if 'issue_type' in df.columns:
                    epics = df[df['issue_type'] == 'Epic']
                    
                    for idx, epic in epics.iterrows():
                        deliverable_id = f"del_{uuid.uuid4().hex[:8]}"
                        
                        # Calculate estimated due date based on story points
                        story_points = epic.get('story_points', 13)
                        days_estimate = story_points * 2  # Rough estimate: 2 days per story point
                        due_date = (datetime.now() + timedelta(days=days_estimate)).strftime('%Y-%m-%d')
                        
                        deliverables.append(Deliverable(
                            id=deliverable_id,
                            name=epic.get('summary', 'Unnamed Epic'),
                            description=epic.get('description', '')[:200],  # First 200 chars
                            due_date=due_date,
                            progress=0.0,
                            status="planned",
                            created_at=datetime.now().isoformat(),
                            updated_at=datetime.now().isoformat(),
                            source="auto"
                        ))
            except Exception as e:
                print(f"Error reading backlog for deliverables: {e}")
        
        # If no deliverables from backlog, try to extract from PRD
        if not deliverables:
            prd_file = self.project_dir / "outputs" / "prd_final.md"
            if prd_file.exists():
                deliverables = self._extract_deliverables_from_prd(prd_file)
        
        return deliverables
    
    def _extract_deliverables_from_prd(self, prd_file: Path) -> List[Deliverable]:
        """Extract deliverables from PRD using AI"""
        try:
            with open(prd_file, 'r', encoding='utf-8') as f:
                prd_content = f.read()
            
            # Use OpenAI to extract milestones/deliverables
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a project analyst. Extract major deliverables/milestones from the PRD. Return a JSON array with objects containing: name, description (brief), estimated_weeks. Return 3-5 key deliverables."
                    },
                    {
                        "role": "user",
                        "content": f"PRD:\n\n{prd_content[:8000]}"  # First 8000 chars
                    }
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            deliverables_data = result.get("deliverables", [])
            
            deliverables = []
            for idx, item in enumerate(deliverables_data[:5]):
                deliverable_id = f"del_{uuid.uuid4().hex[:8]}"
                weeks = item.get("estimated_weeks", 4)
                due_date = (datetime.now() + timedelta(weeks=weeks)).strftime('%Y-%m-%d')
                
                deliverables.append(Deliverable(
                    id=deliverable_id,
                    name=item.get("name", f"Deliverable {idx+1}"),
                    description=item.get("description", ""),
                    due_date=due_date,
                    progress=0.0,
                    status="planned",
                    created_at=datetime.now().isoformat(),
                    updated_at=datetime.now().isoformat(),
                    source="auto"
                ))
            
            return deliverables
        except Exception as e:
            print(f"Error extracting deliverables from PRD: {e}")
            return []
    
    def generate_risks(self) -> List[Risk]:
        """
        Analyze PRD to identify and generate risks
        Returns a list of Risk objects
        """
        prd_file = self.project_dir / "outputs" / "prd_final.md"
        
        if not prd_file.exists():
            return []
        
        try:
            with open(prd_file, 'r', encoding='utf-8') as f:
                prd_content = f.read()
            
            # Use OpenAI to identify risks
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a risk analyst. Analyze the PRD and identify 5-10 key risks.
For each risk, provide:
- title: Short risk title
- description: Detailed description
- severity: critical, high, medium, or low
- sector: Engineering, Design, Business, Operations, Security, etc.
- mitigation_plan: How to mitigate this risk
- probability: 0.0 to 1.0
- impact: high, medium, or low

Look for:
1. Explicit risks in "Risks & Challenges" sections
2. Implicit risks (complex dependencies, tight timelines, unclear requirements)
3. Technical risks (scalability, performance, security)
4. Business risks (market timing, competition)

Return a JSON object with a "risks" array."""
                    },
                    {
                        "role": "user",
                        "content": f"PRD:\n\n{prd_content[:12000]}"  # First 12000 chars
                    }
                ],
                temperature=0.4,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            risks_data = result.get("risks", [])
            
            risks = []
            for item in risks_data[:10]:
                risk_id = f"risk_{uuid.uuid4().hex[:8]}"
                
                risks.append(Risk(
                    id=risk_id,
                    title=item.get("title", "Unnamed Risk"),
                    description=item.get("description", ""),
                    severity=item.get("severity", "medium"),
                    sector=item.get("sector", "General"),
                    status="active",
                    mitigation_plan=item.get("mitigation_plan"),
                    probability=item.get("probability"),
                    impact=item.get("impact"),
                    created_at=datetime.now().isoformat(),
                    updated_at=datetime.now().isoformat(),
                    source="auto"
                ))
            
            return risks
        except Exception as e:
            print(f"Error generating risks: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def generate_team_workload(self) -> List[TeamMember]:
        """
        Extract team workload from backlog assignees
        Returns a list of TeamMember objects
        """
        team_members = []
        
        # Try to read backlog CSV
        outputs_dir = self.project_dir / "outputs"
        backlog_files = list(outputs_dir.glob("jira_backlog*.csv")) if outputs_dir.exists() else []
        
        if backlog_files:
            # Get the most recent backlog file
            backlog_file = max(backlog_files, key=lambda f: f.stat().st_mtime)
            
            try:
                df = pd.read_csv(backlog_file)
                # Normalize column names
                df.columns = df.columns.str.lower().str.replace(' ', '_')
                
                # Check if assignee column exists
                if 'assignee' in df.columns and df['assignee'].notna().any():
                    # Group by assignee
                    assignee_stats = df.groupby('assignee').agg({
                        'summary': 'count',  # Task count
                        'story_points': 'sum'  # Total story points
                    }).reset_index()
                    
                    # Calculate max workload for percentage
                    max_story_points = assignee_stats['story_points'].max()
                    
                    for _, row in assignee_stats.iterrows():
                        member_id = f"tm_{uuid.uuid4().hex[:8]}"
                        story_points = row.get('story_points', 0)
                        workload_pct = (story_points / max_story_points * 100) if max_story_points > 0 else 0
                        
                        # Determine status based on workload
                        if workload_pct > 80:
                            status = "overloaded"
                        elif workload_pct < 30:
                            status = "available"
                        else:
                            status = "active"
                        
                        team_members.append(TeamMember(
                            id=member_id,
                            name=row.get('assignee', 'Unknown'),
                            assigned_tasks_count=int(row.get('summary', 0)),
                            total_story_points=float(story_points),
                            workload_percentage=float(workload_pct),
                            status=status,
                            created_at=datetime.now().isoformat(),
                            updated_at=datetime.now().isoformat()
                        ))
                else:
                    # No assignees, create placeholder team
                    team_members = self._create_placeholder_team()
            except Exception as e:
                print(f"Error reading backlog for team workload: {e}")
                team_members = self._create_placeholder_team()
        else:
            # No backlog, create placeholder team
            team_members = self._create_placeholder_team()
        
        return team_members
    
    def _create_placeholder_team(self) -> List[TeamMember]:
        """Create placeholder team members with 0 workload"""
        placeholder_names = ["Alice", "Bob", "Charlie"]
        team_members = []
        
        for name in placeholder_names:
            member_id = f"tm_{uuid.uuid4().hex[:8]}"
            team_members.append(TeamMember(
                id=member_id,
                name=name,
                assigned_tasks_count=0,
                total_story_points=0.0,
                workload_percentage=0.0,
                status="available",
                created_at=datetime.now().isoformat(),
                updated_at=datetime.now().isoformat()
            ))
        
        return team_members
    
    def generate_weekly_summary(self) -> WeeklySummary:
        """
        Generate AI-powered weekly summary of project status
        Analyzes PRD, backlog, risks, deliverables, and team workload
        """
        # Gather all project data
        context_parts = []
        
        # 1. Read PRD
        prd_file = self.project_dir / "outputs" / "prd_final.md"
        if prd_file.exists():
            with open(prd_file, 'r', encoding='utf-8') as f:
                prd_content = f.read()[:5000]  # First 5000 chars
                context_parts.append(f"PRD Overview:\n{prd_content}")
        
        # 2. Read backlog
        outputs_dir = self.project_dir / "outputs"
        backlog_files = list(outputs_dir.glob("jira_backlog*.csv")) if outputs_dir.exists() else []
        if backlog_files:
            backlog_file = max(backlog_files, key=lambda f: f.stat().st_mtime)
            try:
                df = pd.read_csv(backlog_file)
                total_tasks = len(df)
                total_story_points = df['Story Points'].sum() if 'Story Points' in df.columns else 0
                context_parts.append(f"\nBacklog: {total_tasks} tasks, {total_story_points} story points")
            except:
                pass
        
        # 3. Read risks
        risks_file = self.project_dir / "risks.json"
        if risks_file.exists():
            with open(risks_file, 'r', encoding='utf-8') as f:
                risks_data = json.load(f)
                critical_risks = [r for r in risks_data.get('risks', []) if r.get('severity') == 'critical']
                context_parts.append(f"\nRisks: {len(risks_data.get('risks', []))} total, {len(critical_risks)} critical")
        
        # 4. Read deliverables
        deliverables_file = self.project_dir / "deliverables.json"
        if deliverables_file.exists():
            with open(deliverables_file, 'r', encoding='utf-8') as f:
                deliverables_data = json.load(f)
                deliverables = deliverables_data.get('deliverables', [])
                avg_progress = sum(d.get('progress', 0) for d in deliverables) / len(deliverables) if deliverables else 0
                context_parts.append(f"\nDeliverables: {len(deliverables)} total, {avg_progress*100:.0f}% average progress")
        
        # 5. Calculate overall completion
        # Read project state
        state_file = self.project_dir / "state.json"
        completion_pct = 0.0
        if state_file.exists():
            with open(state_file, 'r', encoding='utf-8') as f:
                state = json.load(f)
                steps = [
                    state.get('inputs_processed', False),
                    state.get('gaps_analyzed', False),
                    state.get('questions_generated', False),
                    state.get('prd_built', False),
                    state.get('backlog_generated', False)
                ]
                completion_pct = sum(steps) / len(steps) if steps else 0.0
        
        # Generate AI summary
        try:
            combined_context = "\n".join(context_parts)
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a project manager assistant. Generate a weekly project summary.
Return a JSON object with:
- summary: 2-3 paragraph narrative summary of project status
- highlights: Array of 3-5 key achievements/progress points
- blockers: Array of 2-4 current blockers or challenges
- next_steps: Array of 3-5 recommended next actions

Be concise, actionable, and focus on what matters most."""
                    },
                    {
                        "role": "user",
                        "content": f"Project Data:\n{combined_context}\n\nOverall Completion: {completion_pct*100:.0f}%"
                    }
                ],
                temperature=0.5,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Calculate week range
            today = datetime.now()
            week_start = (today - timedelta(days=today.weekday())).strftime('%Y-%m-%d')
            week_end = (today + timedelta(days=(6 - today.weekday()))).strftime('%Y-%m-%d')
            
            return WeeklySummary(
                id=f"summary_{uuid.uuid4().hex[:8]}",
                week_start=week_start,
                week_end=week_end,
                completion_percentage=completion_pct,
                summary=result.get("summary", "No summary available"),
                highlights=result.get("highlights", []),
                blockers=result.get("blockers", []),
                next_steps=result.get("next_steps", []),
                created_at=datetime.now().isoformat(),
                updated_at=datetime.now().isoformat(),
                is_manual_edit=False
            )
        except Exception as e:
            print(f"Error generating weekly summary: {e}")
            import traceback
            traceback.print_exc()
            
            # Return basic summary on error
            today = datetime.now()
            week_start = (today - timedelta(days=today.weekday())).strftime('%Y-%m-%d')
            week_end = (today + timedelta(days=(6 - today.weekday()))).strftime('%Y-%m-%d')
            
            return WeeklySummary(
                id=f"summary_{uuid.uuid4().hex[:8]}",
                week_start=week_start,
                week_end=week_end,
                completion_percentage=completion_pct,
                summary=f"Project is {completion_pct*100:.0f}% complete. All insights have been generated.",
                highlights=["PRD completed", "Backlog generated"],
                blockers=[],
                next_steps=["Review deliverables", "Assign tasks"],
                created_at=datetime.now().isoformat(),
                updated_at=datetime.now().isoformat(),
                is_manual_edit=False
            )
    
    def track_prd_changes(self, previous_prd_content: str, current_prd_content: str) -> List[PRDDecision]:
        """
        Track changes between PRD versions and generate decision summaries
        Uses AI to identify semantic changes
        """
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a technical writer analyzing PRD changes. 
Identify major semantic changes between two PRD versions.
Return a JSON object with a "changes" array.
Each change should have:
- description: What changed (1-2 sentences)
- section_affected: Which section was affected
- change_type: "added", "modified", or "removed"
- details: More context if needed

Focus on significant changes, not minor wording tweaks. Return 3-8 key changes."""
                    },
                    {
                        "role": "user",
                        "content": f"Previous PRD (first 3000 chars):\n{previous_prd_content[:3000]}\n\nCurrent PRD (first 3000 chars):\n{current_prd_content[:3000]}"
                    }
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            changes_data = result.get("changes", [])
            
            decisions = []
            for change in changes_data[:10]:
                decision_id = f"dec_{uuid.uuid4().hex[:8]}"
                
                decisions.append(PRDDecision(
                    id=decision_id,
                    description=change.get("description", ""),
                    section_affected=change.get("section_affected"),
                    timestamp=datetime.now().isoformat(),
                    change_type=change.get("change_type", "modified"),
                    details=change.get("details")
                ))
            
            return decisions
        except Exception as e:
            print(f"Error tracking PRD changes: {e}")
            return []


def generate_all_insights(project_dir: Path, client: OpenAI) -> Dict:
    """
    Generate all insights for a project
    Returns dict with results for each insight type
    """
    generator = InsightsGenerator(client, project_dir)
    
    results = {
        "deliverables": [],
        "risks": [],
        "team_members": [],
        "weekly_summary": None
    }
    
    try:
        # Generate deliverables
        deliverables = generator.generate_deliverables()
        results["deliverables"] = deliverables
        
        # Save deliverables
        deliverables_file = project_dir / "deliverables.json"
        with open(deliverables_file, 'w', encoding='utf-8') as f:
            json.dump({
                "deliverables": [d.model_dump() for d in deliverables],
                "generated_at": datetime.now().isoformat()
            }, f, indent=2, ensure_ascii=False)
        
        # Generate risks
        risks = generator.generate_risks()
        results["risks"] = risks
        
        # Save risks
        risks_file = project_dir / "risks.json"
        with open(risks_file, 'w', encoding='utf-8') as f:
            json.dump({
                "risks": [r.model_dump() for r in risks],
                "generated_at": datetime.now().isoformat()
            }, f, indent=2, ensure_ascii=False)
        
        # Generate team workload
        team_members = generator.generate_team_workload()
        results["team_members"] = team_members
        
        # Save team members
        team_file = project_dir / "team_members.json"
        with open(team_file, 'w', encoding='utf-8') as f:
            json.dump({
                "team_members": [tm.model_dump() for tm in team_members],
                "generated_at": datetime.now().isoformat()
            }, f, indent=2, ensure_ascii=False)
        
        # Generate weekly summary
        weekly_summary = generator.generate_weekly_summary()
        results["weekly_summary"] = weekly_summary
        
        # Save weekly summary
        summary_file = project_dir / "weekly_summary.json"
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump({
                "summary": weekly_summary.model_dump(),
                "generated_at": datetime.now().isoformat()
            }, f, indent=2, ensure_ascii=False)
        
        # Initialize empty meetings and PRD decisions files
        meetings_file = project_dir / "meetings.json"
        if not meetings_file.exists():
            with open(meetings_file, 'w', encoding='utf-8') as f:
                json.dump({
                    "meetings": [],
                    "generated_at": datetime.now().isoformat()
                }, f, indent=2, ensure_ascii=False)
        
        prd_decisions_file = project_dir / "prd_decisions.json"
        if not prd_decisions_file.exists():
            with open(prd_decisions_file, 'w', encoding='utf-8') as f:
                json.dump({
                    "decisions": [],
                    "generated_at": datetime.now().isoformat()
                }, f, indent=2, ensure_ascii=False)
        
        return results
    except Exception as e:
        print(f"Error generating insights: {e}")
        import traceback
        traceback.print_exc()
        return results
