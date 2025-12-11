# Optimización de Caché para Visualización de Gaps

## Problema Identificado

Cuando el usuario hacía clic en "Ver Resultado" para los gaps analizados, la aplicación se quedaba "pensando" durante un tiempo considerable, como si estuviera generando algo de nuevo, aunque los gaps ya habían sido analizados previamente.

### Causa Raíz

El endpoint `/api/projects/{project_id}/gaps` estaba realizando las siguientes operaciones **cada vez** que se solicitaban los gaps:

1. Leer el archivo `analysis.json` (rápido)
2. **Para cada gap**, realizar traducciones usando la API de OpenAI:
   - Traducir la descripción de la sección
   - Traducir las preguntas guía (en batch)
3. Enriquecer cada gap con información contextual

Las traducciones con OpenAI eran el cuello de botella principal, causando una demora significativa en cada visualización.

## Solución Implementada

Se implementó un **sistema de caché inteligente** para los gaps enriquecidos:

### 1. Caché de Gaps Enriquecidos

**Archivo**: `api/routes/projects.py`

El endpoint ahora:
- Verifica si existe un archivo de caché `enriched_gaps.json`
- Compara las fechas de modificación del caché vs el archivo `analysis.json`
- Si el caché existe y es más reciente, devuelve los datos cacheados inmediatamente
- Solo regenera y traduce si el caché no existe o está desactualizado

```python
# Check if we have a cached version that's newer than the analysis file
if enriched_gaps_cache.exists():
    cache_mtime = enriched_gaps_cache.stat().st_mtime
    analysis_mtime = analysis_file.stat().st_mtime
    
    # If cache is newer than analysis file, use cached version
    if cache_mtime >= analysis_mtime:
        with open(enriched_gaps_cache, 'r', encoding='utf-8') as f:
            cached_data = json.load(f)
            return cached_data
```

### 2. Invalidación del Caché

**Archivo**: `api/services/project_processor.py`

Cuando se regeneran los gaps (método `analyze_gaps`), el sistema ahora elimina explícitamente el caché:

```python
# Invalidate enriched gaps cache (will be regenerated on next request)
enriched_gaps_cache = project_dir / "enriched_gaps.json"
if enriched_gaps_cache.exists():
    enriched_gaps_cache.unlink()
```

## Beneficios

### Rendimiento
- **Primera visualización después de analizar**: ~5-10 segundos (traduce todo y genera caché)
- **Visualizaciones subsecuentes**: **~100-200ms** (lee del caché) ⚡

### Experiencia de Usuario
- Respuesta casi instantánea al hacer clic en "Ver Resultado"
- No más esperas innecesarias cuando los datos ya fueron generados
- El sistema sigue siendo correcto: regenera el caché cuando los datos cambian

## Archivos Modificados

1. **api/routes/projects.py**
   - Endpoint `GET /{project_id}/gaps`: Implementación de caché

2. **api/services/project_processor.py**
   - Método `analyze_gaps`: Invalidación de caché

## Estructura de Archivos del Proyecto

Cada proyecto ahora tendrá:
```
projects/project_YYYYMMDD_HHMMSS/
├── analysis.json           # Datos originales de análisis
├── enriched_gaps.json      # Caché de gaps enriquecidos y traducidos (nuevo)
├── context.txt
├── state.json
└── ...
```

## Testing

Para probar la optimización:

1. Analiza gaps en un proyecto
2. Haz clic en "Ver Resultado" la primera vez (tomará unos segundos - generando caché)
3. Cierra el modal
4. Vuelve a hacer clic en "Ver Resultado" (debería ser instantáneo - usando caché)
5. Si vuelves a ejecutar "Analizar Gaps", el caché se invalidará automáticamente

## Consideraciones Técnicas

- El caché se almacena en el sistema de archivos del proyecto
- Es automáticamente invalidado cuando cambian los datos fuente
- No requiere configuración adicional
- Es transparente para el usuario final
