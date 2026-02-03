"""
Projects endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse
from app.services.project_service import ProjectService
from app.middleware.auth import get_current_user_dependency
from core.config import settings

router = APIRouter()


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=100, description="Maximum number of records to return"),
    status: Optional[str] = Query(None, description="Filter by project status"),
    current_user: dict = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """List all projects for the current user"""
    project_service = ProjectService(db)
    return project_service.get_user_projects(
        user_id=current_user["user_id"],
        skip=skip,
        limit=limit
    )


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    project_data: ProjectCreate,
    current_user: dict = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """Create a new project"""
    project_service = ProjectService(db)
    try:
        return project_service.create_project(
            project_data=project_data,
            user_id=current_user["user_id"]
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: dict = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """Get project by ID"""
    project_service = ProjectService(db)
    try:
        project = project_service.get_project(
            project_id=project_id,
            user_id=current_user["user_id"]
        )
        if project is None:
            raise HTTPException(status_code=404, detail="Project not found")
        return project
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    current_user: dict = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """Update a project"""
    project_service = ProjectService(db)
    try:
        updated_project = project_service.update_project(
            project_id=project_id,
            update_data=project_data,
            user_id=current_user["user_id"]
        )
        if updated_project is None:
            raise HTTPException(status_code=404, detail="Project not found")
        return updated_project
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    current_user: dict = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """Delete a project"""
    project_service = ProjectService(db)
    try:
        success = project_service.delete_project(
            project_id=project_id,
            user_id=current_user["user_id"]
        )
        if not success:
            raise HTTPException(status_code=404, detail="Project not found")
        return {"message": "Project deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
