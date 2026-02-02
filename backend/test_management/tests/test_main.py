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


def test_create_test_case():
    """Test creating a test case"""
    test_data = {
        "name": "Test Case 1",
        "description": "Sample test case",
        "type": "unit"
    }
    response = client.post("/test-cases", json=test_data)
    assert response.status_code == 201
    assert response.json()["name"] == "Test Case 1"


def test_get_test_cases():
    """Test retrieving test cases"""
    response = client.get("/test-cases")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_delete_test_case():
    """Test deleting a test case"""
    # First create a test case
    test_data = {
        "name": "Test Case to Delete",
        "description": "This will be deleted",
        "type": "integration"
    }
    create_response = client.post("/test-cases", json=test_data)
    test_case_id = create_response.json()["id"]
    
    # Then delete it
    delete_response = client.delete(f"/test-cases/{test_case_id}")
    assert delete_response.status_code == 200


def test_update_test_case():
    """Test updating a test case"""
    # First create a test case
    test_data = {
        "name": "Original Name",
        "description": "Original description",
        "type": "unit"
    }
    create_response = client.post("/test-cases", json=test_data)
    test_case_id = create_response.json()["id"]
    
    # Then update it
    update_data = {
        "name": "Updated Name",
        "description": "Updated description",
        "type": "integration"
    }
    update_response = client.put(f"/test-cases/{test_case_id}", json=update_data)
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Updated Name"