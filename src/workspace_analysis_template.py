"""
Workspace Analysis Template - Template para análisis de proyectos completos desde 0
"""

from typing import Dict


class WorkspaceAnalysisPrompt:
    """
    Template para análisis de proyecto completo desde 0 (Software Factory).
    Genera un análisis comprehensivo del proyecto basado en documentación inicial.
    """
    
    @staticmethod
    def get_analysis_prompt(unified_context: str, language_code: str = "es") -> str:
        """
        Genera el prompt para análisis completo del workspace.
        
        Args:
            unified_context: Contexto unificado de todos los documentos del proyecto
            language_code: Código de idioma (es, en, pt)
        
        Returns:
            Prompt formateado para el modelo de AI
        """
        
        prompts = {
            "es": """Eres un arquitecto de software senior especializado en análisis de proyectos completos.

# CONTEXTO DEL PROYECTO
{context}

# TU TAREA
Analiza en profundidad la documentación proporcionada y genera un análisis completo del proyecto siguiendo la estructura especificada.

# ESTRUCTURA DEL ANÁLISIS

## 1. RESUMEN EJECUTIVO
- Visión general del proyecto en 2-3 párrafos
- Propuesta de valor principal
- Objetivos de negocio clave

## 2. ALCANCE Y OBJETIVOS
- Objetivos principales del proyecto
- Alcance definido (qué incluye y qué NO incluye)
- Criterios de éxito medibles
- Timeline estimado general

## 3. MÓDULOS/FEATURES IDENTIFICADOS
Para cada módulo identificado en la documentación, especifica:
- Nombre del módulo
- Descripción y propósito
- Funcionalidades principales
- Prioridad (Critical/High/Medium/Low)
- Estimación de complejidad (Alta/Media/Baja)
- Dependencias con otros módulos

## 4. MÓDULOS SUGERIDOS
Basándote en el tipo de proyecto y mejores prácticas, sugiere módulos adicionales que deberían considerarse (si no están en la documentación):
- Autenticación y autorización
- Gestión de usuarios y perfiles
- Panel de administración
- Sistema de notificaciones
- Integraciones con APIs externas
- Pasarela de pagos (si aplica al modelo de negocio)
- Sistema de logs y auditoría
- Backup y recuperación
- Otros relevantes al dominio

Para cada sugerencia, indica:
- Nombre del módulo
- Justificación (por qué es necesario)
- Prioridad (Critical/Important/Optional)
- Esfuerzo estimado

## 5. STACK TECNOLÓGICO RECOMENDADO
Basándote en los requerimientos y características del proyecto, recomienda:

### Frontend:
- Framework/librería principal
- Herramientas complementarias
- Justificación de la elección

### Backend:
- Lenguaje y framework
- APIs y servicios
- Justificación de la elección

### Base de Datos:
- Tipo de base de datos
- Tecnología específica
- Justificación de la elección

### Infraestructura:
- Hosting/Cloud provider
- CI/CD
- Monitoreo y observabilidad
- Justificación de las elecciones

## 6. ARQUITECTURA DE ALTO NIVEL
- Patrón arquitectónico propuesto (Microservicios, Monolito modular, etc.)
- Componentes principales del sistema
- Flujos de datos críticos
- Integraciones externas
- Consideraciones de escalabilidad

## 7. ESTIMACIONES DE RECURSOS
Proporciona estimaciones realistas considerando:

### Opción A: Dado un equipo de desarrollo
Si el proyecto se desarrollara con un equipo típico de [X] personas:
- Timeline estimado
- Fases principales del proyecto
- Hitos clave

### Opción B: Dado un deadline
Si el proyecto debe completarse en [X] tiempo:
- Tamaño de equipo recomendado
- Composición del equipo (roles)
- Riesgos de timeline apretado

### Desglose por módulo:
- Estimación de esfuerzo por módulo/feature
- Secuenciación recomendada
- Dependencias críticas

## 8. RIESGOS Y CONSIDERACIONES

### Riesgos Técnicos:
- Complejidad técnica alta
- Dependencias de terceros
- Deuda técnica potencial
- Escalabilidad
- Seguridad

### Riesgos de Negocio:
- Viabilidad del modelo
- Competencia
- Adopción de usuarios
- Costos operativos

### Mitigaciones Propuestas:
Para cada riesgo significativo, propón estrategias de mitigación.

## 9. RECOMENDACIONES FINALES
- Próximos pasos recomendados
- Áreas que requieren más investigación
- Quick wins (victorias tempranas)
- Consideraciones estratégicas

# INSTRUCCIONES IMPORTANTES
1. Sé específico y concreto en tus recomendaciones
2. Basa tus sugerencias en las mejores prácticas de la industria
3. Considera la viabilidad técnica y económica
4. Identifica dependencias y secuenciación lógica
5. Proporciona estimaciones realistas basadas en complejidad
6. No inventes información que no esté en el contexto, pero sí sugiere módulos estándar necesarios
7. Enfócate en crear valor de negocio mientras mantienes excelencia técnica
8. Usa formato Markdown para mejor legibilidad

Genera el análisis completo ahora:""",
            
            "en": """You are a senior software architect specialized in comprehensive project analysis.

# PROJECT CONTEXT
{context}

# YOUR TASK
Analyze the provided documentation in depth and generate a complete project analysis following the specified structure.

# ANALYSIS STRUCTURE

## 1. EXECUTIVE SUMMARY
- Project overview in 2-3 paragraphs
- Main value proposition
- Key business objectives

## 2. SCOPE AND OBJECTIVES
- Main project objectives
- Defined scope (what's included and what's NOT)
- Measurable success criteria
- General estimated timeline

## 3. IDENTIFIED MODULES/FEATURES
For each module identified in the documentation, specify:
- Module name
- Description and purpose
- Main functionalities
- Priority (Critical/High/Medium/Low)
- Complexity estimation (High/Medium/Low)
- Dependencies with other modules

## 4. SUGGESTED MODULES
Based on the project type and best practices, suggest additional modules that should be considered (if not in the documentation):
- Authentication and authorization
- User and profile management
- Administration panel
- Notification system
- External API integrations
- Payment gateway (if applicable to business model)
- Logging and audit system
- Backup and recovery
- Other domain-relevant modules

For each suggestion, indicate:
- Module name
- Justification (why it's necessary)
- Priority (Critical/Important/Optional)
- Estimated effort

## 5. RECOMMENDED TECH STACK
Based on requirements and project characteristics, recommend:

### Frontend:
- Main framework/library
- Complementary tools
- Choice justification

### Backend:
- Language and framework
- APIs and services
- Choice justification

### Database:
- Database type
- Specific technology
- Choice justification

### Infrastructure:
- Hosting/Cloud provider
- CI/CD
- Monitoring and observability
- Choice justifications

## 6. HIGH-LEVEL ARCHITECTURE
- Proposed architectural pattern (Microservices, Modular Monolith, etc.)
- Main system components
- Critical data flows
- External integrations
- Scalability considerations

## 7. RESOURCE ESTIMATIONS
Provide realistic estimations considering:

### Option A: Given a development team
If the project were developed with a typical team of [X] people:
- Estimated timeline
- Main project phases
- Key milestones

### Option B: Given a deadline
If the project must be completed in [X] time:
- Recommended team size
- Team composition (roles)
- Tight timeline risks

### Breakdown by module:
- Effort estimation per module/feature
- Recommended sequencing
- Critical dependencies

## 8. RISKS AND CONSIDERATIONS

### Technical Risks:
- High technical complexity
- Third-party dependencies
- Potential technical debt
- Scalability
- Security

### Business Risks:
- Model viability
- Competition
- User adoption
- Operational costs

### Proposed Mitigations:
For each significant risk, propose mitigation strategies.

## 9. FINAL RECOMMENDATIONS
- Recommended next steps
- Areas requiring more investigation
- Quick wins
- Strategic considerations

# IMPORTANT INSTRUCTIONS
1. Be specific and concrete in your recommendations
2. Base suggestions on industry best practices
3. Consider technical and economic viability
4. Identify dependencies and logical sequencing
5. Provide realistic estimates based on complexity
6. Don't invent information not in context, but do suggest necessary standard modules
7. Focus on creating business value while maintaining technical excellence
8. Use Markdown format for better readability

Generate the complete analysis now:"""
        }
        
        prompt_template = prompts.get(language_code, prompts["es"])
        return prompt_template.format(context=unified_context)
    
    @staticmethod
    def get_module_suggestion_prompt(project_summary: str, language_code: str = "es") -> str:
        """
        Prompt específico para sugerir módulos adicionales basado en el resumen del proyecto.
        """
        
        prompts = {
            "es": """Basándote en este resumen del proyecto:

{summary}

Sugiere módulos adicionales que son esenciales o muy recomendados para este tipo de proyecto.
Considera aspectos como: seguridad, escalabilidad, mantenibilidad, experiencia de usuario.

Para cada módulo sugerido, proporciona:
1. Nombre del módulo
2. Por qué es necesario/recomendado
3. Prioridad: Critical/Important/Optional
4. Esfuerzo estimado: Alto/Medio/Bajo

Formato JSON:
```json
[
  {{
    "name": "Nombre del módulo",
    "rationale": "Justificación detallada",
    "priority": "Critical|Important|Optional",
    "estimated_effort": "Alto|Medio|Bajo"
  }}
]
```""",
            
            "en": """Based on this project summary:

{summary}

Suggest additional modules that are essential or highly recommended for this type of project.
Consider aspects like: security, scalability, maintainability, user experience.

For each suggested module, provide:
1. Module name
2. Why it's necessary/recommended
3. Priority: Critical/Important/Optional
4. Estimated effort: High/Medium/Low

JSON format:
```json
[
  {{
    "name": "Module name",
    "rationale": "Detailed justification",
    "priority": "Critical|Important|Optional",
    "estimated_effort": "High|Medium|Low"
  }}
]
```"""
        }
        
        prompt_template = prompts.get(language_code, prompts["es"])
        return prompt_template.format(summary=project_summary)
