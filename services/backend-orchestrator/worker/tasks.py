import time
from worker.celery_app import celery_app

@celery_app.task(bind=True, name="generate_cad_model")
def generate_cad_model(self, tenant_id: str, payload: dict, engine: str):
    """
    Simulates the CAD generation loop. 
    Phase 1 MVP: Sleep 2s, print, return dummy URL.
    """
    job_id = self.request.id or "test-job-id"
    print(f"[{job_id}] Starting CAD generation for Tenant: {tenant_id} Engine: {engine}")
    
    # Simulate heavy CAD blocking computation (FreeCAD / CadQuery)
    time.sleep(2.0)
    
    # Simulate StorageProvider upload
    simulated_url = f"/storage/models/{tenant_id}/models/generated-{job_id}.glb"
    
    print(f"[{job_id}] CAD generation complete. Uploaded to {simulated_url}")
    
    return {
        "status": "success",
        "job_id": job_id,
        "model_url": simulated_url
    }
