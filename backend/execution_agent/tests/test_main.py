import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from main import app


client = TestClient(app)


def test_health_check():
    """Test health endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_execute_task():
    """Test task execution"""
    task_data = {
        "task_type": "python_test",
        "task_config": {
            "test_file": "test_example.py",
            "timeout": 30
        }
    }
    response = client.post("/execute", json=task_data)
    assert response.status_code == 200
    assert "task_id" in response.json()


def test_get_task_status():
    """Test getting task status"""
    # First create a task
    task_data = {
        "task_type": "python_test",
        "task_config": {"test_file": "test_example.py"}
    }
    create_response = client.post("/execute", json=task_data)
    task_id = create_response.json()["task_id"]
    
    # Then get its status
    status_response = client.get(f"/tasks/{task_id}/status")
    assert status_response.status_code == 200
    assert "status" in status_response.json()


def test_cancel_task():
    """Test canceling a task"""
    # First create a task
    task_data = {
        "task_type": "python_test",
        "task_config": {"test_file": "test_example.py"}
    }
    create_response = client.post("/execute", json=task_data)
    task_id = create_response.json()["task_id"]
    
    # Then cancel it
    cancel_response = client.post(f"/tasks/{task_id}/cancel")
    assert cancel_response.status_code == 200


def test_get_task_logs():
    """Test getting task logs"""
    # First create a task
    task_data = {
        "task_type": "python_test",
        "task_config": {"test_file": "test_example.py"}
    }
    create_response = client.post("/execute", json=task_data)
    task_id = create_response.json()["task_id"]
    
    # Then get its logs
    logs_response = client.get(f"/tasks/{task_id}/logs")
    assert logs_response.status_code == 200
    assert "logs" in logs_response.json()