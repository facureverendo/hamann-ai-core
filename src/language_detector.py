"""
Language Detection Module
Detects the language of input text to ensure consistent output language.
"""

from typing import Optional
from openai import OpenAI
import json


LANGUAGE_DETECTION_PROMPT = """You are a language detection expert for technical and professional documents.

Analyze the following text and determine its primary TECHNICAL/PROFESSIONAL language.

**Rules:**
1. Focus on the language of the MAIN TECHNICAL CONTENT (requirements, features, descriptions)
2. Ignore headers, titles, or metadata that might be in a different language
3. If the document has mixed languages, choose the language used for the substantive professional content
4. Return the language code (ISO 639-1) and full name

**Supported languages:**
- en: English
- es: Spanish (Español)
- pt: Portuguese (Português)
- fr: French (Français)
- de: German (Deutsch)

**Examples:**
- A document with English title but Spanish content → "es"
- A document with Spanish metadata but English requirements → "en"
- A document entirely in English → "en"

**Output format (JSON):**
{
  "language_code": "en",
  "language_name": "English",
  "confidence": 0.95,
  "reasoning": "Main technical content is in English"
}

Analyze the text and return the language of the MAIN PROFESSIONAL CONTENT."""


def detect_language(text: str, client: OpenAI) -> dict:
    """
    Detect the primary language of the input text.
    
    Args:
        text: Input text to analyze
        client: OpenAI client
        
    Returns:
        Dictionary with language_code, language_name, confidence, and reasoning
    """
    # Take a larger sample for better accuracy (first 5000 chars)
    sample = text[:5000] if len(text) > 5000 else text
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": LANGUAGE_DETECTION_PROMPT},
                {"role": "user", "content": f"Text to analyze:\n\n{sample}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=150
        )
        
        content = response.choices[0].message.content
        result = json.loads(content)
        
        return {
            "language_code": result.get("language_code", "en"),
            "language_name": result.get("language_name", "English"),
            "confidence": result.get("confidence", 0.8),
            "reasoning": result.get("reasoning", "")
        }
        
    except Exception as e:
        print(f"⚠️  Warning: Language detection failed: {str(e)}")
        # Default to English
        return {
            "language_code": "en",
            "language_name": "English",
            "confidence": 0.5,
            "reasoning": "Detection failed, using default"
        }


def get_language_instruction(language_code: str) -> str:
    """
    Get instruction text for AI to use specific language.
    
    Args:
        language_code: ISO 639-1 language code
        
    Returns:
        Instruction string for prompts
    """
    instructions = {
        "en": "You MUST respond in English. All content, questions, and explanations must be in English.",
        "es": "DEBES responder en Español. Todo el contenido, preguntas y explicaciones deben estar en Español.",
        "pt": "Você DEVE responder em Português. Todo o conteúdo, perguntas e explicações devem estar em Português.",
        "fr": "Vous DEVEZ répondre en Français. Tout le contenu, les questions et les explications doivent être en Français.",
        "de": "Sie MÜSSEN auf Deutsch antworten. Alle Inhalte, Fragen und Erklärungen müssen auf Deutsch sein."
    }
    
    return instructions.get(language_code, instructions["en"])
