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


def test_service_discovery():
    """Test service discovery registration"""
    service_data = {
        "service_name": "auth_service",
        "service_url": "http://auth-service:8080",
        "service_type": "authentication"
    }
    response = client.post("/register-service", json=service_data)
    assert response.status_code == 201
    assert response.json()["service_name"] == "auth_service"


def test_get_service_registry():
    """Test getting service registry"""
    response = client.get("/services")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_service_health_check():
    """Test service health monitoring"""
    response = client.get("/services/auth_service/health")
    assert response.status_code == 200
    assert "status" in response.json()


def test_service_communication():
    """Test inter-service communication"""
    communication_data = {
        "source_service": "execution_agent",
        "target_service": "auth_service",
        "request_data": {"action": "validate_token"}
    }
    response = client.post("/communicate", json=communication_data)
    assert response.status_code == 200
    assert "response" in response.json()


def test_circuit_breaker():
    """Test circuit breaker functionality"""
    # Simulate service failure
    response = client.post("/trigger-failure", json={"service": "unavailable_service"})
    assert response.status_code == 503
    
    # Check if circuit breaker is activated
    status_response = client.get("/circuit-breaker/status")
    assert status_response.status_code == 200
    assert "circuit_breaker" in status_response.json()