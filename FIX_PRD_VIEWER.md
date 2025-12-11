# Fix: PRD Viewer Muestra Datos Correctos

## Problema Resuelto

El endpoint `/api/prd/{project_id}` estaba:
1. ❌ Buscando el PRD en la ubicación incorrecta
2. ❌ Retornando datos hardcodeados ("Knowledge Discovery Feature PRD")
3. ❌ No parseando correctamente el markdown

## Solución Implementada

### Backend - `api/routes/prd.py`

#### Cambios Realizados

1. **Ruta correcta del PRD**:
```python
# Antes:
PROJECTS_DIR = Path(__file__).parent.parent.parent / "outputs"
prd_file = PROJECTS_DIR / f"prd_{project_id}.md"

# Ahora:
PROJECTS_DIR = Path(__file__).parent.parent.parent / "projects"
prd_file = PROJECTS_DIR / project_id / "outputs" / "prd.md"
```

2. **Sin datos fallback hardcodeados**:
```python
# Antes: Retornaba "Knowledge Discovery Feature PRD" si no encontraba el archivo

# Ahora: Retorna 404 con mensaje claro
if not prd_file.exists():
    raise HTTPException(
        status_code=404,
        detail=f"PRD not found for project {project_id}. Please build the PRD first."
    )
```

3. **Mejor parsing del markdown**:
```python
# Extrae el título de la primera línea (# Title)
if lines and lines[0].startswith("# "):
    title = lines[0][2:].strip()

# Parsea secciones (## Section) correctamente
for line in lines[1:]:
    if line.startswith("## "):
        # Nueva sección
        current_section = line[3:].strip()
        # ...
```

4. **Timestamp real del archivo**:
```python
mtime = os.path.getmtime(prd_file)
updated_at = datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S")
```

### Frontend - `PRDViewer.tsx`

#### Mejoras Realizadas

1. **Manejo de errores**:
```typescript
.catch((err) => {
  console.error('Error loading PRD:', err)
  setLoading(false)
  setPrd({ error: err?.response?.data?.detail || 'Error loading PRD' })
})
```

2. **Mensaje útil cuando no existe el PRD**:
```typescript
{prd?.error ? (
  <div className="text-center">
    <div className="text-red-400 mb-4">{prd.error}</div>
    <p className="text-gray-400 text-sm">
      El PRD aún no ha sido generado. Por favor, completa los pasos previos:
    </p>
    <ol className="text-gray-400 text-sm text-left mt-4 space-y-2 max-w-md mx-auto">
      <li>1. Procesar Archivos</li>
      <li>2. Analizar Gaps</li>
      <li>3. Generar Preguntas (opcional pero recomendado)</li>
      <li>4. Construir PRD</li>
    </ol>
  </div>
) : ...
```

3. **Mejor renderizado del contenido**:
```typescript
<pre className="whitespace-pre-wrap font-sans text-sm">
  {section.content}
</pre>
```

4. **Eliminadas secciones por defecto hardcodeadas**

## ⚠️ IMPORTANTE: Reiniciar Backend

Para que los cambios surtan efecto, necesitas **reiniciar el backend**:

### Opción 1: Reinicio Manual

```bash
# Detener el backend actual (Ctrl+C en la terminal)
# Luego reiniciar:
cd api
python3 main.py
```

### Opción 2: Usar Auto-reload (Recomendado)

Si usas `uvicorn` con `--reload`, debería recargar automáticamente:

```bash
cd api
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Verificación

Después de reiniciar el backend:

1. **Verificar endpoint**:
```bash
curl http://localhost:8000/api/prd/project_20251210_204253 | jq .title
```

Debería mostrar:
```
"KB Analytics - Data Export : RM #31753"
```

2. **Abrir en UI**:
- Navegar al proyecto
- Hacer clic en "Ver Resultado" en "Construir PRD"
- O navegar directamente a `/prd/project_20251210_204253`

Deberías ver:
- ✅ Título correcto del proyecto
- ✅ Todas las secciones del PRD generado
- ✅ Contenido completo con las respuestas del usuario
- ✅ Fecha de última actualización correcta

## Resultado Esperado

```json
{
  "id": "project_20251210_204253",
  "title": "KB Analytics - Data Export : RM #31753",
  "sections": [
    {
      "id": "table-of-contents",
      "title": "Table of Contents",
      "content": "...",
      "expanded": true
    },
    {
      "id": "1.-business-context-brief",
      "title": "1. Business Context Brief",
      "content": "...",
      "expanded": true
    },
    // ... 14 más secciones
  ],
  "version": "1.0",
  "updated_at": "2025-12-10 21:43:05"
}
```

## Archivos Modificados

- ✅ `api/routes/prd.py` - Corregida ruta y parsing
- ✅ `frontend/src/pages/PRDViewer.tsx` - Mejor manejo de errores y UI

## Beneficios

1. **Título correcto**: Muestra el nombre real del proyecto
2. **Contenido real**: Muestra el PRD generado, no datos de ejemplo
3. **Navegación**: Todas las secciones son expandibles/colapsables
4. **Feedback claro**: Mensajes útiles si el PRD no existe todavía
5. **Timestamp real**: Muestra cuándo fue generado el PRD

## Estado

✅ **CÓDIGO IMPLEMENTADO**
⚠️ **REQUIERE REINICIO DEL BACKEND**

**Fecha**: 2025-12-10
