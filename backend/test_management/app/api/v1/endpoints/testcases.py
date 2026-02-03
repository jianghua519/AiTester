"""
Test cases endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.test_case import (
    TestCaseCreate, TestCaseUpdate, TestCaseResponse, TestCaseListResponse,
    TestCaseSearchQuery, TestCaseStatus, TestCasePriority, TestCaseType
)
from app.services.test_case_service import TestCaseService
from app.models.user import User

router = APIRouter()


def get_test_case_service(db: Session = Depends(get_db)) -> TestCaseService:
    """Dependency injection for TestCaseService"""
    return TestCaseService(db)


@router.get("/projects/{project_id}/testcases", response_model=TestCaseListResponse)
async def list_testcases(
    project_id: int,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    title: Optional[str] = Query(None, description="Filter by title (contains)"),
    status: Optional[TestCaseStatus] = Query(None, description="Filter by status"),
    priority: Optional[TestCasePriority] = Query(None, description="Filter by priority"),
    type: Optional[TestCaseType] = Query(None, description="Filter by type"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    created_by: Optional[int] = Query(None, description="Filter by creator"),
    created_after: Optional[datetime] = Query(None, description="Filter by creation date (after)"),
    created_before: Optional[datetime] = Query(None, description="Filter by creation date (before)"),
    current_user: User = Depends(get_current_user),
    test_case_service: TestCaseService = Depends(get_test_case_service)
):
    """List all test cases for a project with filtering and pagination"""
    try:
        # Parse tags if provided
        tags_list = None
        if tags:
            tags_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
        
        # Create search query
        query_params = TestCaseSearchQuery(
            page=page,
            size=size,
            title=title,
            status=status,
            priority=priority,
            type=type,
            tags=tags_list,
            created_by=created_by,
            created_after=created_after,
            created_before=created_before
        )
        
        return test_case_service.get_project_test_cases(project_id, current_user.id, query_params)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/projects/{project_id}/testcases", response_model=TestCaseResponse)
async def create_testcase(
    project_id: int,
    test_case_data: TestCaseCreate,
    current_user: User = Depends(get_current_user),
    test_case_service: TestCaseService = Depends(get_test_case_service)
):
    """Create a new test case in a project"""
    try:
        return test_case_service.create_test_case(test_case_data, project_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/testcases/{case_id}", response_model=TestCaseResponse)
async def get_testcase(
    case_id: int,
    current_user: User = Depends(get_current_user),
    test_case_service: TestCaseService = Depends(get_test_case_service)
):
    """Get test case by ID"""
    try:
        test_case = test_case_service.get_test_case(case_id, current_user.id)
        if not test_case:
            raise HTTPException(status_code=404, detail="Test case not found")
        return test_case
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.put("/testcases/{case_id}", response_model=TestCaseResponse)
async def update_testcase(
    case_id: int,
    test_case_data: TestCaseUpdate,
    current_user: User = Depends(get_current_user),
    test_case_service: TestCaseService = Depends(get_test_case_service)
):
    """Update test case"""
    try:
        updated_test_case = test_case_service.update_test_case(case_id, test_case_data, current_user.id)
        if not updated_test_case:
            raise HTTPException(status_code=404, detail="Test case not found")
        return updated_test_case
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/testcases/{case_id}")
async def delete_testcase(
    case_id: int,
    current_user: User = Depends(get_current_user),
    test_case_service: TestCaseService = Depends(get_test_case_service)
):
    """Delete test case"""
    try:
        success = test_case_service.delete_test_case(case_id, current_user.id)
        if not success:
            raise HTTPException(status_code=404, detail="Test case not found")
        return {"message": "Test case deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/projects/{project_id}/testcases/stats")
async def get_testcase_stats(
    project_id: int,
    current_user: User = Depends(get_current_user),
    test_case_service: TestCaseService = Depends(get_test_case_service)
):
    """Get test case statistics for a project"""
    try:
        return test_case_service.get_test_case_stats(project_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/projects/{project_id}/testcases/similar/{case_id}")
async def get_similar_testcases(
    project_id: int,
    case_id: int,
    current_user: User = Depends(get_current_user),
    test_case_service: TestCaseService = Depends(get_test_case_service)
):
    """Search for similar test cases"""
    try:
        similar_test_cases = test_case_service.search_similar_test_cases(case_id, current_user.id)
        return {"similar_test_cases": similar_test_cases}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/projects/{project_id}/testcases/priority/{priority}", response_model=List[TestCaseResponse])
async def get_testcases_by_priority(
    project_id: int,
    priority: TestCasePriority,
    current_user: User = Depends(get_current_user),
    test_case_service: TestCaseService = Depends(get_test_case_service)
):
    """Get test cases by priority"""
    try:
        return test_case_service.get_test_cases_by_priority(project_id, current_user.id, priority)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/projects/{project_id}/testcases/type/{type}", response_model=List[TestCaseResponse])
async def get_testcases_by_type(
    project_id: int,
    type: TestCaseType,
    current_user: User = Depends(get_current_user),
    test_case_service: TestCaseService = Depends(get_test_case_service)
):
    """Get test cases by type"""
    try:
        return test_case_service.get_test_cases_by_type(project_id, current_user.id, type)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/projects/{project_id}/testcases/status/{status}", response_model=List[TestCaseResponse])
async def get_testcases_by_status(
    project_id: int,
    status: TestCaseStatus,
    current_user: User = Depends(get_current_user),
    test_case_service: TestCaseService = Depends(get_test_case_service)
):
    """Get test cases by status"""
    try:
        return test_case_service.get_test_cases_by_status(project_id, current_user.id, status)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.put("/projects/{project_id}/testcases/bulk/status")
async def bulk_update_testcase_status(
    project_id: int,
    test_case_ids: List[int],
    status: TestCaseStatus,
    current_user: User = Depends(get_current_user),
    test_case_service: TestCaseService = Depends(get_test_case_service)
):
    """Bulk update test case status"""
    try:
        results = test_case_service.bulk_update_test_cases_status(
            project_id, test_case_ids, status, current_user.id
        )
        return results
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")