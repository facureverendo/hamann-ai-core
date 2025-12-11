"""
PRD API routes
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
from typing import List, Optional
from datetime import datetime
import os

router = APIRouter()

PROJECTS_DIR = Path(__file__).parent.parent.parent / "projects"


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
    # Correct path: projects/{project_id}/outputs/prd.md
    prd_file = PROJECTS_DIR / project_id / "outputs" / "prd.md"
    
    if not prd_file.exists():
        raise HTTPException(
            status_code=404, 
            detail=f"PRD not found for project {project_id}. Please build the PRD first."
        )
    
    # Read and parse PRD file
    content = prd_file.read_text(encoding="utf-8")
    
    # Extract title from first line (# Title) or from content
    title = "PRD Document"
    lines = content.split("\n")
    if lines and lines[0].startswith("# "):
        title = lines[0][2:].strip()
    
    # Parse markdown sections (## Section Title)
    sections = []
    current_section = None
    current_content = []
    
    for line in lines[1:]:  # Skip first line (title)
        if line.startswith("## "):
            # Save previous section
            if current_section:
                sections.append({
                    "id": current_section.lower().replace(" ", "-").replace("&", "and"),
                    "title": current_section,
                    "content": "\n".join(current_content).strip(),
                    "expanded": True
                })
            # Start new section
            current_section = line[3:].strip()
            current_content = []
        elif current_section:
            current_content.append(line)
    
    # Add last section
    if current_section:
        sections.append({
            "id": current_section.lower().replace(" ", "-").replace("&", "and"),
            "title": current_section,
            "content": "\n".join(current_content).strip(),
            "expanded": True
        })
    
    # Get file modification time
    mtime = os.path.getmtime(prd_file)
    updated_at = datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S")
    
    return PRDDetail(
        id=project_id,
        title=title,
        sections=[PRDSection(**s) for s in sections],
        version="1.0",
        updated_at=updated_at
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


class ChatRequest(BaseModel):
    message: str


@router.post("/{project_id}/chat")
async def chat_about_prd(project_id: str, request: ChatRequest):
    """Chat with AI about the PRD"""
    from openai import OpenAI
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    # Load PRD content
    prd_file = PROJECTS_DIR / project_id / "outputs" / "prd.md"
    
    if not prd_file.exists():
        raise HTTPException(
            status_code=404,
            detail="PRD not found. Please build the PRD first."
        )
    
    prd_content = prd_file.read_text(encoding="utf-8")
    
    # Detect language from project state
    state_file = PROJECTS_DIR / project_id / "state.json"
    language_code = "es"  # Default Spanish
    
    if state_file.exists():
        import json
        with open(state_file, 'r', encoding='utf-8') as f:
            state_data = json.load(f)
            language_code = state_data.get('language_code', 'es')
    
    # Language-specific prompts
    language_prompts = {
        "es": {
            "system": "Eres un asistente de IA experto en análisis de PRDs (Product Requirements Documents). Tu trabajo es ayudar a los usuarios a entender el PRD de su proyecto respondiendo preguntas de manera clara y concisa. Responde SIEMPRE en español.",
            "context_intro": "Aquí está el contenido completo del PRD:"
        },
        "en": {
            "system": "You are an AI assistant expert in analyzing PRDs (Product Requirements Documents). Your job is to help users understand their project's PRD by answering questions clearly and concisely. Always respond in English.",
            "context_intro": "Here is the complete PRD content:"
        },
        "pt": {
            "system": "Você é um assistente de IA especializado em análise de PRDs (Product Requirements Documents). Seu trabalho é ajudar os usuários a entender o PRD de seu projeto respondendo perguntas de forma clara e concisa. Responda SEMPRE em português.",
            "context_intro": "Aqui está o conteúdo completo do PRD:"
        }
    }
    
    prompts = language_prompts.get(language_code, language_prompts["es"])
    
    # Create OpenAI client
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    try:
        # Call OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Using mini for faster/cheaper responses
            messages=[
                {
                    "role": "system",
                    "content": f"{prompts['system']}\n\n{prompts['context_intro']}\n\n{prd_content}"
                },
                {
                    "role": "user",
                    "content": request.message
                }
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        answer = response.choices[0].message.content
        
        return {
            "answer": answer,
            "language": language_code
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error communicating with AI: {str(e)}")

