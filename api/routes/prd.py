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


class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: str


class Chat(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    messages: List[ChatMessage]
    message_count: int


class CreateChatRequest(BaseModel):
    title: Optional[str] = None


@router.post("/{project_id}/chats")
async def create_chat(project_id: str, request: CreateChatRequest):
    """Create a new chat conversation"""
    import json
    import uuid
    
    # Create chats directory if it doesn't exist
    chats_dir = PROJECTS_DIR / project_id / "chats"
    chats_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate chat ID
    chat_id = str(uuid.uuid4())
    timestamp = datetime.now().isoformat()
    
    # Get language for welcome message
    state_file = PROJECTS_DIR / project_id / "state.json"
    language_code = "es"
    if state_file.exists():
        with open(state_file, 'r', encoding='utf-8') as f:
            state_data = json.load(f)
            language_code = state_data.get('language_code', 'es')
    
    welcome_messages = {
        "es": "¿Cómo puedo ayudarte a entender este PRD?",
        "en": "How can I help you understand this PRD?",
        "pt": "Como posso ajudá-lo a entender este PRD?"
    }
    
    # Create chat data
    chat_data = {
        "id": chat_id,
        "title": request.title or f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "created_at": timestamp,
        "updated_at": timestamp,
        "messages": [
            {
                "role": "assistant",
                "content": welcome_messages.get(language_code, welcome_messages["es"]),
                "timestamp": timestamp
            }
        ],
        "message_count": 1
    }
    
    # Save chat file
    chat_file = chats_dir / f"{chat_id}.json"
    with open(chat_file, 'w', encoding='utf-8') as f:
        json.dump(chat_data, f, indent=2, ensure_ascii=False)
    
    return chat_data


@router.get("/{project_id}/chats")
async def list_chats(project_id: str):
    """List all chat conversations for a project"""
    import json
    
    chats_dir = PROJECTS_DIR / project_id / "chats"
    
    if not chats_dir.exists():
        return {"chats": []}
    
    chats = []
    for chat_file in chats_dir.glob("*.json"):
        try:
            with open(chat_file, 'r', encoding='utf-8') as f:
                chat_data = json.load(f)
                # Return summary without full message history
                chats.append({
                    "id": chat_data["id"],
                    "title": chat_data["title"],
                    "created_at": chat_data["created_at"],
                    "updated_at": chat_data["updated_at"],
                    "message_count": chat_data["message_count"]
                })
        except Exception as e:
            print(f"Error reading chat file {chat_file}: {e}")
            continue
    
    # Sort by updated_at descending (most recent first)
    chats.sort(key=lambda x: x["updated_at"], reverse=True)
    
    return {"chats": chats}


@router.get("/{project_id}/chats/{chat_id}")
async def get_chat(project_id: str, chat_id: str):
    """Get a specific chat with full message history"""
    import json
    
    chat_file = PROJECTS_DIR / project_id / "chats" / f"{chat_id}.json"
    
    if not chat_file.exists():
        raise HTTPException(status_code=404, detail="Chat not found")
    
    with open(chat_file, 'r', encoding='utf-8') as f:
        chat_data = json.load(f)
    
    return chat_data


@router.post("/{project_id}/chats/{chat_id}/message")
async def send_message(project_id: str, chat_id: str, request: ChatRequest):
    """Send a message in a chat and get AI response"""
    import json
    from openai import OpenAI
    from dotenv import load_dotenv
    
    load_dotenv()
    
    # Load chat
    chat_file = PROJECTS_DIR / project_id / "chats" / f"{chat_id}.json"
    
    if not chat_file.exists():
        raise HTTPException(status_code=404, detail="Chat not found")
    
    with open(chat_file, 'r', encoding='utf-8') as f:
        chat_data = json.load(f)
    
    # Load PRD content
    prd_file = PROJECTS_DIR / project_id / "outputs" / "prd.md"
    
    if not prd_file.exists():
        raise HTTPException(
            status_code=404,
            detail="PRD not found. Please build the PRD first."
        )
    
    prd_content = prd_file.read_text(encoding="utf-8")
    
    # Detect language
    state_file = PROJECTS_DIR / project_id / "state.json"
    language_code = "es"
    
    if state_file.exists():
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
    
    # Build conversation history for context
    conversation_messages = [
        {
            "role": "system",
            "content": f"{prompts['system']}\n\n{prompts['context_intro']}\n\n{prd_content}"
        }
    ]
    
    # Add previous messages from chat (excluding the initial welcome message)
    for msg in chat_data["messages"]:
        if msg["role"] in ["user", "assistant"]:
            conversation_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
    
    # Add new user message
    user_timestamp = datetime.now().isoformat()
    conversation_messages.append({
        "role": "user",
        "content": request.message
    })
    
    # Create OpenAI client
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    try:
        # Call OpenAI with full conversation context
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=conversation_messages,
            temperature=0.7,
            max_tokens=1000
        )
        
        answer = response.choices[0].message.content
        assistant_timestamp = datetime.now().isoformat()
        
        # Add user message to chat
        chat_data["messages"].append({
            "role": "user",
            "content": request.message,
            "timestamp": user_timestamp
        })
        
        # Add assistant response to chat
        chat_data["messages"].append({
            "role": "assistant",
            "content": answer,
            "timestamp": assistant_timestamp
        })
        
        # Update metadata
        chat_data["updated_at"] = assistant_timestamp
        chat_data["message_count"] = len(chat_data["messages"])
        
        # Save updated chat
        with open(chat_file, 'w', encoding='utf-8') as f:
            json.dump(chat_data, f, indent=2, ensure_ascii=False)
        
        return {
            "user_message": {
                "role": "user",
                "content": request.message,
                "timestamp": user_timestamp
            },
            "assistant_message": {
                "role": "assistant",
                "content": answer,
                "timestamp": assistant_timestamp
            },
            "language": language_code
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error communicating with AI: {str(e)}")


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

