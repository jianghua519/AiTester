"""
Test cases endpoints
"""

from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/projects/{project_id}/testcases")
async def list_testcases(project_id: int):
    """List all test cases for a project"""
    return {
        "message": "list testcases endpoint - to be implemented",
        "project_id": project_id
    }


@router.post("/projects/{project_id}/testcases")
async def create_testcase(project_id: int):
    """Create a new test case in a project"""
    return {
        "message": "create testcase endpoint - to be implemented",
        "project_id": project_id
    }


@router.get("/testcases/{case_id}")
async def get_testcase(case_id: int):
    """Get test case by ID"""
    return {
        "message": "get testcase endpoint - to be implemented",
        "case_id": case_id
    }


@router.put("/testcases/{case_id}")
async def update_testcase(case_id: int):
    """Update test case"""
    return {
        "message": "update testcase endpoint - to be implemented",
        "case_id": case_id
    }


@router.delete("/testcases/{case_id}")
async def delete_testcase(case_id: int):
    """Delete test case"""
    return {
        "message": "delete testcase endpoint - to be implemented",
        "case_id": case_id
    }
