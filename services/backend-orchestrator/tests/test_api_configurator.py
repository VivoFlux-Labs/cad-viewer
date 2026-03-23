import pytest
from fastapi.testclient import TestClient
from main import app
from backend.api.configurator import generate_hash, get_redis

client = TestClient(app)

def test_deterministic_hashing():
    # Test Task 3.1: Hashing must be alphabetized and tenant-scoped
    hash1 = generate_hash("tenant-1", {"width": 50, "height": 100})
    hash2 = generate_hash("tenant-1", {"height": 100, "width": 50})
    hash3 = generate_hash("tenant-2", {"width": 50, "height": 100})
    
    assert hash1 == hash2 # Alphabetization ensures identical hashes regardless of dict order
    assert hash1 != hash3 # Tenant scoped boundary

def test_cache_miss_queues_job(monkeypatch):
    # Mock Redis Dependency
    async def mock_get(*args, **kwargs):
        return None
        
    class MockRedis:
        get = mock_get
        async def aclose(self): pass
        
    async def override_get_redis():
        yield MockRedis()
        
    app.dependency_overrides[get_redis] = override_get_redis

    # Mock Celery send_task
    class MockJob:
        id = "mock-celery-task-id"
        
    def mock_send_task(*args, **kwargs):
        return MockJob()
        
    monkeypatch.setattr("backend.api.configurator.celery_app.send_task", mock_send_task)

    payload = {
        "tenant_id": "tenant-0000",
        "engine": "freecad",
        "params": {"radius": 15}
    }
    
    response = client.post("/api/configurator/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "queued"
    assert data["job_id"] == "mock-celery-task-id"
    
    app.dependency_overrides.clear()
