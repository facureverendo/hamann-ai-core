# Implementación del Sistema de Versionado

## Resumen

Se implementó un sistema completo de versionado para proyectos, permitiendo:
- Agregar nuevos documentos complementarios a proyectos existentes
- Reprocesar proyectos con todas las fuentes combinadas
- Mantener múltiples versiones del PRD
- Comparar versiones del PRD lado a lado
- Navegar entre diferentes versiones históricas
- Preservar respuestas de usuario entre versiones

## Arquitectura

### Backend

#### Nuevos Archivos
- `api/services/version_manager.py` - Gestión de versiones y comparaciones
- `VERSIONING_TESTING_GUIDE.md` - Guía completa de testing

#### Archivos Modificados
- `api/models/project_state.py` - Agregados campos `current_version` y `version_history`
- `api/services/project_processor.py` - Agregados métodos:
  - `add_additional_sources()` - Agregar archivos sin reprocesar
  - `reprocess_with_new_sources()` - Reprocesar con todas las fuentes
  - `get_version_history()` - Obtener historial de versiones
  - `get_prd_version()` - Obtener PRD específico
  - `compare_versions()` - Comparar dos versiones
- `api/routes/projects.py` - Agregados endpoints:
  - `POST /{project_id}/sources` - Subir archivos adicionales
  - `POST /{project_id}/reprocess` - Reprocesar proyecto
  - `GET /{project_id}/versions` - Obtener historial
  - `GET /{project_id}/prd/v/{version}` - Obtener PRD específico
  - `POST /{project_id}/versions/compare` - Comparar versiones

### Frontend

#### Nuevos Componentes
- `frontend/src/components/project/AddSourcesModal.tsx` - Modal para agregar documentos
- `frontend/src/components/prd/VersionComparator.tsx` - Comparador de versiones

#### Archivos Modificados
- `frontend/src/services/projectService.ts` - Agregados métodos para nuevos endpoints
- `frontend/src/components/project/ActionPanel.tsx` - Agregadas acciones:
  - "Agregar Documentos"
  - "Reprocesar Proyecto"
- `frontend/src/pages/PRDViewer.tsx` - Agregado:
  - Selector de versiones
  - Navegación entre versiones
  - Modal de comparación

## Estructura de Datos

### Directorio de Proyecto
```
projects/project_XXX/
├── inputs/                    # Archivos originales (v1)
├── inputs_v2/                 # Archivos agregados en v2
├── inputs_v3/                 # Archivos agregados en v3
├── outputs/
│   ├── prd_v1.md             # PRD versión 1
│   ├── prd_v2.md             # PRD versión 2
│   ├── prd_v3.md             # PRD versión 3
│   └── prd.md                # Symlink/copia de última versión
├── versions/
│   ├── v1_metadata.json      # Metadata de v1
│   ├── v2_metadata.json      # Metadata de v2
│   └── v3_metadata.json      # Metadata de v3
├── context_v2.txt            # Contexto combinado v2
├── context_v3.txt            # Contexto combinado v3
├── analysis_v2.json          # Análisis v2
├── analysis_v3.json          # Análisis v3
├── answers.json              # Respuestas de usuario (todas las versiones)
└── state.json                # Estado del proyecto
```

### State.json
```json
{
  "project_id": "project_20251211_001300",
  "project_name": "Mi Proyecto",
  "current_version": 2,
  "version_history": [
    {
      "version": 2,
      "action": "sources_added",
      "timestamp": "2025-12-11T15:30:00",
      "notes": "Documentación técnica del API",
      "files_added": ["api_docs.pdf", "specs.txt"]
    },
    {
      "version": 2,
      "action": "reprocessed",
      "timestamp": "2025-12-11T15:35:00",
      "gaps_detected": 15,
      "answers_preserved": 8
    }
  ],
  "prd_built": true,
  "inputs_processed": true,
  "gaps_analyzed": true
}
```

### Version Metadata
```json
{
  "version": 2,
  "created_at": "2025-12-11T15:30:00",
  "files_added": ["api_docs.pdf", "specs.txt"],
  "notes": "Documentación técnica del API",
  "gaps_detected": 15,
  "questions_generated": 0,
  "status": "completed",
  "completed_at": "2025-12-11T15:35:00"
}
```

## Flujo de Usuario

### 1. Agregar Documentos
```
Usuario → "Agregar Documentos" → Modal con Drag&Drop 
→ Subir archivos → Agregar notas → "Agregar Documentos"
→ Archivos guardados en inputs_vX/ → Versión incrementada
```

### 2. Reprocesar
```
Usuario → "Reprocesar Proyecto" 
→ Backend combina todos los inputs (v1, v2, v3...)
→ Genera contexto unificado
→ Re-analiza gaps
→ Preserva respuestas anteriores
→ Genera PRD vX
→ Actualiza metadata
```

### 3. Ver Versiones
```
Usuario → PRD Viewer → Selector de versiones
→ Selecciona versión → Carga PRD específico
→ Muestra contenido de esa versión
```

### 4. Comparar Versiones
```
Usuario → "Comparar Versiones" → Modal comparador
→ Selecciona v1 y v2 → "Comparar"
→ Backend compara PRDs
→ Muestra diferencias:
  - Secciones agregadas (verde)
  - Secciones eliminadas (rojo)
  - Secciones modificadas (amarillo)
  - Cambios en gaps
```

## Características Principales

### Preservación de Respuestas
- Las respuestas del usuario en sesiones interactivas se preservan
- Al reprocesar, las respuestas válidas se mantienen
- Solo se generan preguntas para gaps nuevos o modificados

### Contexto Combinado
- Todos los inputs se procesan juntos
- Se mantienen marcadores entre fuentes
- El contexto incluye toda la información histórica

### Metadata Completa
- Cada versión tiene metadata detallada
- Historial de acciones en el estado del proyecto
- Tracking de archivos agregados por versión

### Comparación Inteligente
- Usa SequenceMatcher para detectar similitud
- Genera resumen con IA de cambios principales
- Muestra diff línea por línea
- Compara cambios en gaps

## Validaciones

### Backend
- ✅ No permitir agregar fuentes antes de PRD v1
- ✅ Validar tipos de archivo permitidos
- ✅ Verificar que versión existe antes de obtenerla
- ✅ Validar que versiones son diferentes al comparar
- ✅ Preservar respuestas de usuario existentes

### Frontend
- ✅ Deshabilitar "Agregar Documentos" si no hay PRD v1
- ✅ Mostrar "Reprocesar" solo si hay cambios pendientes
- ✅ Validar archivos en drag & drop
- ✅ Deshabilitar comparación si solo hay 1 versión
- ✅ Mostrar indicador de versión actual

## Manejo de Errores

### Backend
- `ValueError` para validaciones de negocio
- `HTTPException` para errores de API
- Logs detallados para debugging
- Fallbacks en generación de resúmenes IA

### Frontend
- Mensajes de error claros y en español
- Estados de loading mientras procesa
- Mensajes de éxito informativos
- Validación antes de subir archivos

## Performance

### Optimizaciones
- Cache de preguntas (no regenerar si no cambió)
- Lazy loading de versiones antiguas
- Límite de cambios mostrados en comparación (50)
- Procesamiento incremental de gaps

### Consideraciones
- Archivos grandes pueden tardar en procesarse
- Comparación de PRDs muy grandes puede ser lenta
- Se recomienda límite de 10 archivos por versión
- Tamaño máximo total recomendado: 50MB

## Retrocompatibilidad

El sistema es completamente retrocompatible:
- Proyectos existentes tienen `current_version: 1` por defecto
- `version_history` se inicializa como array vacío
- Si no existen versiones, funciona como antes
- Metadata se genera on-demand si no existe

## Extensiones Futuras

Posibles mejoras:
1. ☐ Rollback a versiones anteriores
2. ☐ Fusión de versiones (merge)
3. ☐ Branches de versiones (desarrollo vs producción)
4. ☐ Comentarios en versiones
5. ☐ Notificaciones de cambios
6. ☐ Exportar diff como PDF
7. ☐ Timeline visual de versiones
8. ☐ Comparación de 3+ versiones
9. ☐ Auto-versionado en cambios significativos
10. ☐ Versionado de backlog y insights

## Documentación Adicional

- Ver `VERSIONING_TESTING_GUIDE.md` para guía completa de testing
- Ver código fuente para detalles de implementación
- Ver comentarios en código para explicaciones específicas

## Créditos

Implementado siguiendo el plan especificado en:
- `/home/facureverendo/.cursor/plans/add_sources_&_versioning_6b9eafec.plan.md`

Todos los TODOs completados:
✅ backend-models
✅ backend-version-manager
✅ backend-processor
✅ backend-routes
✅ frontend-service
✅ frontend-add-sources
✅ frontend-action-panel
✅ frontend-version-selector
✅ frontend-comparator
✅ integration-testing
