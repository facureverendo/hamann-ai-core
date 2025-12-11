# Guía de Testing - Sistema de Versionado

Esta guía describe cómo probar el nuevo sistema de versionado implementado.

## Pre-requisitos

1. Backend y Frontend deben estar corriendo:
   ```bash
   # Terminal 1 - Backend
   cd api
   python3 main.py
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. Tener un proyecto existente con al menos PRD v1 generado

## Flujo de Testing Completo

### 1. Verificar Estado Inicial

1. Navegar a un proyecto existente en el overview
2. Verificar que el proyecto tenga PRD generado (v1)
3. Ver el PRD en `/prd/{project_id}`
4. Confirmar que el selector de versiones muestra "Versión 1 (actual)"

### 2. Agregar Nuevos Documentos

1. En Project Overview, buscar la acción "Agregar Documentos"
2. Click en "Agregar Documentos"
3. Probar drag & drop:
   - Arrastrar un archivo PDF o TXT
   - Verificar que aparece en la lista
4. Probar selector de archivos:
   - Click en "selecciona archivos"
   - Elegir uno o más archivos
5. Agregar notas descriptivas (opcional):
   ```
   Documentación técnica complementaria del API REST
   ```
6. Click en "Agregar Documentos"
7. Verificar mensaje de éxito:
   ```
   X documento(s) agregado(s) a la versión 2. Usa 'Reprocesar Proyecto' para generar nueva versión del PRD.
   ```

### 3. Verificar Estado del Proyecto

1. Recargar el estado del proyecto
2. Verificar que aparece la acción "Reprocesar Proyecto" habilitada
3. Verificar en el backend que existe la carpeta `inputs_v2/` con los nuevos archivos:
   ```bash
   ls projects/project_XXX/inputs_v2/
   ```

### 4. Reprocesar Proyecto

1. Click en "Reprocesar Proyecto"
2. Esperar el procesamiento (puede tardar 30-60 segundos)
3. Verificar logs del backend:
   ```
   🔄 Reprocessing project with X input directories...
   🔍 Analyzing gaps in combined context...
   📝 Preserving Y previous answers
   📄 Building PRD vX with preserved answers...
   ✅ Generated insights for vX
   ```
4. Verificar mensaje de éxito:
   ```
   PRD vX generado exitosamente con Y gaps detectados
   ```

### 5. Ver Nueva Versión del PRD

1. Navegar a `/prd/{project_id}`
2. Verificar que el selector de versiones muestra:
   - Versión 2 (actual)
   - Versión 1
3. Seleccionar "Versión 2 (actual)" si no está seleccionada
4. Revisar el contenido del PRD actualizado
5. Buscar cambios relacionados con los nuevos documentos agregados

### 6. Comparar Versiones

1. En PRD Viewer, click en "Comparar Versiones"
2. Configurar comparación:
   - Versión Base: 1
   - Versión Nueva: 2
3. Click en "Comparar"
4. Verificar el resumen de cambios:
   - Secciones agregadas
   - Secciones modificadas
   - Secciones eliminadas
   - Cambios en gaps
5. Revisar detalles de secciones modificadas:
   - Líneas agregadas (verde con +)
   - Líneas eliminadas (rojo con -)
   - Contexto (gris)

### 7. Navegar Entre Versiones

1. En PRD Viewer, usar el selector de versiones
2. Cambiar a "Versión 1"
3. Verificar que el contenido cambia al PRD original
4. Cambiar a "Versión 2 (actual)"
5. Verificar que vuelve al PRD actualizado

### 8. Agregar Tercera Versión (Opcional)

1. Repetir proceso de agregar documentos
2. Debería crear versión 3
3. Reprocesar
4. Comparar v2 vs v3 o v1 vs v3

## Validaciones a Realizar

### Backend

✅ Verificar estructura de archivos:
```
projects/project_XXX/
├── inputs/                    # Archivos originales
├── inputs_v2/                 # Archivos v2
├── outputs/
│   ├── prd_v1.md             # PRD versión 1
│   ├── prd_v2.md             # PRD versión 2
│   └── prd.md                # PRD actual (último)
├── versions/
│   ├── v1_metadata.json
│   ├── v2_metadata.json
│   └── version_history.json
├── context_v2.txt            # Contexto combinado v2
├── analysis_v2.json          # Análisis v2
└── state.json                # Estado actualizado
```

✅ Verificar contenido de `state.json`:
```json
{
  "current_version": 2,
  "version_history": [
    {
      "version": 2,
      "action": "sources_added",
      "timestamp": "...",
      "notes": "...",
      "files_added": [...]
    },
    {
      "version": 2,
      "action": "reprocessed",
      "timestamp": "...",
      "gaps_detected": X,
      "answers_preserved": Y
    }
  ]
}
```

✅ Verificar metadata de versión:
```json
{
  "version": 2,
  "created_at": "...",
  "files_added": ["file1.pdf", "file2.txt"],
  "notes": "...",
  "gaps_detected": X,
  "questions_generated": 0,
  "status": "completed"
}
```

### Frontend

✅ Componentes cargando correctamente:
- AddSourcesModal se abre sin errores
- VersionComparator se abre sin errores
- ActionPanel muestra acciones correctas

✅ Estado de acciones:
- "Agregar Documentos" disponible después de PRD v1
- "Reprocesar Proyecto" disponible después de agregar fuentes
- "Reprocesar Proyecto" deshabilitado si no hay cambios pendientes

✅ Selector de versiones:
- Muestra todas las versiones disponibles
- Marca versión actual con "(actual)"
- Muestra checkmark en versión seleccionada

### API Endpoints

Probar manualmente con curl/Postman:

```bash
# 1. Agregar fuentes
curl -X POST "http://localhost:8000/api/projects/{project_id}/sources" \
  -F "version_notes=Test notes" \
  -F "files=@test.pdf"

# 2. Reprocesar
curl -X POST "http://localhost:8000/api/projects/{project_id}/reprocess"

# 3. Obtener historial de versiones
curl "http://localhost:8000/api/projects/{project_id}/versions"

# 4. Obtener PRD versión específica
curl "http://localhost:8000/api/projects/{project_id}/prd/v/1"

# 5. Comparar versiones
curl -X POST "http://localhost:8000/api/projects/{project_id}/versions/compare" \
  -H "Content-Type: application/json" \
  -d '{"version1": 1, "version2": 2}'
```

## Casos Edge a Probar

1. **Intentar agregar documentos sin PRD v1**
   - Debería mostrar error: "Cannot add sources before first PRD is built"

2. **Intentar reprocesar sin nuevas fuentes**
   - Debería mostrar mensaje apropiado

3. **Archivos no permitidos**
   - Intentar subir .exe, .zip, etc.
   - Debería rechazar con mensaje claro

4. **Preservación de respuestas**
   - Responder preguntas en v1
   - Agregar fuentes y reprocesar
   - Verificar que respuestas se mantienen en v2

5. **Comparar misma versión**
   - Seleccionar v1 vs v1
   - Debería deshabilitar botón o mostrar mensaje

## Resultados Esperados

✅ Sistema completo de versionado funcional
✅ Archivos se guardan en carpetas versionadas
✅ PRDs versionados correctamente
✅ Metadata de versiones completa
✅ Comparación de versiones funcional
✅ Navegación entre versiones fluida
✅ Respuestas de usuario preservadas
✅ UI intuitiva y sin errores
✅ API endpoints funcionando correctamente

## Troubleshooting

### Error: "Project not found"
- Verificar que el project_id es correcto
- Verificar que existe `state.json` en el directorio del proyecto

### Error: "Cannot add sources before first PRD is built"
- Completar flujo inicial: Process Inputs → Analyze Gaps → Build PRD
- Verificar que `state.prd_built = true`

### Error al cargar versiones
- Verificar que existen archivos en `outputs/prd_v{X}.md`
- Verificar metadata en `versions/v{X}_metadata.json`

### Comparación no muestra cambios
- Verificar que las versiones son diferentes
- Verificar logs del backend para errores de parsing

### Frontend no refleja cambios
- Recargar página (F5)
- Verificar que `onStateUpdate()` se llama correctamente
- Verificar console del navegador para errores

## Notas de Desarrollo

- El sistema mantiene retrocompatibilidad con proyectos existentes (sin versionado)
- Los proyectos antiguos tendrán `current_version: 1` por defecto
- Las respuestas de usuario se preservan en `answers.json` con versionado implícito
- El contexto combinado incluye marcadores `=== ADDITIONAL SOURCES ===`
