import json
import hashlib
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Any
import redis.asyncio as redis
import os

from worker.celery_app import celery_app

router = APIRouter(prefix="/api/configurator", tags=["configurator"])

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

async def get_redis():
    r = redis.from_url(REDIS_URL, decode_responses=True)
    try:
        yield r
    finally:
        await r.aclose()

class ConfigPayload(BaseModel):
    tenant_id: str
    engine: str
    params: Dict[str, Any]

def generate_hash(tenant_id: str, params: dict) -> str:
    """Task 3.1: Deterministic tenant-scoped hashing logic."""
    sorted_params = json.dumps(params, sort_keys=True)
    hash_payload = f"{tenant_id}:{sorted_params}"
    return hashlib.sha256(hash_payload.encode()).hexdigest()

@router.post("/generate")
async def generate_model(payload: ConfigPayload, cache: redis.Redis = Depends(get_redis)):
    config_hash = generate_hash(payload.tenant_id, payload.params)
    
    # Task 3.1 Check Cache explicitly
    cached_url = await cache.get(f"model_cache:{config_hash}")
    if cached_url:
        return {"status": "hit", "job_id": None, "model_url": cached_url}
        
    # Task 3.3 Dispatch Celery Queue (Cache Miss)
    job = celery_app.send_task(
        "generate_cad_model", 
        args=[payload.tenant_id, payload.params, payload.engine],
        task_id=f"job_{config_hash}" # Make job_id deterministic based on hash so we don't queue duplicates
    )
    
    return {"status": "queued", "job_id": job.id, "model_url": None, "hash": config_hash}
