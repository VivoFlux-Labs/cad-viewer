import pytest
import os
from backend.storage.provider import get_storage_provider

@pytest.fixture
def mock_file():
    filepath = "test_model.glb"
    with open(filepath, "wb") as f:
        f.write(b"mock_binary_data")
    yield filepath
    if os.path.exists(filepath):
        os.remove(filepath)

def test_local_storage_provider(mock_file):
    # Setup env
    os.environ["STORAGE_PROVIDER"] = "local"
    
    # Initialize
    provider = get_storage_provider()
    
    # Execute upload
    dest_path = "tenant-0000/models/test.glb"
    url = provider.upload(mock_file, dest_path)
    
    # Assert
    assert url == "/storage/models/tenant-0000/models/test.glb"
    assert provider.get_url(dest_path) == url
