# Fix: Sistema de Caché para Preguntas Interactivas

## Problema Original

Cada vez que el usuario abría el modal de "Generar Preguntas" (incluyendo "Ver Resultado"), el sistema:
1. ❌ Re-analizaba todo el contexto con OpenAI
2. ❌ Generaba preguntas nuevas (llamada costosa a API)
3. ❌ Creaba preguntas duplicadas
4. ❌ Era lento y costoso en términos de uso de API

**Resultado**: Cada apertura del modal = $0.01-0.05 en costos de API + 5-10 segundos de espera

## Solución Implementada

### Sistema de Caché de Preguntas

Ahora el sistema implementa un caché inteligente que:
1. ✅ Genera preguntas SOLO la primera vez
2. ✅ Las guarda en `questions_cache.json`
3. ✅ Las reutiliza en aperturas subsiguientes (sin API calls)
4. ✅ Regenera SOLO cuando el usuario lo pide explícitamente

### Flujo Optimizado

```
1. Usuario abre "Generar Preguntas"
   ├─> ¿Existe questions_cache.json?
   │   ├─> SÍ: Cargar desde caché (< 100ms, sin costo)
   │   └─> NO: Generar con OpenAI (5-10s, ~$0.02)
   │
2. Usuario responde preguntas
   └─> Respuestas guardadas en answers.json
   
3. Usuario hace clic en "Re-analizar"
   └─> Fuerza regeneración con respuestas previas
       └─> Genera nuevas preguntas basadas en respuestas
           └─> Actualiza questions_cache.json
```

## Cambios Técnicos

### Backend

#### 1. Nuevo método `get_cached_questions()` en `project_processor.py`
```python
def get_cached_questions(self, project_id: str) -> Dict:
    """Get cached questions without re-generating"""
    # Lee questions_cache.json si existe
    # Retorna preguntas sin llamar a OpenAI
```

#### 2. Modificado `start_interactive_session()` en `project_processor.py`
```python
def start_interactive_session(self, project_id: str, max_questions: int = 15, force_regenerate: bool = False) -> Dict:
    """Start or resume an interactive questions session"""
    
    # NUEVO: Chequea caché primero
    if not force_regenerate and questions_cache_file.exists():
        print("📦 Using cached questions (no API call)")
        return self.get_cached_questions(project_id)
    
    # Solo si no hay caché o force_regenerate=True
    print("🔄 Generating new questions (API call to OpenAI)")
    # ... genera y cachea preguntas
```

#### 3. Estructura del archivo `questions_cache.json`
```json
{
  "questions_by_priority": {
    "critical": [...],
    "important": [...],
    "optional": [...]
  },
  "total_count": 5,
  "generated_at": "2025-12-10T21:15:00.000000"
}
```

#### 4. Modificados endpoints en `projects.py`
```python
# GET /interactive-questions/session
# Ahora usa force_regenerate=False por defecto

# POST /interactive-questions/regenerate
# Usa force_regenerate=True explícitamente
```

### Frontend

#### Modificado `InteractiveQuestions.tsx`
- Agregado logging para indicar cuando usa caché vs API
- Mensajes en consola del navegador:
  - "📦 Usando preguntas en caché (sin costo de API)"
  - "🔄 Preguntas generadas con API"

## Tests de Validación

### Test 1: Primera Carga
```
🔄 Generating new questions (API call to OpenAI)
Result: cached: False, questions: 5
✅ PASS - Genera y cachea preguntas
```

### Test 2: Segunda Carga (Same Session)
```
📦 Using cached questions (no API call)
Result: cached: True, questions: 5
✅ PASS - Usa caché sin API call
```

### Test 3: Regeneración Forzada
```
🔄 Generating new questions (API call to OpenAI)
Result: cached: False, questions: 5
✅ PASS - Regenera solo cuando se pide explícitamente
```

## Beneficios

### 💰 Ahorro de Costos
- **Antes**: Cada apertura = $0.01-0.05
- **Ahora**: Primera apertura = $0.02, siguientes = $0.00
- **Ahorro estimado**: 80-95% en costos de API

### ⚡ Mejora de Performance
- **Antes**: 5-10 segundos cada vez
- **Ahora**: Primera vez = 5-10s, siguientes < 100ms
- **Mejora**: 50-100x más rápido en cargas subsiguientes

### 🎯 Experiencia de Usuario
- ✅ No más duplicados
- ✅ Carga instantánea al volver al modal
- ✅ Control explícito de cuándo regenerar

## Uso Recomendado

### Para el Usuario

1. **Primera vez**: 
   - Haz clic en "Generar Preguntas"
   - Espera 5-10 segundos (se generan preguntas)
   - Responde algunas preguntas

2. **Siguientes veces**:
   - Haz clic en "Ver Resultado" o vuelve a abrir
   - Carga instantánea de preguntas existentes
   - Continúa respondiendo

3. **Cuando responder varias preguntas**:
   - Haz clic en "Re-analizar"
   - El sistema toma tus respuestas previas
   - Genera nuevas preguntas basadas en esa información

## Limpieza Manual (si es necesario)

Si tienes preguntas duplicadas o quieres empezar de cero:

```bash
# Limpiar caché de preguntas
rm projects/project_XXXX/questions_cache.json

# Limpiar respuestas también (opcional)
rm projects/project_XXXX/answers.json
```

La próxima vez que abras el modal, se generarán preguntas frescas.

## Archivos Modificados

### Backend
- ✅ `api/services/project_processor.py`
  - Nuevo: `get_cached_questions()`
  - Modificado: `start_interactive_session()` (agregado parámetro `force_regenerate`)
- ✅ `api/routes/projects.py`
  - Modificado: endpoint `/session` (usa caché)
  - Modificado: endpoint `/regenerate` (fuerza regeneración)

### Frontend
- ✅ `frontend/src/components/project/InteractiveQuestions.tsx`
  - Agregado logging de caché
  - Mejor feedback al usuario

### Nuevos Archivos de Datos
- ✅ `projects/{id}/questions_cache.json` (nuevo)
  - Almacena preguntas generadas
  - Se actualiza solo en regeneración

## Notas Técnicas

1. **Persistencia**: El caché se mantiene entre sesiones del servidor
2. **Invalidación**: Se invalida automáticamente al hacer "Re-analizar"
3. **Sincronización**: answers.json y questions_cache.json son independientes
4. **Limpieza**: No hay TTL automático, el caché persiste hasta regeneración manual

## Conclusión

Este fix soluciona completamente el problema de costos y duplicados, mejorando significativamente la experiencia del usuario y reduciendo los costos de API en ~90%.

**Estado**: ✅ **IMPLEMENTADO Y TESTEADO**
**Fecha**: 2025-12-10
