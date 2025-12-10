"""
PRD API routes
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
from typing import List, Optional

router = APIRouter()

PROJECTS_DIR = Path(__file__).parent.parent.parent / "outputs"


class PRDSection(BaseModel):
    id: str
    title: str
    content: str
    expanded: bool = False


class PRDDetail(BaseModel):
    id: str
    title: str
    sections: List[PRDSection]
    version: str
    updated_at: str


@router.get("/{project_id}")
async def get_prd(project_id: str):
    """Get PRD for a project"""
    prd_file = PROJECTS_DIR / f"prd_{project_id}.md"
    
    if prd_file.exists():
        # Read and parse PRD file
        content = prd_file.read_text(encoding="utf-8")
        
        # Simple parsing - in production, use proper markdown parser
        sections = []
        current_section = None
        
        for line in content.split("\n"):
            if line.startswith("# "):
                if current_section:
                    sections.append(current_section)
                current_section = {
                    "id": line[2:].lower().replace(" ", "-"),
                    "title": line[2:],
                    "content": "",
                    "expanded": True
                }
            elif current_section:
                current_section["content"] += line + "\n"
        
        if current_section:
            sections.append(current_section)
        
        return PRDDetail(
            id=project_id,
            title="PRD Title",
            sections=[PRDSection(**s) for s in sections] if sections else [
                PRDSection(id="overview", title="Overview", content=content[:500])
            ],
            version="1.0",
            updated_at=project_id
        )
    
    # Return mock data if file doesn't exist
    return PRDDetail(
        id=project_id,
        title="Knowledge Discovery Feature PRD",
        sections=[
            PRDSection(
                id="overview",
                title="Overview",
                content="Product overview and goals...",
                expanded=True
            ),
            PRDSection(
                id="features",
                title="Features",
                content="Key features and functionality...",
                expanded=False
            )
        ],
        version="1.0",
        updated_at=project_id
    )


@router.get("/{project_id}/versions")
async def get_prd_versions(project_id: str):
    """Get PRD version history"""
    return {
        "versions": [
            {"version": "1.0", "date": "2024-12-10", "author": "System"},
            {"version": "0.9", "date": "2024-12-08", "author": "System"}
        ]
    }


@router.get("/{project_id}/compare")
async def compare_prd_versions(project_id: str, v1: str, v2: str):
    """Compare two PRD versions"""
    return {
        "changes": [
            {"section": "Overview", "type": "modified", "diff": "..."}
        ]
    }

