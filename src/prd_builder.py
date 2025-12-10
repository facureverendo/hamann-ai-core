"""
PRD Builder Module - AI-Powered PRD Generation with Anti-Hallucination Controls
Analyzes input, detects gaps, generates questions, and builds complete PRDs.
"""

import json
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from openai import OpenAI

from prd_template import PRDTemplate, PRD, PRDSection, SectionPriority


@dataclass
class Gap:
    """Represents a missing piece of information in the input."""
    section_key: str
    section_title: str
    priority: SectionPriority
    question: str
    context: str  # Context from original input
    options: Optional[List[str]] = None  # For multiple choice questions


@dataclass
class AnalysisResult:
    """Result of analyzing the input context."""
    product_name: str
    extracted_info: Dict[str, str]  # section_key -> extracted content
    confidence_scores: Dict[str, float]  # section_key -> confidence (0-1)
    explicit_features: List[str]  # Features explicitly mentioned
    inferred_features: List[str]  # Features logically inferred
    gaps: List[Gap]  # Missing information


ANALYSIS_PROMPT = """Eres un Product Manager experto analizando información de producto.

{language_instruction}

Tu trabajo es EXTRAER información del contexto proporcionado, NO inventar nada.

**Reglas estrictas:**
1. Solo extrae información EXPLÍCITAMENTE mencionada en el contexto
2. Si algo no está claro, márcalo como "gap" (información faltante)
3. Separa features explícitas de features inferidas lógicamente
4. Asigna scores de confianza (0-1) a cada sección extraída
5. NO inventes features, usuarios, o requisitos que no estén mencionados

**Secciones a analizar:**
{sections_info}

**Formato de salida (JSON):**
{{
  "product_name": "Nombre del producto/feature (si se menciona)",
  "extracted_info": {{
    "section_key": "Contenido extraído del contexto original",
    ...
  }},
  "confidence_scores": {{
    "section_key": 0.8,  // 0-1, qué tan seguro estás de la extracción
    ...
  }},
  "explicit_features": [
    "Feature mencionada explícitamente en el contexto"
  ],
  "inferred_features": [
    "Feature que se puede inferir lógicamente del contexto"
  ],
  "missing_sections": [
    "section_key que no tiene información en el contexto"
  ]
}}

Analiza el contexto y extrae SOLO lo que está presente."""


QUESTION_GENERATION_PROMPT = """Eres un Product Manager experto generando preguntas para completar un PRD.

Tienes información parcial sobre un producto. Tu trabajo es generar preguntas específicas y útiles para llenar los gaps.

**Reglas:**
1. Haz preguntas específicas, no genéricas
2. Proporciona contexto de lo que YA sabes
3. Ofrece opciones múltiples cuando sea apropiado
4. Prioriza preguntas críticas primero
5. Máximo {max_questions} preguntas

**Información que ya tienes:**
{known_info}

**Secciones faltantes (prioridad crítica):**
{critical_gaps}

**Secciones faltantes (prioridad importante):**
{important_gaps}

**Formato de salida (JSON):**
{{
  "questions": [
    {{
      "section_key": "clave de la sección",
      "question": "Pregunta específica y clara",
      "context": "Por qué necesito esta información",
      "options": ["Opción 1", "Opción 2", "Otro"]  // opcional, para multiple choice
    }}
  ]
}}

Genera preguntas inteligentes y específicas."""


def analyze_input(context: str, client: OpenAI, language_code: str = "es") -> AnalysisResult:
    """
    Analyze input context and extract information without hallucinating.
    
    Args:
        context: Raw input from user
        client: OpenAI client
        language_code: Language code for output (en, es, pt, fr, de)
        
    Returns:
        AnalysisResult with extracted info and identified gaps
    """
    # Prepare sections info for the prompt
    sections_info = ""
    for section in PRDTemplate.SECTIONS:
        sections_info += f"- **{section.key}** ({section.priority.value}): {section.description}\n"
    
    # Get language instruction
    from language_detector import get_language_instruction
    language_instruction = get_language_instruction(language_code)
    
    prompt = ANALYSIS_PROMPT.format(
        sections_info=sections_info,
        language_instruction=language_instruction
    )
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Analiza este contexto:\n\n{context}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.2,  # Low temperature for factual extraction
            max_tokens=3000
        )
        
        content = response.choices[0].message.content
        parsed = json.loads(content)
        
        # Extract data
        product_name = parsed.get("product_name", "Producto Sin Nombre")
        extracted_info = parsed.get("extracted_info", {})
        confidence_scores = parsed.get("confidence_scores", {})
        explicit_features = parsed.get("explicit_features", [])
        inferred_features = parsed.get("inferred_features", [])
        missing_sections = parsed.get("missing_sections", [])
        
        # Create gaps for missing sections
        gaps = []
        for section_key in missing_sections:
            section = PRDTemplate.get_section(section_key)
            if section:
                # Create a gap for each missing section
                # We'll generate specific questions later
                gaps.append(Gap(
                    section_key=section.key,
                    section_title=section.title,
                    priority=section.priority,
                    question="",  # Will be filled by generate_questions
                    context=""
                ))
        
        return AnalysisResult(
            product_name=product_name,
            extracted_info=extracted_info,
            confidence_scores=confidence_scores,
            explicit_features=explicit_features,
            inferred_features=inferred_features,
            gaps=gaps
        )
        
    except Exception as e:
        raise RuntimeError(f"Error analyzing input: {str(e)}")


def generate_questions(analysis: AnalysisResult, client: OpenAI, max_questions: int = 15, language_code: str = "es") -> List[Gap]:
    """
    Generate targeted questions to fill gaps in the PRD.
    
    Args:
        analysis: Result from analyze_input
        client: OpenAI client
        max_questions: Maximum number of questions to generate
        language_code: Language code for questions (en, es, pt, fr, de)
        
    Returns:
        List of Gaps with specific questions
    """
    # Prepare known info summary
    known_info = f"**Producto:** {analysis.product_name}\n\n"
    if analysis.explicit_features:
        known_info += "**Features explícitas:**\n"
        for feature in analysis.explicit_features:
            known_info += f"- {feature}\n"
        known_info += "\n"
    
    if analysis.extracted_info:
        known_info += "**Información extraída:**\n"
        for key, value in analysis.extracted_info.items():
            section = PRDTemplate.get_section(key)
            if section:
                known_info += f"- **{section.title}**: {value[:200]}...\n"
        known_info += "\n"
    
    # Separate gaps by priority
    critical_gaps = [g for g in analysis.gaps if g.priority == SectionPriority.CRITICAL]
    important_gaps = [g for g in analysis.gaps if g.priority == SectionPriority.IMPORTANT]
    
    critical_gaps_str = "\n".join([f"- {g.section_title}" for g in critical_gaps])
    important_gaps_str = "\n".join([f"- {g.section_title}" for g in important_gaps])
    
    # Get language instruction
    from language_detector import get_language_instruction
    language_instruction = get_language_instruction(language_code)
    
    # Add language instruction to prompt
    prompt_with_lang = f"{language_instruction}\n\n{QUESTION_GENERATION_PROMPT}"
    
    prompt = prompt_with_lang.format(
        max_questions=max_questions,
        known_info=known_info,
        critical_gaps=critical_gaps_str if critical_gaps_str else "Ninguna",
        important_gaps=important_gaps_str if important_gaps_str else "Ninguna"
    )
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": "Genera preguntas específicas para completar el PRD."}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=2000
        )
        
        content = response.choices[0].message.content
        parsed = json.loads(content)
        
        questions_data = parsed.get("questions", [])
        
        # Create Gap objects with questions
        gaps_with_questions = []
        for q_data in questions_data[:max_questions]:
            section_key = q_data.get("section_key")
            section = PRDTemplate.get_section(section_key)
            
            if section:
                gap = Gap(
                    section_key=section.key,
                    section_title=section.title,
                    priority=section.priority,
                    question=q_data.get("question", ""),
                    context=q_data.get("context", ""),
                    options=q_data.get("options")
                )
                gaps_with_questions.append(gap)
        
        return gaps_with_questions
        
    except Exception as e:
        raise RuntimeError(f"Error generating questions: {str(e)}")


def build_prd(
    analysis: AnalysisResult,
    user_answers: Dict[str, str],
    client: OpenAI,
    language_code: str = "es"
) -> PRD:
    """
    Build complete PRD from analysis and user answers.
    
    Args:
        analysis: Initial analysis result
        user_answers: User's answers to questions (section_key -> answer)
        client: OpenAI client
        language_code: Language code for PRD (en, es, pt, fr, de)
        
    Returns:
        Complete PRD object
    """
    # Combine extracted info with user answers
    all_content = {**analysis.extracted_info, **user_answers}
    
    # Build PRD sections using AI to format nicely
    prd_sections = {}
    
    for section in PRDTemplate.SECTIONS:
        content = all_content.get(section.key, "")
        
        if content and content.strip():
            # Use AI to format the content professionally
            formatted_content = _format_section_content(
                section=section,
                raw_content=content,
                product_name=analysis.product_name,
                client=client,
                language_code=language_code
            )
            prd_sections[section.key] = formatted_content
    
    # Create metadata
    from datetime import datetime
    metadata = {
        "Generated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "Explicit Features": ", ".join(analysis.explicit_features[:5]),
        "Confidence": f"{sum(analysis.confidence_scores.values()) / len(analysis.confidence_scores):.0%}" if analysis.confidence_scores else "N/A"
    }
    
    return PRD(
        product_name=analysis.product_name,
        sections=prd_sections,
        metadata=metadata
    )


def _format_section_content(
    section: PRDSection,
    raw_content: str,
    product_name: str,
    client: OpenAI,
    language_code: str = "es"
) -> str:
    """
    Format section content professionally using AI.
    
    Args:
        section: PRD section
        raw_content: Raw content from extraction or user answer
        product_name: Name of the product
        client: OpenAI client
        language_code: Language code for formatting (en, es, pt, fr, de)
        
    Returns:
        Professionally formatted content
    """
    # Get language instruction
    from language_detector import get_language_instruction
    language_instruction = get_language_instruction(language_code)
    
    prompt = f"""{language_instruction}

Eres un Product Manager experto formateando una sección de PRD.

**Producto:** {product_name}
**Sección:** {section.title}
**Descripción:** {section.description}

**Contenido sin formato:**
{raw_content}

**Tu trabajo:**
1. Formatea el contenido de manera profesional en Markdown
2. Mantén TODA la información del contenido original
3. NO agregues información que no esté en el contenido original
4. Estructura el contenido de forma clara y legible
5. Usa listas, subtítulos, y formato apropiado

Devuelve SOLO el contenido formateado, sin explicaciones."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Eres un experto en redacción de PRDs profesionales."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1000
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        # Fallback: return raw content if formatting fails
        print(f"⚠️  Warning: Failed to format section {section.key}: {str(e)}")
        return raw_content
