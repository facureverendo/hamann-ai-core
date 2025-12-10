# Hamann Projects AI - API

FastAPI backend for Hamann Projects AI.

## Setup

1. Create virtual environment (if not already created):
```bash
python3 -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Ensure `.env` file exists with `OPENAI_API_KEY`:
```bash
OPENAI_API_KEY=your-key-here
```

4. Run the server:
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints

- `GET /api/projects` - List all projects
- `GET /api/projects/{id}` - Get project details
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}/prd` - Get PRD
- `GET /api/projects/{id}/backlog` - Get backlog
- `GET /api/projects/{id}/risks` - Get risks
- `GET /api/projects/{id}/timeline` - Get timeline
- `GET /api/projects/{id}/meetings` - Get meetings
- `POST /api/ai/chat` - Chat with AI

