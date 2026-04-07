import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.storage.provider import get_storage_provider, StorageProvider

router = APIRouter(prefix="/api/models", tags=["models"])

class ModelResponse(BaseModel):
    id: str
    name: str
    tenant_id: str
    engine: str
    schema_params: dict
    model_url: str

@router.get("/{model_id}", response_model=ModelResponse)
async def get_model(model_id: str, provider: StorageProvider = Depends(get_storage_provider)):
    # MVP Phase 1: Hardcoded lookup for Tenant Zero model. 
    # Phase 2: This will be replaced with SQLAlchemy `db.query(Model)` + native RLS protection.
    if model_id == "11111111-1111-1111-1111-111111111111":
        # Phase 1: Local URL string returned. Phase 2: Dynamic Signed CDN URL returned.
        path = "tenant-0000/models/test.glb"
        return ModelResponse(
            id=model_id,
            name="Granite Monument MVP",
            tenant_id="tenant-0000",
            engine="freecad",
            schema_params={"type": "object", "properties": {"width": {"type": "number", "minimum": 10, "maximum": 60}}},
            model_url=provider.get_url(path)
        )
    raise HTTPException(status_code=404, detail="Model not found")
