"""
Project service for business logic operations
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session

from app.repositories.project_repository import ProjectRepository
from app.repositories.user_repository import UserRepository
from app.models.project import Project, ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse
from app.models.user import User


class ProjectService:
    """Service class for project business logic"""
    
    def __init__(self, db: Session):
        self.db = db
        self.project_repository = ProjectRepository(db)
        self.user_repository = UserRepository(db)
    
    def create_project(self, project_data: ProjectCreate, user_id: int) -> ProjectResponse:
        """Create a new project"""
        # Verify user exists
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        # Create project
        db_project = self.project_repository.create(project_data, user_id)
        
        # Convert to response model
        return ProjectResponse.from_orm(db_project)
    
    def get_project(self, project_id: int, user_id: int) -> Optional[ProjectResponse]:
        """Get project by ID with user access check"""
        project = self.project_repository.get_by_id(project_id)
        if not project:
            return None
        
        # Check user access
        if not self.project_repository.user_has_access(user_id, project_id):
            raise ValueError("Access denied")
        
        return ProjectResponse.from_orm(project)
    
    def get_user_projects(
        self, 
        user_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> ProjectListResponse:
        """Get all projects for a user"""
        projects = self.project_repository.get_user_projects(user_id, skip, limit)
        total = self.project_repository.count(created_by=user_id)
        
        project_responses = [ProjectResponse.from_orm(project) for project in projects]
        
        return ProjectListResponse(
            projects=project_responses,
            total=total,
            page=skip // limit + 1 if limit > 0 else 1,
            size=limit
        )
    
    def update_project(
        self, 
        project_id: int, 
        update_data: ProjectUpdate, 
        user_id: int
    ) -> Optional[ProjectResponse]:
        """Update a project"""
        # Check user access
        if not self.project_repository.user_has_access(user_id, project_id):
            raise ValueError("Access denied")
        
        # Update project
        db_project = self.project_repository.update(project_id, update_data)
        if not db_project:
            return None
        
        return ProjectResponse.from_orm(db_project)
    
    def delete_project(self, project_id: int, user_id: int) -> bool:
        """Delete a project"""
        # Check user access
        if not self.project_repository.user_has_access(user_id, project_id):
            raise ValueError("Access denied")
        
        return self.project_repository.delete(project_id)
    
    def get_project_stats(self, user_id: int) -> Dict[str, Any]:
        """Get project statistics for a user"""
        total_projects = self.project_repository.count(created_by=user_id)
        active_projects = self.project_repository.count(created_by=user_id, status='active')
        inactive_projects = self.project_repository.count(created_by=user_id, status='inactive')
        
        return {
            'total_projects': total_projects,
            'active_projects': active_projects,
            'inactive_projects': inactive_projects,
            'archived_projects': total_projects - active_projects - inactive_projects
        }