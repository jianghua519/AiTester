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


def test_generate_test_plan():
    """Test test plan generation"""
    request_data = {
        "feature_description": "User authentication system",
        "testing_scope": "unit, integration",
        "priority": "high"
    }
    response = client.post("/generate-plan", json=request_data)
    assert response.status_code == 200
    assert "test_plan" in response.json()


def test_analyze_test_results():
    """Test test result analysis"""
    results_data = {
        "test_results": [
            {
                "test_name": "test_login",
                "status": "passed",
                "duration": 1.2
            },
            {
                "test_name": "test_registration",
                "status": "failed",
                "duration": 2.1,
                "error": "AssertionError"
            }
        ]
    }
    response = client.post("/analyze-results", json=results_data)
    assert response.status_code == 200
    assert "analysis" in response.json()


def test_get_test_recommendations():
    """Test getting AI-powered test recommendations"""
    response = client.get("/recommendations")
    assert response.status_code == 200
    assert "recommendations" in response.json()


def test_optimize_test_suite():
    """Test test suite optimization"""
    optimization_data = {
        "current_tests": ["test_login", "test_registration", "test_profile"],
        "code_changes": ["Added password reset functionality"]
    }
    response = client.post("/optimize-suite", json=optimization_data)
    assert response.status_code == 200
    assert "optimized_suite" in response.json()