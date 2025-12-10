"""
Diagram Generator Module - Mermaid Diagram Generation
Generates flow diagrams, architecture diagrams, and user journeys from PRD content.
"""

from typing import List, Dict, Optional
from dataclasses import dataclass
from openai import OpenAI
import json


@dataclass
class DiagramSpec:
    """Specification for a diagram to be generated."""
    diagram_type: str  # "flowchart", "sequence", "architecture"
    title: str
    description: str
    source_content: str  # Content from PRD to base diagram on


DIAGRAM_GENERATION_PROMPT = """Eres un experto en crear diagramas Mermaid para documentación técnica.

Tu trabajo es generar diagramas Mermaid SOLO basándote en la información proporcionada.

**Reglas estrictas:**
1. USA SOLO información del contenido proporcionado
2. NO inventes pasos, componentes, o flujos que no estén mencionados
3. Mantén los diagramas simples y claros
4. Usa sintaxis Mermaid válida
5. Si no hay suficiente información, genera un diagrama básico

**Tipo de diagrama:** {diagram_type}
**Título:** {title}

**Contenido fuente:**
{source_content}

**Formato de salida (JSON):**
{{
  "mermaid_code": "graph TD\\n  A[Start] --> B[End]",
  "description": "Breve descripción del diagrama",
  "elements_used": ["elemento1", "elemento2"]  // Elementos del contenido fuente usados
}}

Genera el diagrama Mermaid."""


def generate_user_flow_diagram(
    user_stories: str,
    product_name: str,
    client: OpenAI
) -> Optional[str]:
    """
    Generate user flow diagram from user stories.
    
    Args:
        user_stories: User stories content from PRD
        product_name: Name of the product
        client: OpenAI client
        
    Returns:
        Mermaid diagram code or None if generation fails
    """
    if not user_stories or len(user_stories.strip()) < 50:
        return None
    
    prompt = DIAGRAM_GENERATION_PROMPT.format(
        diagram_type="Flowchart (graph TD)",
        title=f"User Flow - {product_name}",
        source_content=user_stories
    )
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": "Genera el diagrama de flujo de usuario."}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=1500
        )
        
        content = response.choices[0].message.content
        parsed = json.loads(content)
        
        mermaid_code = parsed.get("mermaid_code", "")
        description = parsed.get("description", "")
        
        if mermaid_code:
            # Format as markdown code block
            diagram = f"### User Flow Diagram\n\n"
            diagram += f"_{description}_\n\n"
            diagram += f"```mermaid\n{mermaid_code}\n```\n"
            return diagram
        
        return None
        
    except Exception as e:
        print(f"⚠️  Warning: Failed to generate user flow diagram: {str(e)}")
        return None


def generate_architecture_diagram(
    technical_requirements: str,
    product_name: str,
    client: OpenAI
) -> Optional[str]:
    """
    Generate system architecture diagram from technical requirements.
    
    Args:
        technical_requirements: Technical requirements content from PRD
        product_name: Name of the product
        client: OpenAI client
        
    Returns:
        Mermaid diagram code or None if generation fails
    """
    if not technical_requirements or len(technical_requirements.strip()) < 50:
        return None
    
    prompt = DIAGRAM_GENERATION_PROMPT.format(
        diagram_type="Architecture diagram (graph LR)",
        title=f"System Architecture - {product_name}",
        source_content=technical_requirements
    )
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": "Genera el diagrama de arquitectura del sistema."}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=1500
        )
        
        content = response.choices[0].message.content
        parsed = json.loads(content)
        
        mermaid_code = parsed.get("mermaid_code", "")
        description = parsed.get("description", "")
        
        if mermaid_code:
            # Format as markdown code block
            diagram = f"### System Architecture\n\n"
            diagram += f"_{description}_\n\n"
            diagram += f"```mermaid\n{mermaid_code}\n```\n"
            return diagram
        
        return None
        
    except Exception as e:
        print(f"⚠️  Warning: Failed to generate architecture diagram: {str(e)}")
        return None


def generate_feature_breakdown(
    functional_requirements: str,
    product_name: str,
    client: OpenAI
) -> Optional[str]:
    """
    Generate feature breakdown diagram.
    
    Args:
        functional_requirements: Functional requirements content from PRD
        product_name: Name of the product
        client: OpenAI client
        
    Returns:
        Mermaid diagram code or None if generation fails
    """
    if not functional_requirements or len(functional_requirements.strip()) < 50:
        return None
    
    prompt = DIAGRAM_GENERATION_PROMPT.format(
        diagram_type="Mind map (mindmap)",
        title=f"Feature Breakdown - {product_name}",
        source_content=functional_requirements
    )
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": "Genera un diagrama de desglose de features."}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=1500
        )
        
        content = response.choices[0].message.content
        parsed = json.loads(content)
        
        mermaid_code = parsed.get("mermaid_code", "")
        description = parsed.get("description", "")
        
        if mermaid_code:
            # Format as markdown code block
            diagram = f"### Feature Breakdown\n\n"
            diagram += f"_{description}_\n\n"
            diagram += f"```mermaid\n{mermaid_code}\n```\n"
            return diagram
        
        return None
        
    except Exception as e:
        print(f"⚠️  Warning: Failed to generate feature breakdown: {str(e)}")
        return None


def add_diagrams_to_prd(prd_sections: Dict[str, str], product_name: str, client: OpenAI) -> str:
    """
    Generate all relevant diagrams and add to appendix.
    
    Args:
        prd_sections: Dictionary of PRD sections
        product_name: Name of the product
        client: OpenAI client
        
    Returns:
        Markdown content for appendix with diagrams
    """
    diagrams = []
    
    # Try to generate user flow diagram
    if "user_experience" in prd_sections:
        user_flow = generate_user_flow_diagram(
            prd_sections["user_experience"],
            product_name,
            client
        )
        if user_flow:
            diagrams.append(user_flow)
    
    # Try to generate architecture diagram
    if "technical_requirements" in prd_sections:
        architecture = generate_architecture_diagram(
            prd_sections["technical_requirements"],
            product_name,
            client
        )
        if architecture:
            diagrams.append(architecture)
    
    # Try to generate feature breakdown
    if "functional_requirements" in prd_sections:
        features = generate_feature_breakdown(
            prd_sections["functional_requirements"],
            product_name,
            client
        )
        if features:
            diagrams.append(features)
    
    if diagrams:
        appendix = "## Diagrams\n\n"
        appendix += "\n\n".join(diagrams)
        return appendix
    
    return ""
