"""
Unit tests for project API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import get_db, Base
from main import app

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

# Override database dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture
def test_user():
    """Create a test user"""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }


@pytest.fixture
def test_project():
    """Create a test project"""
    return {
        "name": "Test Project",
        "description": "A test project for testing",
        "status": "active"
    }


@pytest.fixture
def auth_headers(test_user):
    """Create authentication headers"""
    # Register user
    client.post("/api/v1/auth/register", json=test_user)
    
    # Login to get token
    login_data = {
        "email": test_user["email"],
        "password": test_user["password"]
    }
    
    response = client.post("/api/v1/auth/login", json=login_data)
    token = response.json()["token"]["access_token"]
    
    return {"Authorization": f"Bearer {token}"}


def test_create_project(auth_headers, test_project):
    """Test project creation"""
    response = client.post("/api/v1/projects", json=test_project, headers=auth_headers)
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == test_project["name"]
    assert data["description"] == test_project["description"]
    assert data["status"] == test_project["status"]
    assert "id" in data
    assert "created_by" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_create_project_unauthenticated(test_project):
    """Test project creation without authentication"""
    response = client.post("/api/v1/projects", json=test_project)
    
    assert response.status_code == 403


def test_create_project_invalid_data(auth_headers):
    """Test project creation with invalid data"""
    invalid_project = {
        "name": "",  # Empty name
        "description": "A test project",
        "status": "invalid_status"  # Invalid status
    }
    
    response = client.post("/api/v1/projects", json=invalid_project, headers=auth_headers)
    
    assert response.status_code == 422  # Validation error


def test_list_projects(auth_headers, test_project):
    """Test listing projects"""
    # Create a project first
    client.post("/api/v1/projects", json=test_project, headers=auth_headers)
    
    response = client.get("/api/v1/projects", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert "projects" in data
    assert "total" in data
    assert "page" in data
    assert "size" in data
    assert len(data["projects"]) == 1
    assert data["projects"][0]["name"] == test_project["name"]


def test_list_projects_unauthenticated(test_project):
    """Test listing projects without authentication"""
    response = client.get("/api/v1/projects")
    
    assert response.status_code == 403


def test_get_project(auth_headers, test_project):
    """Test getting a specific project"""
    # Create a project first
    create_response = client.post("/api/v1/projects", json=test_project, headers=auth_headers)
    project_id = create_response.json()["id"]
    
    response = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == project_id
    assert data["name"] == test_project["name"]
    assert data["description"] == test_project["description"]
    assert data["status"] == test_project["status"]


def test_get_project_not_found(auth_headers):
    """Test getting a non-existent project"""
    response = client.get("/api/v1/projects/999", headers=auth_headers)
    
    assert response.status_code == 404


def test_get_project_unauthenticated(test_project):
    """Test getting a project without authentication"""
    # Create a project first
    client.post("/api/v1/projects", json=test_project)
    
    response = client.get("/api/v1/projects/1")
    
    assert response.status_code == 403


def test_update_project(auth_headers, test_project):
    """Test updating a project"""
    # Create a project first
    create_response = client.post("/api/v1/projects", json=test_project, headers=auth_headers)
    project_id = create_response.json()["id"]
    
    update_data = {
        "name": "Updated Project Name",
        "description": "Updated description",
        "status": "inactive"
    }
    
    response = client.put(f"/api/v1/projects/{project_id}", json=update_data, headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["description"] == update_data["description"]
    assert data["status"] == update_data["status"]


def test_update_project_not_found(auth_headers):
    """Test updating a non-existent project"""
    update_data = {
        "name": "Updated Project Name"
    }
    
    response = client.put("/api/v1/projects/999", json=update_data, headers=auth_headers)
    
    assert response.status_code == 404


def test_update_project_unauthenticated(test_project):
    """Test updating a project without authentication"""
    # Create a project first
    client.post("/api/v1/projects", json=test_project)
    
    update_data = {
        "name": "Updated Project Name"
    }
    
    response = client.put("/api/v1/projects/1", json=update_data)
    
    assert response.status_code == 403


def test_delete_project(auth_headers, test_project):
    """Test deleting a project"""
    # Create a project first
    create_response = client.post("/api/v1/projects", json=test_project, headers=auth_headers)
    project_id = create_response.json()["id"]
    
    response = client.delete(f"/api/v1/projects/{project_id}", headers=auth_headers)
    
    assert response.status_code == 200
    assert response.json()["message"] == "Project deleted successfully"


def test_delete_project_not_found(auth_headers):
    """Test deleting a non-existent project"""
    response = client.delete("/api/v1/projects/999", headers=auth_headers)
    
    assert response.status_code == 404


def test_delete_project_unauthenticated(test_project):
    """Test deleting a project without authentication"""
    # Create a project first
    client.post("/api/v1/projects", json=test_project)
    
    response = client.delete("/api/v1/projects/1")
    
    assert response.status_code == 403


def test_project_pagination(auth_headers, test_project):
    """Test project pagination"""
    # Create multiple projects
    for i in range(5):
        project = test_project.copy()
        project["name"] = f"Project {i}"
        client.post("/api/v1/projects", json=project, headers=auth_headers)
    
    # Test pagination
    response = client.get("/api/v1/projects?skip=0&limit=2", headers=auth_headers)
    data = response.json()
    assert len(data["projects"]) == 2
    assert data["total"] == 5
    assert data["page"] == 1
    assert data["size"] == 2
    
    # Test second page
    response = client.get("/api/v1/projects?skip=2&limit=2", headers=auth_headers)
    data = response.json()
    assert len(data["projects"]) == 2
    assert data["page"] == 2


def test_project_status_filter(auth_headers, test_project):
    """Test project status filtering"""
    # Create projects with different statuses
    active_project = test_project.copy()
    active_project["name"] = "Active Project"
    active_project["status"] = "active"
    
    inactive_project = test_project.copy()
    inactive_project["name"] = "Inactive Project"
    inactive_project["status"] = "inactive"
    
    client.post("/api/v1/projects", json=active_project, headers=auth_headers)
    client.post("/api/v1/projects", json=inactive_project, headers=auth_headers)
    
    # Test filtering by status
    response = client.get("/api/v1/projects?status=active", headers=auth_headers)
    data = response.json()
    assert len(data["projects"]) == 1
    assert data["projects"][0]["status"] == "active"
    assert data["projects"][0]["name"] == "Active Project"