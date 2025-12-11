"""
Feature Suggestion Template - Template para generar sugerencias de features
"""

from typing import List, Dict
from api.models.workspace import ModuleSuggestion


class FeatureSuggestionPrompt:
    """
    Template para generar sugerencias de features basándose en:
    - Módulos identificados en documentación
    - Módulos sugeridos por AI
    - Features ya existentes (evitar duplicados)
    - Descripción del proyecto
    """
    
    @staticmethod
    def get_suggestion_prompt(
        project_context: str,
        existing_features: List[str],
        identified_modules: List[dict],
        suggested_modules: List[ModuleSuggestion],
        language_code: str = "es"
    ) -> str:
        """
        Genera prompt para sugerir features basándose en el análisis del workspace.
        
        Args:
            project_context: Contexto del proyecto (nombre, descripción)
            existing_features: Lista de features ya creadas
            identified_modules: Módulos identificados en la documentación
            suggested_modules: Módulos sugeridos por AI
            language_code: Código de idioma (es, en, pt)
        
        Returns:
            Prompt formateado para el modelo de AI
        """
        
        # Preparar lista de módulos identificados
        identified_list = ""
        if identified_modules:
            for module in identified_modules:
                if isinstance(module, dict):
                    module_name = module.get('name', module.get('title', str(module)))
                    identified_list += f"- {module_name}\n"
                else:
                    identified_list += f"- {str(module)}\n"
        else:
            identified_list = "Ninguno identificado aún"
        
        # Preparar lista de módulos sugeridos
        suggested_list = ""
        if suggested_modules:
            for module in suggested_modules:
                suggested_list += f"- {module.name} ({module.priority}): {module.rationale}\n"
        else:
            suggested_list = "Ninguno sugerido aún"
        
        # Preparar lista de features existentes
        existing_list = ""
        if existing_features:
            existing_list = "\n".join([f"- {f}" for f in existing_features])
        else:
            existing_list = "Ninguna feature creada aún"
        
        prompts = {
            "es": f"""Eres un arquitecto de software senior especializado en identificar y sugerir features para proyectos completos.

# CONTEXTO DEL PROYECTO
{project_context}

# MÓDULOS IDENTIFICADOS EN LA DOCUMENTACIÓN
{identified_list}

# MÓDULOS SUGERIDOS POR AI
{suggested_list}

# FEATURES YA CREADAS
{existing_list}

# TU TAREA
Genera sugerencias de features específicas que deberían desarrollarse para este proyecto.

IMPORTANTE:
1. NO sugieras features que ya existen en la lista de "Features ya creadas"
2. Basa tus sugerencias en los módulos identificados y sugeridos
3. Considera features que son necesarias pero no están explícitamente mencionadas
4. Prioriza features críticas e importantes
5. Sugiere entre 8-15 features relevantes

# FORMATO DE RESPUESTA

Para cada feature sugerida, proporciona:

## Feature [Número]
- **Nombre**: Nombre corto y descriptivo de la feature
- **Descripción**: Descripción breve (2-3 líneas) de qué hace la feature
- **Justificación**: Por qué es necesaria para el proyecto (1-2 párrafos)
- **Prioridad**: Critical / Important / Optional
- **Fuente**: Identified / Suggested / AI_Analysis
  - "Identified" si viene directamente de módulos identificados
  - "Suggested" si viene de módulos sugeridos
  - "AI_Analysis" si es una inferencia basada en el contexto del proyecto

# INSTRUCCIONES
1. Sé específico y concreto en cada sugerencia
2. Evita duplicados con features existentes
3. Considera dependencias entre features
4. Prioriza features que aportan valor de negocio
5. Incluye features técnicas necesarias (auth, logs, etc.) si no están ya cubiertas
6. Usa formato Markdown claro

Genera las sugerencias ahora:""",
            
            "en": f"""You are a senior software architect specialized in identifying and suggesting features for complete projects.

# PROJECT CONTEXT
{project_context}

# MODULES IDENTIFIED IN DOCUMENTATION
{identified_list}

# MODULES SUGGESTED BY AI
{suggested_list}

# EXISTING FEATURES
{existing_list}

# YOUR TASK
Generate specific feature suggestions that should be developed for this project.

IMPORTANT:
1. DO NOT suggest features that already exist in the "Existing Features" list
2. Base your suggestions on identified and suggested modules
3. Consider features that are necessary but not explicitly mentioned
4. Prioritize critical and important features
5. Suggest 8-15 relevant features

# RESPONSE FORMAT

For each suggested feature, provide:

## Feature [Number]
- **Name**: Short and descriptive name of the feature
- **Description**: Brief description (2-3 lines) of what the feature does
- **Rationale**: Why it's necessary for the project (1-2 paragraphs)
- **Priority**: Critical / Important / Optional
- **Source**: Identified / Suggested / AI_Analysis
  - "Identified" if it comes directly from identified modules
  - "Suggested" if it comes from suggested modules
  - "AI_Analysis" if it's an inference based on project context

# INSTRUCTIONS
1. Be specific and concrete in each suggestion
2. Avoid duplicates with existing features
3. Consider dependencies between features
4. Prioritize features that add business value
5. Include necessary technical features (auth, logs, etc.) if not already covered
6. Use clear Markdown format

Generate the suggestions now:"""
        }
        
        prompt_template = prompts.get(language_code, prompts["es"])
        return prompt_template
