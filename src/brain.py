"""
Brain Module - AI-Powered Backlog Generation
Uses GPT-4o to transform unstructured context into structured Jira backlog.
"""

import json
from typing import Dict, List
from openai import OpenAI


SYSTEM_PROMPT = """Eres un Product Manager Senior experto en metodologías ágiles y redacción técnica. Tu trabajo es analizar la información desordenada que te proveeré (notas, transcripciones, documentos) y transformarla en un Backlog de Desarrollo profesional.

**Reglas:**

1. NO inventes funcionalidades que no se mencionan o infieren lógicamente del contexto.
2. Estructura la salida EXCLUSIVAMENTE en formato JSON.
3. Cada objeto debe tener exactamente estos campos: 'issue_type', 'summary', 'description', 'priority', 'story_points'.
4. En la 'description', usa Markdown. Incluye siempre:
   - Una historia de usuario en formato: "Como [rol], quiero [acción], para [beneficio]"
   - Una sección "### Criterios de Aceptación" con una lista de criterios verificables
5. Desglosa los requerimientos grandes en 'User Stories' pequeñas e independientes siguiendo principios INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable).
6. Usa estos valores para 'issue_type': Epic, Story, Task, Bug
7. Usa estos valores para 'priority': High, Medium, Low
8. Usa estos valores para 'story_points': 1, 2, 3, 5, 8, 13 (secuencia Fibonacci)
9. Crea al menos un Epic que agrupe las funcionalidades principales
10. Genera entre 8-15 tickets dependiendo de la complejidad del proyecto

**Formato de salida esperado (IMPORTANTE: debe ser un objeto JSON con una clave "backlog" que contenga el array):**
```json
{
  "backlog": [
    {
      "issue_type": "Epic",
      "summary": "Título del Epic",
      "description": "Descripción general del Epic en Markdown",
      "priority": "High",
      "story_points": 13
    },
    {
      "issue_type": "Story",
      "summary": "Título conciso de la User Story",
      "description": "Como [rol], quiero [acción], para [beneficio].\\n\\n### Criterios de Aceptación\\n- [ ] Criterio 1\\n- [ ] Criterio 2\\n- [ ] Criterio 3",
      "priority": "High",
      "story_points": 5
    }
  ]
}
```

Analiza el contexto proporcionado y genera un backlog estructurado y profesional."""


def generate_backlog(context: str, client: OpenAI) -> List[Dict]:
    """
    Generate structured backlog from unstructured context using GPT-4o.
    
    Args:
        context: Unified context from all input files
        client: OpenAI client instance
        
    Returns:
        List of backlog items as dictionaries
    """
    try:
        print("🧠 Enviando contexto a GPT-4o para análisis...")
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Analiza el siguiente contexto y genera un backlog estructurado:\n\n{context}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=4000
        )
        
        # Extract JSON from response
        content = response.choices[0].message.content
        
        # Parse JSON - the model should return an object with 'backlog' key
        parsed = json.loads(content)
        
        # Handle both direct array and wrapped array formats
        if isinstance(parsed, list):
            # Direct array (shouldn't happen with json_object mode, but handle it)
            backlog_items = parsed
        elif isinstance(parsed, dict):
            # Look for the 'backlog' key first (as requested in prompt)
            if 'backlog' in parsed:
                backlog_items = parsed['backlog']
            elif 'items' in parsed:
                backlog_items = parsed['items']
            elif 'tickets' in parsed:
                backlog_items = parsed['tickets']
            else:
                # Take the first list value found
                for key, value in parsed.items():
                    if isinstance(value, list):
                        print(f"⚠️  Warning: Found list under unexpected key '{key}', using it anyway")
                        backlog_items = value
                        break
                else:
                    # Debug: show what we actually got
                    print(f"❌ Debug - Received JSON keys: {list(parsed.keys())}")
                    print(f"❌ Debug - First 500 chars of response: {content[:500]}")
                    raise ValueError("No list found in JSON response")
        else:
            raise ValueError("Unexpected JSON format from GPT-4o")
        
        # Validate the structure
        if not validate_response(backlog_items):
            raise ValueError("Generated backlog failed validation")
        
        print(f"✅ Generados {len(backlog_items)} tickets")
        
        return backlog_items
        
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON from GPT-4o response: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Error generating backlog: {str(e)}")


def validate_response(backlog_items: List[Dict]) -> bool:
    """
    Validate that the backlog items have the required structure.
    
    Args:
        backlog_items: List of backlog item dictionaries
        
    Returns:
        True if valid, False otherwise
    """
    required_fields = {'issue_type', 'summary', 'description', 'priority', 'story_points'}
    valid_issue_types = {'Epic', 'Story', 'Task', 'Bug'}
    valid_priorities = {'High', 'Medium', 'Low'}
    valid_story_points = {1, 2, 3, 5, 8, 13}
    
    if not isinstance(backlog_items, list) or len(backlog_items) == 0:
        print("❌ Validation failed: Not a non-empty list")
        return False
    
    for idx, item in enumerate(backlog_items):
        # Check all required fields are present
        if not all(field in item for field in required_fields):
            missing = required_fields - set(item.keys())
            print(f"❌ Validation failed at item {idx}: Missing fields {missing}")
            return False
        
        # Validate issue_type
        if item['issue_type'] not in valid_issue_types:
            print(f"❌ Validation failed at item {idx}: Invalid issue_type '{item['issue_type']}'")
            return False
        
        # Validate priority
        if item['priority'] not in valid_priorities:
            print(f"❌ Validation failed at item {idx}: Invalid priority '{item['priority']}'")
            return False
        
        # Validate story_points
        if item['story_points'] not in valid_story_points:
            print(f"❌ Validation failed at item {idx}: Invalid story_points {item['story_points']}")
            return False
        
        # Check that summary and description are non-empty strings
        if not isinstance(item['summary'], str) or not item['summary'].strip():
            print(f"❌ Validation failed at item {idx}: Empty or invalid summary")
            return False
        
        if not isinstance(item['description'], str) or not item['description'].strip():
            print(f"❌ Validation failed at item {idx}: Empty or invalid description")
            return False
    
    return True
