# 🚀 Guía Rápida de Setup

## ✅ Lo que ya está hecho

El proyecto está completamente configurado con:
- ✅ Estructura de directorios (`inputs/`, `outputs/`, `src/`)
- ✅ Entorno virtual Python (`venv/`)
- ✅ Dependencias instaladas (OpenAI, Pandas, PyPDF, etc.)
- ✅ Módulos core implementados
- ✅ Archivo de ejemplo para pruebas

## 🔑 Paso 1: Configurar API Key

1. Copia el archivo de ejemplo:
```bash
cp .env.example .env
```

2. Edita el archivo `.env` y agrega tu API key de OpenAI:
```bash
OPENAI_API_KEY=sk-tu-api-key-aqui
```

> 💡 **Obtén tu API key en:** https://platform.openai.com/api-keys

## 🧪 Paso 2: Probar con el Ejemplo

El proyecto incluye un archivo de ejemplo en `inputs/ejemplo_proyecto.txt` con la descripción de una app de paseadores de perros.

### Ejecutar el script:

```bash
# Activar el entorno virtual
source venv/bin/activate

# Ejecutar el engine
python3 main.py
```

### Salida esperada:

```
╔═══════════════════════════════════════════════════════════╗
║           🚀 HAMAN PROJECTS AI - THE ENGINE 🚀           ║
║        Transformando Ideas en Backlogs Estructurados      ║
╚═══════════════════════════════════════════════════════════╝

✅ Variables de entorno cargadas correctamente
✅ Cliente OpenAI inicializado

📂 Carpeta de inputs: /path/to/inputs
📂 Carpeta de outputs: /path/to/outputs

============================================================
PASO 1: INGESTA DE ARCHIVOS
============================================================
📄 Processing: ejemplo_proyecto.txt
✅ Processed 1 file(s)
✅ Contexto unificado creado (X,XXX caracteres)

============================================================
PASO 2: GENERACIÓN DE BACKLOG CON IA
============================================================
🧠 Enviando contexto a GPT-4o para análisis...
✅ Generados XX tickets
✅ Backlog generado exitosamente

============================================================
PASO 3: EXPORTACIÓN DE RESULTADOS
============================================================
📊 CSV exportado: outputs/jira_backlog_YYYYMMDD_HHMMSS.csv
📄 Resumen ejecutivo generado: outputs/resumen_proyecto_YYYYMMDD_HHMMSS.md
✅ Exportación completada

============================================================
🎉 ¡PROCESO COMPLETADO EXITOSAMENTE!
============================================================
```

## 📁 Archivos Generados

Después de ejecutar, encontrarás en `outputs/`:

1. **`jira_backlog_YYYYMMDD_HHMMSS.csv`**
   - Backlog completo listo para importar a Jira
   - Columnas: Issue Type, Summary, Description, Priority, Story Points

2. **`resumen_proyecto_YYYYMMDD_HHMMSS.md`**
   - Resumen ejecutivo con estadísticas
   - Breakdown de Epics
   - Recomendaciones de sprint planning

## 🎯 Paso 3: Usar con tus Propios Archivos

1. **Limpia la carpeta inputs:**
```bash
rm inputs/ejemplo_proyecto.txt
```

2. **Agrega tus archivos:**
   - PDFs con documentación del cliente
   - Audios de reuniones (mp3, wav, m4a)
   - Notas en texto (txt, md)

3. **Ejecuta nuevamente:**
```bash
python main.py
```

## 📋 Importar a Jira

1. En Jira, ve a **Project Settings** → **Import**
2. Selecciona **CSV**
3. Sube el archivo `jira_backlog_YYYYMMDD_HHMMSS.csv`
4. Mapea las columnas (deberían coincidir automáticamente)
5. ¡Importa y listo! 🎉

## 🔧 Troubleshooting

### Error: "OPENAI_API_KEY not found"
- Verifica que creaste el archivo `.env` (no `.env.example`)
- Asegúrate de que la API key sea válida

### Error: "No supported files found"
- Verifica que los archivos estén en la carpeta `inputs/`
- Formatos soportados: PDF, MP3/WAV/M4A, TXT/MD

### El script se demora mucho
- Normal: Whisper puede tomar 1-2 minutos por audio
- GPT-4o puede tomar 30-60 segundos dependiendo del contexto

## 📞 Soporte

Para preguntas o problemas, contacta al equipo de desarrollo.

---

**¡Listo para generar backlogs automáticamente! 🚀**
