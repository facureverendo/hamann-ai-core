"""
AI API routes
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

router = APIRouter()

# Initialize OpenAI client
client = None
if os.getenv("OPENAI_API_KEY"):
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    project_id: Optional[str] = None
    context: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    suggestions: Optional[list] = None


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with AI assistant"""
    if not client:
        return ChatResponse(
            response="AI service not configured. Please set OPENAI_API_KEY environment variable.",
            suggestions=[]
        )
    
    try:
        # Build context
        system_prompt = "You are an AI assistant for Hamann Projects AI, a project management system. Help users understand their projects, analyze PRDs, and provide insights."
        
        if request.context:
            system_prompt += f"\n\nContext: {request.context}"
        
        # Call OpenAI
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        ai_response = response.choices[0].message.content
        
        # Generate suggestions
        suggestions = [
            "Explain the architecture section",
            "What are the key requirements?",
            "Compare with previous version"
        ]
        
        return ChatResponse(
            response=ai_response,
            suggestions=suggestions
        )
    
    except Exception as e:
        return ChatResponse(
            response=f"Error: {str(e)}",
            suggestions=[]
        )


@router.post("/analyze-prd")
async def analyze_prd(project_id: str):
    """Analyze PRD using AI"""
    return {
        "analysis": "PRD analysis would be performed here",
        "insights": ["Key insight 1", "Key insight 2"]
    }


@router.post("/compare-timelines")
async def compare_timelines(project_id: str):
    """Compare project timelines"""
    return {
        "comparison": "Timeline comparison would be performed here"
    }


@router.post("/generate-tests")
async def generate_tests(project_id: str):
    """Generate test cases"""
    return {
        "tests": ["Test case 1", "Test case 2"]
    }


@router.post("/suggest-improvements")
async def suggest_improvements(project_id: str):
    """Suggest improvements"""
    return {
        "suggestions": ["Improvement 1", "Improvement 2"]
    }

