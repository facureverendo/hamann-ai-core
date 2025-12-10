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


ANALYSIS_PROMPT = """You are a STRICT information extraction system. Your ONLY job is to COPY information from the source document.

{language_instruction}

🚨 CRITICAL ANTI-HALLUCINATION RULES 🚨

**ABSOLUTE PROHIBITIONS:**
1. ❌ DO NOT invent ANY features, screens, buttons, or functionality
2. ❌ DO NOT invent API endpoints, feature flags, or technical details
3. ❌ DO NOT invent user personas, roles, or responsibilities
4. ❌ DO NOT invent user flows, states, or interactions
5. ❌ DO NOT add examples, assumptions, or "logical" extensions
6. ❌ DO NOT create generic content to "fill gaps"
7. ❌ DO NOT modify, simplify, or reinterpret what you read

**WHAT YOU MUST DO:**
1. ✅ COPY EXACTLY what is written in the source document
2. ✅ Use LITERAL text from the document (copy-paste mode)
3. ✅ If a detail is mentioned, extract it VERBATIM
4. ✅ If information is missing, mark it as "missing_sections"
5. ✅ Preserve ALL specific details: names, numbers, exact wording
6. ✅ Keep technical terms, feature names, and specifications EXACTLY as written

**EXTRACTION MODE:**
- **Literal copying**: If document says "Mónica is a non-technical admin", write EXACTLY that
- **Preserve specifics**: If document mentions "Feature #41187", keep that exact number
- **No interpretation**: If document says "cluster requests", don't explain HOW - just note it exists
- **No expansion**: If document lists 3 personas, extract ONLY those 3 - don't add a 4th

**EXAMPLES OF VIOLATIONS (DO NOT DO THIS):**

❌ BAD - Inventing:
- Document mentions "knowledge snippets" → You add "manual snippet generator button"
- Document has "Mónica: Admin" → You add "Mónica analyzes financial reports"
- Document mentions "integration" → You invent "API /api/integration endpoint"

✅ GOOD - Extracting:
- Document: "Mónica is a non-technical administrator" → Extract: "Mónica is a non-technical administrator"
- Document: "Feature integrates with Solution Recommendation" → Extract: "Integrates with Solution Recommendation"
- Document: "Generates knowledge snippets from requests" → Extract: "Generates knowledge snippets from requests"

**CONFIDENCE SCORING:**
- 1.0 = Information is explicitly stated with details
- 0.8 = Information is clearly mentioned but brief
- 0.5 = Information is implied or partial
- 0.0 = Information is NOT in the document (mark as missing)

**Secciones a analizar:**
{sections_info}

**Formato de salida (JSON):**
{{
  "product_name": "EXACT name from document (or 'Unknown' if not stated)",
  "extracted_info": {{
    "section_key": "LITERAL text copied from document - NO interpretation, NO expansion, NO invention",
    ...
  }},
  "confidence_scores": {{
    "section_key": 0.0-1.0,  // How explicitly is this stated in the document?
    ...
  }},
  "explicit_features": [
    "EXACT feature names/descriptions from document - COPY-PASTE only"
  ],
  "inferred_features": [
    "Features that are CLEARLY implied by explicit statements (use VERY sparingly)"
  ],
  "missing_sections": [
    {{
      "section_key": "section_key",
      "reason": "Brief explanation of why this section is missing or what related information exists"
    }}
  ]
}}

**FINAL CHECK BEFORE RESPONDING:**
- Did I invent ANY feature not in the document? → If YES, REMOVE IT
- Did I add ANY persona details not stated? → If YES, REMOVE IT
- Did I create ANY technical specs not mentioned? → If YES, REMOVE IT
- Did I expand ANY brief mentions into full descriptions? → If YES, REVERT TO BRIEF
- Is EVERY piece of information traceable to the source? → If NO, REMOVE IT

Extract information in LITERAL COPY MODE. When in doubt, mark as missing."""


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
                {"role": "user", "content": f"Extract information in LITERAL COPY MODE from this context:\n\n{context}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.05,  # ULTRA-low temperature for pure extraction
            max_tokens=4000  # Increased for detailed documents
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
        
        # Create gaps for missing sections with contextual information
        gaps = []
        
        # Handle both old format (list of strings) and new format (list of objects)
        missing_sections_list = missing_sections if isinstance(missing_sections, list) else []
        
        for missing_item in missing_sections_list:
            # Support both formats: string (section_key) or dict (section_key + reason)
            if isinstance(missing_item, dict):
                section_key = missing_item.get("section_key")
                ai_reason = missing_item.get("reason", "")
            else:
                section_key = missing_item
                ai_reason = ""
            
            section = PRDTemplate.get_section(section_key)
            if section:
                # Build context explaining what information exists and why this section is needed
                context_parts = []
                
                # Add AI-generated reason if available
                if ai_reason:
                    context_parts.append(f"Razón: {ai_reason}")
                
                # Add product name context
                if product_name and product_name != "Producto Sin Nombre":
                    if not ai_reason:
                        context_parts.append(f"Producto: {product_name}")
                
                # Add related extracted information that might be relevant
                related_sections = []
                if section_key == "ux_flows" and "functional_requirements" in extracted_info:
                    related_sections.append("functional_requirements")
                elif section_key == "acceptance_criteria" and "functional_requirements" in extracted_info:
                    related_sections.append("functional_requirements")
                elif section_key == "risks_challenges" and "solution_overview" in extracted_info:
                    related_sections.append("solution_overview")
                elif section_key == "kpis_metrics" and "solution_overview" in extracted_info:
                    related_sections.append("solution_overview")
                elif section_key == "technical_requirements" and "functional_requirements" in extracted_info:
                    related_sections.append("functional_requirements")
                
                if related_sections:
                    context_parts.append("\nInformación relacionada disponible:")
                    for rel_key in related_sections:
                        rel_section = PRDTemplate.get_section(rel_key)
                        if rel_section and rel_key in extracted_info:
                            content_preview = extracted_info[rel_key][:150] + "..." if len(extracted_info[rel_key]) > 150 else extracted_info[rel_key]
                            context_parts.append(f"- {rel_section.title}: {content_preview}")
                
                # Add explicit features context if available
                if explicit_features:
                    context_parts.append(f"\nFeatures identificadas: {', '.join(explicit_features[:3])}")
                    if len(explicit_features) > 3:
                        context_parts.append(f"(y {len(explicit_features) - 3} más)")
                
                # Build context string
                gap_context = "\n".join(context_parts) if context_parts else f"Esta sección no fue encontrada en el documento analizado. Es necesaria para completar el PRD del producto '{product_name}'."
                
                # Create a gap with contextual information
                gaps.append(Gap(
                    section_key=section.key,
                    section_title=section.title,
                    priority=section.priority,
                    question="",  # Will be filled by generate_questions
                    context=gap_context
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
    # If no gaps, return empty list
    if not analysis.gaps:
        print("   • No hay gaps detectados")
        return []
    
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
    
    # If no critical or important gaps, return empty (optional sections don't need questions)
    if not critical_gaps and not important_gaps:
        print("   • Solo gaps opcionales detectados, no se generan preguntas")
        return []
    
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
        
        # Skip sections that are explicitly marked as missing or empty
        if not content or content.strip() == "" or content.strip().lower() == "missing_sections":
            continue
        
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
    Format section content with STRICT preservation of source material.
    
    Args:
        section: PRD section
        raw_content: Raw content from extraction or user answer
        product_name: Name of the product
        client: OpenAI client
        language_code: Language code for formatting (en, es, pt, fr, de)
        
    Returns:
        Professionally formatted content (structure only, NO new content)
    """
    # Get language instruction
    from language_detector import get_language_instruction
    language_instruction = get_language_instruction(language_code)
    
    # ULTRA-STRICT formatting prompt
    prompt = f"""{language_instruction}

🚨 CRITICAL: You are a FORMATTING ASSISTANT, NOT a content creator 🚨

Your ONLY job is to add Markdown structure to existing content. You MUST NOT add ANY new information.

**Product:** {product_name}
**Section:** {section.title}
**Section Purpose:** {section.description}

**Raw Content (to be formatted ONLY):**
{raw_content}

═══════════════════════════════════════════════════════════
🛑 ABSOLUTE PROHIBITIONS - DO NOT VIOLATE THESE 🛑
═══════════════════════════════════════════════════════════

❌ DO NOT add features, screens, buttons, or functionality not in raw content
❌ DO NOT add persona details, responsibilities, or characteristics not stated
❌ DO NOT add API endpoints, technical specs, or implementation details not mentioned
❌ DO NOT add user flows, states, or interactions not described
❌ DO NOT add examples, use cases, or scenarios not provided
❌ DO NOT add metrics, KPIs, or measurements not specified
❌ DO NOT expand brief mentions into detailed descriptions
❌ DO NOT interpret, assume, or infer anything beyond what's written
❌ DO NOT add "professional" filler content
❌ DO NOT create subsections for content that doesn't exist

═══════════════════════════════════════════════════════════
✅ WHAT YOU MUST DO
═══════════════════════════════════════════════════════════

1. **PRESERVE EXACTLY**: Every word, name, number, and detail from raw content
2. **ADD ONLY STRUCTURE**: Headers (###, ####), lists (-, 1.), tables, bold/italic
3. **KEEP VERBATIM**: Technical terms, feature names, persona names, specifications
4. **NO EXPANSION**: If raw content is brief, keep it brief
5. **NO INVENTION**: If a detail isn't mentioned, don't add it

═══════════════════════════════════════════════════════════
📋 FORMATTING GUIDELINES (Structure Only)
═══════════════════════════════════════════════════════════

**Allowed Formatting:**
- Add headers (###, ####) to organize content
- Convert to bullet lists (-) or numbered lists (1.)
- Add tables for structured data
- Add **bold** for emphasis on existing key terms
- Add code blocks (\`\`\`) for technical specs that exist in raw content
- Add line breaks for readability

**Forbidden Actions:**
- Adding new sentences or paragraphs
- Expanding abbreviations or brief mentions
- Creating examples not in raw content
- Adding context or explanations
- Filling in "obvious" gaps
- Making content more "complete"

═══════════════════════════════════════════════════════════
⚠️ EXAMPLES OF VIOLATIONS (DO NOT DO THIS)
═══════════════════════════════════════════════════════════

❌ **BAD - Adding content:**

Raw: "Mónica is an administrator"
Bad output: "Mónica is a non-technical administrator responsible for user management, system configuration, and reporting. She needs intuitive interfaces..."

✅ **GOOD - Formatting only:**

Raw: "Mónica is an administrator"
Good output: "**Mónica**: Administrator"

---

❌ **BAD - Inventing details:**

Raw: "Feature generates knowledge snippets"
Bad output: "### Knowledge Snippet Generation\n- Manual generation via 'Generate Snippet' button\n- Automatic generation from request analysis\n- Classification as novel/complementary/redundant"

✅ **GOOD - Preserving exactly:**

Raw: "Feature generates knowledge snippets"
Good output: "### Knowledge Snippet Generation\nFeature generates knowledge snippets"

---

❌ **BAD - Expanding personas:**

Raw: "Jorge: End user"
Bad output: "**Jorge** - End User\n- Analyzes financial reports\n- Reviews dashboards\n- Makes data-driven decisions"

✅ **GOOD - Literal preservation:**

Raw: "Jorge: End user"
Good output: "**Jorge**: End user"

═══════════════════════════════════════════════════════════
🎯 YOUR TASK
═══════════════════════════════════════════════════════════

1. Read the raw content carefully
2. Identify natural groupings or lists
3. Add Markdown structure (headers, lists, tables)
4. Preserve EVERY detail exactly as written
5. Do NOT add ANY new information

**Output Requirements:**
- Return ONLY the formatted content
- NO explanations, NO "Here is...", NO meta-commentary
- Start directly with the formatted content
- If raw content is empty/minimal, output should be empty/minimal

═══════════════════════════════════════════════════════════
✓ FINAL CHECKLIST BEFORE RESPONDING
═══════════════════════════════════════════════════════════

Before you output, verify:

□ Did I add ANY feature not in raw content? → If YES, REMOVE IT
□ Did I add ANY persona detail not stated? → If YES, REMOVE IT  
□ Did I add ANY technical spec not mentioned? → If YES, REMOVE IT
□ Did I expand ANY brief mention? → If YES, REVERT TO BRIEF
□ Did I add ANY example not provided? → If YES, REMOVE IT
□ Is EVERY sentence traceable to raw content? → If NO, REMOVE IT
□ Did I only add formatting (headers, lists, bold)? → Must be YES

**If you added ANYTHING beyond formatting, you FAILED. Remove it.**

═══════════════════════════════════════════════════════════

Now format the raw content with ZERO additions. Structure only."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a strict formatting assistant. You add Markdown structure to content but NEVER add new information. You preserve source material exactly as written."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,  # Very low for literal preservation
            max_tokens=2500
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        # Fallback: return raw content if formatting fails
        print(f"⚠️  Warning: Failed to format section {section.key}: {str(e)}")
        return raw_content
