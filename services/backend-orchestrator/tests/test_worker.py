import pytest
from worker.tasks import generate_cad_model

def test_generate_cad_model_sync():
    """Test the celery task synchronously using .apply() to bypass the MQ."""
    # .apply() runs the task blockingly in the current process
    result = generate_cad_model.apply(args=("tenant-0000", {"width": 50}, "freecad"))
    
    assert result.successful()
    data = result.result
    assert data["status"] == "success"
    assert "generated-" in data["model_url"]
    assert "test-job-id" not in data["model_url"] # Because .apply() generates a real UUID for request.id
