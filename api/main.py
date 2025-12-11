"""
FastAPI Backend for Hamann Projects AI
Exposes REST endpoints for frontend integration
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import sys
from pathlib import Path

# Add parent directory to path to import src modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from routes import projects, prd, ai, insights

app = FastAPI(title="Hamann Projects AI API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(prd.router, prefix="/api/prd", tags=["prd"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(insights.router, prefix="/api/projects", tags=["insights"])


@app.get("/")
async def root():
    return {"message": "Hamann Projects AI API", "status": "running"}


@app.get("/api/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

