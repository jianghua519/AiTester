"""
Projects endpoints
"""

from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("")
async def list_projects():
    """List all projects"""
    return {
        "message": "list projects endpoint - to be implemented"
    }


@router.post("")
async def create_project():
    """Create a new project"""
    return {
        "message": "create project endpoint - to be implemented"
    }


@router.get("/{project_id}")
async def get_project(project_id: int):
    """Get project by ID"""
    return {
        "message": "get project endpoint - to be implemented",
        "project_id": project_id
    }


@router.put("/{project_id}")
async def update_project(project_id: int):
    """Update project"""
    return {
        "message": "update project endpoint - to be implemented",
        "project_id": project_id
    }


@router.delete("/{project_id}")
async def delete_project(project_id: int):
    """Delete project"""
    return {
        "message": "delete project endpoint - to be implemented",
        "project_id": project_id
    }
