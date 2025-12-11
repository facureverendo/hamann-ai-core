# Arquitectura de Workspaces y Features

## Índice
- [Visión General](#visión-general)
- [Modelos de Datos](#modelos-de-datos)
- [Backend](#backend)
- [Frontend](#frontend)
- [Procesamiento con AI](#procesamiento-con-ai)
- [Flujos de Datos](#flujos-de-datos)
- [Extensibilidad](#extensibilidad)

## Visión General

La implementación introduce una jerarquía opcional de dos niveles:

```
Workspace (Proyecto Completo)
├── Feature 1 (PRD)
├── Feature 2 (PRD)
└── Feature N (PRD)

Feature Standalone (sin workspace)
```

### Principios de Diseño

1. **Compatibilidad hacia atrás**: Features existentes siguen funcionando sin cambios
2. **Opcional, no obligatorio**: Los workspaces son opcionales
3. **Configurabilidad**: Los usuarios pueden ocultar modos que no usan
4. **Preparado para futuro**: Arquitectura extensible para casos de uso futuros

## Modelos de Datos

### Backend Models

#### Workspace (`api/models/workspace.py`)

```python
class Workspace(BaseModel):
    id: str
    name: str
    description: str
    type: str  # "software_factory" o "product"
    created_at: str
    updated_at: str
    
    # Referencias
    features: List[str]  # IDs de features/PRDs
    context_documents: List[str]  # Docs iniciales
    
    # Estado
    documents_processed: bool
    analysis_completed: bool
    
    # Análisis
    analysis: Optional[WorkspaceAnalysis] = None
    language_code: Optional[str] = None
```

#### WorkspaceAnalysis (`api/models/workspace.py`)

```python
class WorkspaceAnalysis(BaseModel):
    workspace_id: str
    executive_summary: str
    project_scope: dict
    business_objectives: List[str]
    
    # Módulos
    identified_features: List[dict]  # De la documentación
    suggested_modules: List[ModuleSuggestion]  # Sugeridos por AI
    
    # Stack y arquitectura
    tech_stack_recommendation: Optional[TechStackRecommendation]
    architecture_overview: str
    
    # Estimaciones (futuro)
    resource_estimation: Optional[ResourceEstimation]
    timeline_estimation: Optional[dict]
    
    # Riesgos
    technical_risks: List[str]
    business_risks: List[str]
```

#### ProjectState (modificado)

```python
class ProjectState(BaseModel):
    project_id: str
    project_name: str
    workspace_id: Optional[str] = None  # NUEVO: referencia opcional
    # ... resto de campos existentes
```

#### AppSettings (`api/models/app_settings.py`)

```python
class AppSettings(BaseModel):
    show_software_factory_mode: bool = True
    show_product_mode: bool = True
    default_mode: str = "product"
```

### Storage

#### Estructura de Directorios

```
/workspaces/
├── workspace_20251211_123456/
│   ├── workspace.json          # Estado del workspace
│   ├── documents/              # Documentos iniciales
│   │   ├── brief.pdf
│   │   ├── specs.docx
│   │   └── references.md
│   ├── context.txt             # Contexto unificado
│   └── analysis.md             # Análisis completo

/projects/
├── feature_20251211_123456/    # Feature dentro de workspace
│   ├── state.json              # workspace_id presente
│   └── ...
├── project_20251211_654321/    # Feature standalone
│   ├── state.json              # workspace_id = null
│   └── ...

/settings.json                   # Configuración global
```

## Backend

### API Endpoints

#### Workspaces (`api/routes/workspaces.py`)

```
GET    /api/workspaces/                    - Listar workspaces
POST   /api/workspaces/                    - Crear workspace
GET    /api/workspaces/{id}                - Obtener workspace
DELETE /api/workspaces/{id}                - Eliminar workspace
POST   /api/workspaces/{id}/analyze        - Analizar con AI
GET    /api/workspaces/{id}/features       - Listar features del workspace
POST   /api/workspaces/{id}/features       - Crear feature en workspace
```

#### Settings (`api/routes/settings.py`)

```
GET    /api/settings/                      - Obtener configuración
PUT    /api/settings/                      - Actualizar configuración
```

#### Projects (existente, sin cambios mayores)

```
GET    /api/projects/                      - Listar features
POST   /api/projects/                      - Crear feature
GET    /api/projects/{id}/status           - Estado del feature
... (todos los endpoints existentes)
```

### Servicios

#### WorkspaceProcessor (`api/services/workspace_processor.py`)

Procesador especializado para workspaces:

```python
class WorkspaceProcessor:
    def analyze_workspace(self, workspace_id: str) -> Dict:
        """
        Analiza documentos del workspace con AI.
        
        Diferencias clave vs. ProjectProcessor:
        - Procesa MÚLTIPLES documentos iniciales
        - Usa workspace_analysis_template (diferente prompt)
        - Genera análisis macro del proyecto
        - Sugiere módulos necesarios
        - Recomienda stack tecnológico
        """
        
    def suggest_modules(self, context: str) -> List[ModuleSuggestion]:
        """Sugiere módulos adicionales necesarios"""
        
    def suggest_tech_stack(self, requirements: dict) -> TechStackRecommendation:
        """Recomienda stack tecnológico (futuro)"""
        
    def estimate_resources(self, scope: dict, ...) -> ResourceEstimation:
        """Estima recursos necesarios (futuro)"""
```

#### ProjectProcessor (existente)

Sigue manejando features/PRDs individuales sin cambios significativos.

### Prompts de AI

#### workspace_analysis_template.py (NUEVO)

Prompt especializado para análisis de proyectos completos:

**Diferencias clave vs. prd_template.py:**

| Aspecto | PRD Template (Feature) | Workspace Template (Proyecto) |
|---------|------------------------|-------------------------------|
| Alcance | Feature específica | Proyecto completo |
| Nivel | Táctico, detallado | Estratégico, alto nivel |
| Output | PRD estructurado | Análisis comprehensivo |
| Módulos | No sugiere | Sugiere módulos necesarios |
| Stack | No recomienda | Recomienda tecnologías |
| Estimaciones | No incluye | Incluye estimaciones |

**Secciones del análisis:**
1. Resumen Ejecutivo
2. Alcance y Objetivos
3. Módulos Identificados (de los docs)
4. Módulos Sugeridos (por AI)
5. Stack Tecnológico Recomendado
6. Arquitectura de Alto Nivel
7. Estimaciones de Recursos
8. Riesgos y Consideraciones
9. Recomendaciones Finales

## Frontend

### Servicios

#### workspaceService.ts (NUEVO)

```typescript
export const workspaceService = {
  // CRUD
  listWorkspaces(): Promise<Workspace[]>
  createWorkspace(name, description, type, files): Promise<...>
  getWorkspace(id): Promise<WorkspaceDetail>
  deleteWorkspace(id): Promise<...>
  
  // AI Processing
  analyzeWorkspace(id): Promise<Analysis>
  
  // Features
  getWorkspaceFeatures(id): Promise<Feature[]>
  createFeature(workspaceId, name, files): Promise<...>
  
  // Futuro
  suggestTechStack(id): Promise<TechStack>
  estimateResources(id, params): Promise<Estimation>
}
```

#### settingsService.ts (NUEVO)

```typescript
export const settingsService = {
  getSettings(): Promise<AppSettings>
  updateSettings(settings): Promise<...>
}
```

### Páginas

#### WorkspaceList.tsx
- Lista de workspaces con cards
- Estadísticas de cada workspace
- Navegación a detalle

#### WorkspaceDetail.tsx
- Vista completa del workspace
- Estado de procesamiento
- Botón de análisis
- Visualización del análisis AI
- Lista de features dentro del workspace
- Acciones (crear feature, etc.)

#### CreateWorkspace.tsx
- Formulario de creación
- Upload de múltiples documentos
- Validaciones
- Redirige a detalle tras crear

#### Dashboard.tsx (modificado)
- Tabs para alternar entre Workspaces y Features
- Respeta configuración de modos visibles
- Botón "Nuevo" abre selector si ambos modos activos

#### Settings.tsx (modificado)
- Sección nueva: Configuración de Modos
- Toggles para mostrar/ocultar modos
- Selector de modo por defecto
- Guardar configuración

### Componentes

#### CreateItemSelector.tsx
- Modal de selección de tipo
- Muestra opciones según configuración
- Redirige a flujo correspondiente
- Auto-redirige si solo un modo activo

#### WorkspaceCard.tsx
- Card visual para workspace
- Muestra info clave y progreso
- Click navega a detalle

### Routing (`App.tsx`)

```
/                              - Dashboard
/workspaces                    - Lista de workspaces
/workspaces/new                - Crear workspace
/workspaces/:id                - Detalle de workspace
/workspaces/:id/features/new   - Crear feature en workspace (futuro)

/projects                      - Lista de features (todos)
/projects/new                  - Crear feature standalone
/projects/:id                  - Vista del feature
/prd/:id                       - PRD viewer
... (rutas existentes)

/settings                      - Configuración
```

## Procesamiento con AI

### Comparación de Flujos

#### Flujo Workspace (Proyecto desde 0)

```
1. Upload múltiples documentos
   ↓
2. Ingestor: procesar y unificar contexto
   ↓
3. Detectar idioma
   ↓
4. workspace_analysis_template.py
   ↓
5. GPT-4o: análisis comprehensivo
   ↓
6. Output:
   - Resumen ejecutivo
   - Módulos identificados + sugeridos
   - Stack tecnológico recomendado
   - Arquitectura alto nivel
   - Estimaciones
   - Riesgos
   ↓
7. Guardar análisis
   ↓
8. Usuario crea features específicos dentro
```

#### Flujo Feature (existente)

```
1. Upload documentos de feature
   ↓
2. Procesar inputs
   ↓
3. Analizar gaps
   ↓
4. (Opcional) Generar preguntas
   ↓
5. prd_template.py
   ↓
6. GPT-4o: PRD detallado
   ↓
7. Generar backlog
   ↓
8. Generar insights
```

### Diferencias en Prompts

**workspace_analysis_template:**
- Enfoque estratégico y de alto nivel
- Sugiere módulos estándar necesarios
- Recomienda tecnologías
- Considera viabilidad completa del proyecto

**prd_template (existente):**
- Enfoque táctico y detallado
- No sugiere módulos adicionales
- No recomienda tecnologías
- Se enfoca en la feature específica

## Flujos de Datos

### Crear y Analizar Workspace

```
[Usuario] 
  ↓ (nombre, descripción, archivos)
[Frontend: CreateWorkspace]
  ↓ POST /api/workspaces/
[Backend: workspaces.py]
  ↓ save files & create Workspace
[workspaces/{id}/]
  ↓
[Frontend: WorkspaceDetail]
  ↓ click "Analizar"
  ↓ POST /api/workspaces/{id}/analyze
[Backend: WorkspaceProcessor]
  ↓ process_inputs_folder()
  ↓ detect_language()
  ↓ workspace_analysis_template.get_analysis_prompt()
  ↓ OpenAI GPT-4o
[Analysis Result]
  ↓ parse & save
[workspaces/{id}/workspace.json]
  ↓
[Frontend: muestra análisis]
```

### Crear Feature en Workspace

```
[Usuario en WorkspaceDetail]
  ↓ click "Nueva Feature"
[Frontend: CreateFeatureModal o ruta]
  ↓ POST /api/workspaces/{workspace_id}/features
[Backend: workspaces.py]
  ↓ create ProjectState with workspace_id
  ↓ save files
[projects/{feature_id}/]
  ↓
[Workspace.features].append(feature_id)
  ↓
[Sigue flujo normal de feature]
```

## Extensibilidad

### Casos de Uso Futuros Preparados

La arquitectura está preparada para:

#### 1. Sugerencias de Stack Tecnológico

```python
# Ya definido en modelos
class TechStackRecommendation(BaseModel):
    frontend: List[str]
    backend: List[str]
    database: List[str]
    infrastructure: List[str]
    rationale: dict

# Endpoint preparado
POST /api/workspaces/{id}/suggest-tech-stack
```

**Implementación futura:**
- Analizar requerimientos del proyecto
- Considerar escalabilidad, complejidad, equipo
- Recomendar tecnologías con justificación

#### 2. Estimaciones de Recursos

```python
class ResourceEstimation(BaseModel):
    # Caso 1: Dado equipo → estimar tiempo
    team_size_input: Optional[int]
    estimated_timeline: Optional[str]
    
    # Caso 2: Dado deadline → estimar equipo
    deadline_input: Optional[str]
    required_team_size: Optional[int]
    required_team_composition: Optional[dict]
    
    breakdown_by_module: List[dict]
    assumptions: List[str]
    confidence_level: str

# Endpoint preparado
POST /api/workspaces/{id}/estimate-resources
```

**Implementación futura:**
- Analizar complejidad de módulos
- Considerar dependencias
- Calcular recursos necesarios
- Bidireccional: equipo→tiempo o tiempo→equipo

#### 3. Generación Automática de PRDs

**Caso de uso:** De los módulos sugeridos, generar automáticamente PRDs base.

```python
# Método futuro
async def generate_feature_prds(
    workspace_id: str,
    selected_modules: List[str]
) -> List[Feature]:
    """
    Para cada módulo sugerido seleccionado:
    1. Crear un feature nuevo
    2. Generar PRD base usando contexto del workspace
    3. Retornar lista de features creados
    """
```

#### 4. Análisis de Viabilidad

```python
class ViabilityAnalysis(BaseModel):
    technical_viability: float  # 0-1
    economic_viability: float
    timeline_viability: float
    overall_score: float
    concerns: List[str]
    recommendations: List[str]
```

### Puntos de Extensión

#### Backend

1. **WorkspaceProcessor**: Añadir nuevos métodos de análisis
2. **Prompts**: Crear nuevos templates para casos específicos
3. **Modelos**: Extender WorkspaceAnalysis con nuevos campos
4. **Endpoints**: Añadir nuevas rutas en workspaces.py

#### Frontend

1. **workspaceService**: Añadir métodos para nuevos endpoints
2. **WorkspaceDetail**: Añadir secciones para nuevas funcionalidades
3. **Componentes**: Crear visualizaciones para nuevos análisis

## Configuración de Deployment

### Variables de Entorno

```bash
# Existentes
OPENAI_API_KEY=...

# Nuevas (opcional)
DEFAULT_WORKSPACE_MODE=software_factory  # o product
ENABLE_WORKSPACE_MODE=true
ENABLE_FEATURE_MODE=true
```

### Inicialización

Al primer arranque, si no existe `settings.json`:

```python
# api/models/app_settings.py
AppSettings(
    show_software_factory_mode=True,
    show_product_mode=True,
    default_mode="product"
).save()
```

## Migración

### De versión anterior

**Sin acción requerida:**
- Features existentes siguen funcionando como "standalone"
- No tienen `workspace_id`, por lo que son independientes
- Aparecen en la sección "Features" del dashboard
- No requieren migración inmediata

**Opcional:**
- Crear workspaces nuevos para organizar
- Crear nuevas features dentro de workspaces
- Mantener features antiguos como standalone

### Script de migración (futuro)

```python
# api/scripts/migrate_features_to_workspace.py

def migrate_features_to_workspace(
    workspace_id: str,
    feature_ids: List[str]
):
    """
    Migra features standalone a un workspace.
    
    1. Carga cada feature
    2. Actualiza workspace_id
    3. Guarda feature
    4. Actualiza workspace.features
    """
```

## Testing

### Backend Tests

```python
# tests/test_workspace_api.py
def test_create_workspace()
def test_analyze_workspace()
def test_list_workspaces()
def test_workspace_features()

# tests/test_workspace_processor.py
def test_analyze_documents()
def test_suggest_modules()
def test_parse_analysis()
```

### Frontend Tests

```typescript
// tests/workspaceService.test.ts
describe('WorkspaceService', () => {
  test('createWorkspace')
  test('analyzeWorkspace')
  test('getWorkspaceFeatures')
})

// tests/CreateItemSelector.test.tsx
describe('CreateItemSelector', () => {
  test('shows both options when both modes enabled')
  test('auto-redirects when only one mode enabled')
})
```

## Performance

### Consideraciones

1. **Análisis de Workspace**: Es un proceso costoso (multiple docs + análisis comprehensivo)
   - Ejecutar asíncronamente
   - Mostrar indicador de progreso
   - Cachear resultados

2. **Listado de Workspaces**: Puede crecer
   - Paginación (futuro)
   - Filtros y búsqueda

3. **Features dentro de Workspace**: Relación 1:N
   - Cargar features lazy
   - Mostrar count sin cargar todos

## Seguridad

### Validaciones

- Validar tipos de archivo en upload
- Validar tamaño de archivos
- Sanitizar nombres de archivos
- Validar permisos (futuro: multi-tenant)

### Autorización

Preparado para futuro multi-tenant:
- Workspace.owner_id (futuro)
- Feature.workspace_id valida pertenencia
- Endpoints verifican ownership

## Conclusión

Esta arquitectura proporciona:

✅ **Flexibilidad**: Dos modos de trabajo según necesidad
✅ **Compatibilidad**: Features existentes sin cambios
✅ **Extensibilidad**: Preparado para casos de uso futuros
✅ **Configurabilidad**: Usuarios ocultan lo que no usan
✅ **Escalabilidad**: Estructura preparada para crecer

El sistema ahora soporta tanto empresas de producto como software factories, manteniendo simplicidad para quien no necesita la complejidad adicional.
