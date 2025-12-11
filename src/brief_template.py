"""Templates para prompts de brief iterativo"""
from typing import Dict, List


def get_initial_brief_prompt(suggestion: Dict, workspace_context: Dict, language_code: str = "es") -> str:
    name = suggestion.get("name", "")
    description = suggestion.get("description", "")
    rationale = suggestion.get("rationale", "")

    workspace_name = workspace_context.get("name", "")
    workspace_description = workspace_context.get("description", "")
    analysis = workspace_context.get("analysis", {})

    return f"""
Idioma objetivo: {language_code}

Genera un brief inicial en markdown, libre pero claro, basado en la siguiente información.
No inventes funcionalidades no mencionadas. Si faltan datos, marca TODOs claros.

Feature sugerida:
- Nombre: {name}
- Descripción: {description}
- Rationale: {rationale}

Contexto del workspace:
- Nombre del proyecto: {workspace_name}
- Descripción del proyecto: {workspace_description}
- Resumen ejecutivo: {analysis.get('executive_summary', '')}
- Módulos identificados: {analysis.get('identified_features', [])}
- Módulos sugeridos: {analysis.get('suggested_modules', [])}
- Riesgos técnicos: {analysis.get('technical_risks', [])}

Estructura sugerida (puedes omitir si no aplica):
- Resumen
- Objetivos
- Alcance / Límites
- Users / Roles
- Requerimientos funcionales
- Requerimientos no funcionales
- Riesgos / Suposiciones
- Métricas de éxito
- Hitos tentativos

Entrega solo markdown.
"""


def get_refinement_prompt(brief_content: str, user_question: str, conversation_history: List[Dict]) -> str:
    history_text = "\n".join([
        f"User: {item.get('user')}\nAssistant: {item.get('assistant')}" for item in conversation_history
    ]) if conversation_history else ""

    return f"""
Tenemos este brief actual (markdown):
{brief_content}

Historial (opcional):
{history_text}

Pregunta del usuario:
{user_question}

Refina el brief incorporando la respuesta. Devuelve solo el brief en markdown.
"""


def get_question_generation_prompt(brief_content: str) -> str:
    return f"""
Genera preguntas concretas y accionables para mejorar este brief:

{brief_content}

Reglas:
- Máximo 8 preguntas
- Sé específico
- Incluye contexto de por qué se pregunta
- Usa section_hint para sugerir dónde encaja la respuesta

Formato JSON:
{{
  "questions": [
    {{"question": "...", "context": "...", "section_hint": "..."}}
  ]
}}
"""


def get_readiness_check_prompt(brief_content: str) -> str:
    return f"""
Evalúa si el brief siguiente está listo para convertirse en PRD. Considera si cubre objetivos, alcance, usuarios, requerimientos, riesgos y métricas. Responde con yes/no y breve justificación.

{brief_content}
"""
