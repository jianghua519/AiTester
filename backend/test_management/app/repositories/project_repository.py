"""
Project repository for data access operations
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.project import ProjectDB, Project, ProjectCreate, ProjectUpdate
from app.models.user import UserDB


class ProjectRepository:
    """Repository class for project data access operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, project_data: ProjectCreate, created_by: int) -> ProjectDB:
        """Create a new project"""
        db_project = ProjectDB(
            name=project_data.name,
            description=project_data.description,
            status=project_data.status,
            created_by=created_by
        )
        self.db.add(db_project)
        self.db.commit()
        self.db.refresh(db_project)
        return db_project
    
    def get_by_id(self, project_id: int) -> Optional[ProjectDB]:
        """Get project by ID"""
        return self.db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    
    def get_by_name(self, name: str) -> Optional[ProjectDB]:
        """Get project by name"""
        return self.db.query(ProjectDB).filter(ProjectDB.name == name).first()
    
    def get_all(
        self, 
        skip: int = 0, 
        limit: int = 100,
        status: Optional[str] = None,
        created_by: Optional[int] = None
    ) -> List[ProjectDB]:
        """Get all projects with optional filters"""
        query = self.db.query(ProjectDB)
        
        if status:
            query = query.filter(ProjectDB.status == status)
        
        if created_by:
            query = query.filter(ProjectDB.created_by == created_by)
        
        return query.offset(skip).limit(limit).all()
    
    def count(
        self, 
        status: Optional[str] = None, 
        created_by: Optional[int] = None
    ) -> int:
        """Count projects with optional filters"""
        query = self.db.query(ProjectDB)
        
        if status:
            query = query.filter(ProjectDB.status == status)
        
        if created_by:
            query = query.filter(ProjectDB.created_by == created_by)
        
        return query.count()
    
    def update(self, project_id: int, update_data: ProjectUpdate) -> Optional[ProjectDB]:
        """Update a project"""
        db_project = self.get_by_id(project_id)
        if not db_project:
            return None
        
        update_dict = update_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(db_project, field, value)
        
        db_project.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(db_project)
        return db_project
    
    def delete(self, project_id: int) -> bool:
        """Delete a project"""
        db_project = self.get_by_id(project_id)
        if not db_project:
            return False
        
        self.db.delete(db_project)
        self.db.commit()
        return True
    
    def user_has_access(self, user_id: int, project_id: int) -> bool:
        """Check if user has access to a project"""
        # Check if user is the creator
        project = self.get_by_id(project_id)
        if not project:
            return False
        
        if project.created_by == user_id:
            return True
        
        # Check if user is mapped to the project (this would be implemented later)
        # For now, only creators have access
        return False
    
    def get_user_projects(self, user_id: int, skip: int = 0, limit: int = 100) -> List[ProjectDB]:
        """Get all projects created by a user"""
        return (
            self.db.query(ProjectDB)
            .filter(ProjectDB.created_by == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )