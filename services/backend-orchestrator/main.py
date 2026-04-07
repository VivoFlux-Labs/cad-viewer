import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from backend.api.models import router as models_router
from backend.api.configurator import router as configurator_router

app = FastAPI(title="Configurator Orchestrator", version="1.0.0")

# Mount MVP Local Storage
storage_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage/models"))
os.makedirs(storage_dir, exist_ok=True)
app.mount("/storage/models", StaticFiles(directory=storage_dir), name="storage")

app.include_router(models_router)
app.include_router(configurator_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
