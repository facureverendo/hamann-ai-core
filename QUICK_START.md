# 🚀 Guía de Inicio Rápido - Hamann Projects AI

## Estado del Sistema

✅ **Frontend**: Listo y corriendo  
✅ **Backend API**: Listo y corriendo

## Accesos

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc

## Comandos Útiles

### Iniciar Frontend
```bash
cd frontend
npm run dev
```

### Iniciar Backend API
```bash
cd api
python3 main.py
```

O con uvicorn directamente:
```bash
cd api
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Verificar que todo funciona
```bash
# Health check
curl http://localhost:8000/api/health

# Listar proyectos
curl http://localhost:8000/api/projects/
```

## Notas Importantes

1. **Python**: En este sistema usa `python3` en lugar de `python`
2. **Node.js**: Los warnings sobre la versión son menores y no afectan funcionalidad
3. **Variables de entorno**: 
   - Backend necesita `.env` con `OPENAI_API_KEY`
   - Frontend puede usar `.env` con `VITE_API_URL` (opcional, por defecto usa localhost:8000)

## Estructura de URLs

### Frontend Routes
- `/` - Dashboard
- `/projects/:id` - Project Overview
- `/prd/:id` - PRD Viewer
- `/meetings/:id` - Meeting Summary
- `/timeline/:id` - AI Timeline
- `/risks/:id` - Risk Radar
- `/assistant` - AI Assistant
- `/settings` - Settings

### API Endpoints
- `GET /api/projects` - Listar proyectos
- `GET /api/projects/{id}` - Detalles de proyecto
- `GET /api/projects/{id}/prd` - PRD del proyecto
- `GET /api/projects/{id}/backlog` - Backlog
- `GET /api/projects/{id}/risks` - Riesgos
- `GET /api/projects/{id}/timeline` - Timeline
- `GET /api/projects/{id}/meetings` - Reuniones
- `POST /api/ai/chat` - Chat con IA

## Solución de Problemas

### El frontend no se conecta al backend
- Verifica que el backend esté corriendo en el puerto 8000
- Revisa la consola del navegador para errores CORS
- Verifica que `VITE_API_URL` en `.env` apunte a `http://localhost:8000`

### Error "python not found"
- Usa `python3` en lugar de `python`
- O crea un alias: `alias python=python3`

### El servidor no inicia
- Verifica que las dependencias estén instaladas
- Revisa que el puerto 8000 no esté en uso
- Verifica los logs de error en la terminal

