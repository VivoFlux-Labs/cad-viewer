import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_model_api():
    response = client.get("/api/models/11111111-1111-1111-1111-111111111111")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "11111111-1111-1111-1111-111111111111"
    assert data["tenant_id"] == "tenant-0000"
    assert data["model_url"] == "/storage/models/tenant-0000/models/test.glb"

def test_get_model_not_found():
    response = client.get("/api/models/invalid-uuid")
    assert response.status_code == 404
