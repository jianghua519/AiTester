"""
Unit tests for test case API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import get_db, Base
from main import app

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_cases_test.db"
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
def test_test_case():
    """Create a test test case"""
    return {
        "title": "Test Login Functionality",
        "description": "Test user login with valid credentials",
        "status": "active",
        "priority": "high",
        "type": "functional",
        "preconditions": "User exists and is active",
        "steps": [
            "Open login page",
            "Enter valid username",
            "Enter valid password",
            "Click login button"
        ],
        "expected_results": [
            "User is redirected to dashboard",
            "Login success message is displayed"
        ],
        "estimated_duration": 10,
        "tags": ["login", "authentication", "ui"]
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


@pytest.fixture
def project_with_auth(test_project, auth_headers):
    """Create a project and return project ID with auth headers"""
    response = client.post("/api/v1/projects", json=test_project, headers=auth_headers)
    project_id = response.json()["id"]
    return project_id, auth_headers


class TestTestCaseCreation:
    """Test test case creation endpoints"""
    
    def test_create_test_case(self, project_with_auth, test_test_case):
        """Test test case creation"""
        project_id, auth_headers = project_with_auth
        
        response = client.post(f"/api/v1/projects/{project_id}/testcases", 
                             json=test_test_case, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == test_test_case["title"]
        assert data["description"] == test_test_case["description"]
        assert data["status"] == test_test_case["status"]
        assert data["priority"] == test_test_case["priority"]
        assert data["type"] == test_test_case["type"]
        assert data["preconditions"] == test_test_case["preconditions"]
        assert data["estimated_duration"] == test_test_case["estimated_duration"]
        assert "id" in data
        assert "project_id" in data
        assert "created_by" in data
        assert "created_at" in data
        assert "updated_at" in data
    
    def test_create_test_case_unauthenticated(self, project_with_auth, test_test_case):
        """Test test case creation without authentication"""
        project_id, _ = project_with_auth
        
        response = client.post(f"/api/v1/projects/{project_id}/testcases", 
                             json=test_test_case)
        
        assert response.status_code == 403
    
    def test_create_test_case_invalid_data(self, project_with_auth):
        """Test test case creation with invalid data"""
        project_id, auth_headers = project_with_auth
        
        invalid_test_case = {
            "title": "",  # Empty title
            "description": "Test description",
            "status": "invalid_status",  # Invalid status
            "priority": "invalid_priority",  # Invalid priority
            "type": "invalid_type",  # Invalid type
            "steps": ["Step 1", "Step 2"] * 30,  # Too many steps
            "expected_results": ["Result 1", "Result 2"] * 30,  # Too many results
            "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", 
                    "tag7", "tag8", "tag9", "tag10", "tag11", "tag12", 
                    "tag13", "tag14", "tag15", "tag16", "tag17", "tag18", 
                    "tag19", "tag20", "tag21"]  # Too many tags
        }
        
        response = client.post(f"/api/v1/projects/{project_id}/testcases", 
                             json=invalid_test_case, headers=auth_headers)
        
        assert response.status_code == 422  # Validation error
    
    def test_create_test_case_nonexistent_project(self, auth_headers, test_test_case):
        """Test test case creation for non-existent project"""
        response = client.post("/api/v1/projects/999/testcases", 
                             json=test_test_case, headers=auth_headers)
        
        assert response.status_code == 400  # Bad request (project not found)


class TestTestCaseRetrieval:
    """Test test case retrieval endpoints"""
    
    def test_get_test_case(self, project_with_auth, test_test_case):
        """Test getting a specific test case"""
        project_id, auth_headers = project_with_auth
        
        # Create test case first
        create_response = client.post(f"/api/v1/projects/{project_id}/testcases", 
                                     json=test_test_case, headers=auth_headers)
        case_id = create_response.json()["id"]
        
        response = client.get(f"/api/v1/testcases/{case_id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == case_id
        assert data["title"] == test_test_case["title"]
        assert data["description"] == test_test_case["description"]
    
    def test_get_test_case_not_found(self, auth_headers):
        """Test getting a non-existent test case"""
        response = client.get("/api/v1/testcases/999", headers=auth_headers)
        
        assert response.status_code == 404
    
    def test_get_test_case_unauthenticated(self, project_with_auth, test_test_case):
        """Test getting a test case without authentication"""
        project_id, _ = project_with_auth
        
        # Create test case first
        create_response = client.post(f"/api/v1/projects/{project_id}/testcases", 
                                     json=test_test_case)
        
        case_id = create_response.json()["id"]
        
        response = client.get(f"/api/v1/testcases/{case_id}")
        
        assert response.status_code == 403
    
    def test_list_test_cases(self, project_with_auth, test_test_case):
        """Test listing test cases for a project"""
        project_id, auth_headers = project_with_auth
        
        # Create multiple test cases
        for i in range(3):
            test_case = test_test_case.copy()
            test_case["title"] = f"Test Case {i}"
            client.post(f"/api/v1/projects/{project_id}/testcases", 
                       json=test_case, headers=auth_headers)
        
        response = client.get(f"/api/v1/projects/{project_id}/testcases", 
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "test_cases" in data
        assert "total" in data
        assert "page" in data
        assert "size" in data
        assert "has_next" in data
        assert "has_prev" in data
        assert len(data["test_cases"]) == 3
        assert data["total"] == 3
        assert data["page"] == 1
        assert data["size"] == 10
    
    def test_list_test_cases_unauthenticated(self, project_with_auth, test_test_case):
        """Test listing test cases without authentication"""
        project_id, _ = project_with_auth
        
        response = client.get(f"/api/v1/projects/{project_id}/testcases")
        
        assert response.status_code == 403
    
    def test_list_test_cases_with_filters(self, project_with_auth, test_test_case):
        """Test listing test cases with filters"""
        project_id, auth_headers = project_with_auth
        
        # Create test cases with different statuses
        active_test_case = test_test_case.copy()
        active_test_case["title"] = "Active Test Case"
        active_test_case["status"] = "active"
        
        blocked_test_case = test_test_case.copy()
        blocked_test_case["title"] = "Blocked Test Case"
        blocked_test_case["status"] = "blocked"
        
        client.post(f"/api/v1/projects/{project_id}/testcases", 
                   json=active_test_case, headers=auth_headers)
        client.post(f"/api/v1/projects/{project_id}/testcases", 
                   json=blocked_test_case, headers=auth_headers)
        
        # Test filtering by status
        response = client.get(f"/api/v1/projects/{project_id}/testcases?status=active", 
                             headers=auth_headers)
        data = response.json()
        assert len(data["test_cases"]) == 1
        assert data["test_cases"][0]["status"] == "active"
        
        # Test filtering by priority
        response = client.get(f"/api/v1/projects/{project_id}/testcases?priority=high", 
                             headers=auth_headers)
        data = response.json()
        assert len(data["test_cases"]) >= 1  # At least one high priority test case
        
        # Test filtering by type
        response = client.get(f"/api/v1/projects/{project_id}/testcases?type=functional", 
                             headers=auth_headers)
        data = response.json()
        assert len(data["test_cases"]) >= 1  # At least one functional test case
    
    def test_list_test_cases_pagination(self, project_with_auth, test_test_case):
        """Test test case pagination"""
        project_id, auth_headers = project_with_auth
        
        # Create multiple test cases
        for i in range(5):
            test_case = test_test_case.copy()
            test_case["title"] = f"Test Case {i}"
            client.post(f"/api/v1/projects/{project_id}/testcases", 
                       json=test_case, headers=auth_headers)
        
        # Test pagination
        response = client.get(f"/api/v1/projects/{project_id}/testcases?page=1&size=2", 
                             headers=auth_headers)
        data = response.json()
        assert len(data["test_cases"]) == 2
        assert data["total"] == 5
        assert data["page"] == 1
        assert data["size"] == 2
        assert data["has_next"] is True
        assert data["has_prev"] is False
        
        # Test second page
        response = client.get(f"/api/v1/projects/{project_id}/testcases?page=2&size=2", 
                             headers=auth_headers)
        data = response.json()
        assert len(data["test_cases"]) == 2
        assert data["page"] == 2
        assert data["has_next"] is True
        assert data["has_prev"] is True


class TestTestCaseUpdate:
    """Test test case update endpoints"""
    
    def test_update_test_case(self, project_with_auth, test_test_case):
        """Test updating a test case"""
        project_id, auth_headers = project_with_auth
        
        # Create test case first
        create_response = client.post(f"/api/v1/projects/{project_id}/testcases", 
                                     json=test_test_case, headers=auth_headers)
        case_id = create_response.json()["id"]
        
        # Update test case
        update_data = {
            "title": "Updated Test Title",
            "description": "Updated description",
            "status": "blocked",
            "priority": "low",
            "estimated_duration": 15
        }
        
        response = client.put(f"/api/v1/testcases/{case_id}", 
                             json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == update_data["title"]
        assert data["description"] == update_data["description"]
        assert data["status"] == update_data["status"]
        assert data["priority"] == update_data["priority"]
        assert data["estimated_duration"] == update_data["estimated_duration"]
    
    def test_update_test_case_not_found(self, auth_headers):
        """Test updating a non-existent test case"""
        update_data = {
            "title": "Updated Test Title"
        }
        
        response = client.put("/api/v1/testcases/999", 
                             json=update_data, headers=auth_headers)
        
        assert response.status_code == 404
    
    def test_update_test_case_unauthenticated(self, project_with_auth, test_test_case):
        """Test updating a test case without authentication"""
        project_id, _ = project_with_auth
        
        # Create test case first
        create_response = client.post(f"/api/v1/projects/{project_id}/testcases", 
                                     json=test_test_case)
        
        case_id = create_response.json()["id"]
        
        # Update test case
        update_data = {
            "title": "Updated Test Title"
        }
        
        response = client.put(f"/api/v1/testcases/{case_id}", 
                             json=update_data)
        
        assert response.status_code == 403


class TestTestCaseDeletion:
    """Test test case deletion endpoints"""
    
    def test_delete_test_case(self, project_with_auth, test_test_case):
        """Test deleting a test case"""
        project_id, auth_headers = project_with_auth
        
        # Create test case first
        create_response = client.post(f"/api/v1/projects/{project_id}/testcases", 
                                     json=test_test_case, headers=auth_headers)
        case_id = create_response.json()["id"]
        
        response = client.delete(f"/api/v1/testcases/{case_id}", headers=auth_headers)
        
        assert response.status_code == 200
        assert response.json()["message"] == "Test case deleted successfully"
        
        # Verify deletion
        get_response = client.get(f"/api/v1/testcases/{case_id}", headers=auth_headers)
        assert get_response.status_code == 404
    
    def test_delete_test_case_not_found(self, auth_headers):
        """Test deleting a non-existent test case"""
        response = client.delete("/api/v1/testcases/999", headers=auth_headers)
        
        assert response.status_code == 404
    
    def test_delete_test_case_unauthenticated(self, project_with_auth, test_test_case):
        """Test deleting a test case without authentication"""
        project_id, _ = project_with_auth
        
        # Create test case first
        create_response = client.post(f"/api/v1/projects/{project_id}/testcases", 
                                     json=test_test_case)
        
        case_id = create_response.json()["id"]
        
        response = client.delete(f"/api/v1/testcases/{case_id}")
        
        assert response.status_code == 403


class TestTestCaseAdvancedFeatures:
    """Test test case advanced features"""
    
    def test_get_test_case_stats(self, project_with_auth, test_test_case):
        """Test getting test case statistics"""
        project_id, auth_headers = project_with_auth
        
        # Create test cases with different statuses
        active_test_case = test_test_case.copy()
        active_test_case["title"] = "Active Test Case"
        active_test_case["status"] = "active"
        
        blocked_test_case = test_test_case.copy()
        blocked_test_case["title"] = "Blocked Test Case"
        blocked_test_case["status"] = "blocked"
        
        client.post(f"/api/v1/projects/{project_id}/testcases", 
                   json=active_test_case, headers=auth_headers)
        client.post(f"/api/v1/projects/{project_id}/testcases", 
                   json=blocked_test_case, headers=auth_headers)
        
        response = client.get(f"/api/v1/projects/{project_id}/testcases/stats", 
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "total_test_cases" in data
        assert "status_distribution" in data
        assert "priority_distribution" in data
        assert "type_distribution" in data
        assert "creator_distribution" in data
        assert data["total_test_cases"] == 2
        assert data["status_distribution"]["active"] == 1
        assert data["status_distribution"]["blocked"] == 1
    
    def test_get_similar_test_cases(self, project_with_auth, test_test_case):
        """Test getting similar test cases"""
        project_id, auth_headers = project_with_auth
        
        # Create test cases
        test_case1 = test_test_case.copy()
        test_case1["title"] = "User Login Test"
        
        test_case2 = test_test_case.copy()
        test_case2["title"] = "User Authentication Test"
        
        test_case3 = test_test_case.copy()
        test_case3["title"] = "User Registration Test"
        
        response1 = client.post(f"/api/v1/projects/{project_id}/testcases", 
                               json=test_case1, headers=auth_headers)
        case_id1 = response1.json()["id"]
        
        client.post(f"/api/v1/projects/{project_id}/testcases", 
                   json=test_case2, headers=auth_headers)
        client.post(f"/api/v1/projects/{project_id}/testcases", 
                   json=test_case3, headers=auth_headers)
        
        response = client.get(f"/api/v1/projects/{project_id}/testcases/similar/{case_id1}", 
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "similar_test_cases" in data
        # Should find test_case2 as similar (contains "User" and "Test")
        assert len(data["similar_test_cases"]) >= 1
    
    def test_get_test_cases_by_priority(self, project_with_auth, test_test_case):
        """Test getting test cases by priority"""
        project_id, auth_headers = project_with_auth
        
        # Create test cases with different priorities
        high_priority = test_test_case.copy()
        high_priority["title"] = "High Priority Test"
        high_priority["priority"] = "high"
        
        low_priority = test_test_case.copy()
        low_priority["title"] = "Low Priority Test"
        low_priority["priority"] = "low"
        
        client.post(f"/api/v1/projects/{project_id}/testcases", 
                   json=high_priority, headers=auth_headers)
        client.post(f"/api/v1/projects/{project_id}/testcases", 
                   json=low_priority, headers=auth_headers)
        
        response = client.get(f"/api/v1/projects/{project_id}/testcases/priority/high", 
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["priority"] == "high"
        assert data[0]["title"] == "High Priority Test"
    
    def test_get_test_cases_by_type(self, project_with_auth, test_test_case):
        """Test getting test cases by type"""
        project_id, auth_headers = project_with_auth
        
        # Create test cases with different types
        functional = test_test_case.copy()
        functional["title"] = "Functional Test"
        functional["type"] = "functional"
        
        performance = test_test_case.copy()
        performance["title"] = "Performance Test"
        performance["type"] = "performance"
        
        client.post(f"/api/v1/projects/{project_id}/testcases", 
                   json=functional, headers=auth_headers)
        client.post(f"/api/v1/projects/{project_id}/testcases", 
                   json=performance, headers=auth_headers)
        
        response = client.get(f"/api/v1/projects/{project_id}/testcases/type/functional", 
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["type"] == "functional"
        assert data[0]["title"] == "Functional Test"
    
    def test_get_test_cases_by_status(self, project_with_auth, test_test_case):
        """Test getting test cases by status"""
        project_id, auth_headers = project_with_auth
        
        # Create test cases with different statuses
        active = test_test_case.copy()
        active["title"] = "Active Test"
        active["status"] = "active"
        
        blocked = test_test_case.copy()
        blocked["title"] = "Blocked Test"
        blocked["status"] = "blocked"
        
        client.post(f"/api/v1/projects/{project_id}/testcases", 
                   json=active, headers=auth_headers)
        client.post(f"/api/v1/projects/{project_id}/testcases", 
                   json=blocked, headers=auth_headers)
        
        response = client.get(f"/api/v1/projects/{project_id}/testcases/status/active", 
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["status"] == "active"
        assert data[0]["title"] == "Active Test"
    
    def test_bulk_update_test_case_status(self, project_with_auth, test_test_case):
        """Test bulk updating test case status"""
        project_id, auth_headers = project_with_auth
        
        # Create test cases
        test_case1 = test_test_case.copy()
        test_case1["title"] = "Test 1"
        
        test_case2 = test_test_case.copy()
        test_case2["title"] = "Test 2"
        
        response1 = client.post(f"/api/v1/projects/{project_id}/testcases", 
                               json=test_case1, headers=auth_headers)
        case_id1 = response1.json()["id"]
        
        response2 = client.post(f"/api/v1/projects/{project_id}/testcases", 
                               json=test_case2, headers=auth_headers)
        case_id2 = response2.json()["id"]
        
        # Bulk update status
        update_data = {
            "test_case_ids": [case_id1, case_id2],
            "status": "blocked"
        }
        
        response = client.put(f"/api/v1/projects/{project_id}/testcases/bulk/status", 
                             json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == 2
        assert data["failed"] == 0
        assert len(data["errors"]) == 0
        
        # Verify update
        response1 = client.get(f"/api/v1/testcases/{case_id1}", headers=auth_headers)
        response2 = client.get(f"/api/v1/testcases/{case_id2}", headers=auth_headers)
        
        assert response1.json()["status"] == "blocked"
        assert response2.json()["status"] == "blocked"