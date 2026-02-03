"""
Project data models for Test Management Service
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class ProjectBase(BaseModel):
    """Base project model with common fields"""
    name: str = Field(..., min_length=1, max_length=100, description="Project name")
    description: Optional[str] = Field(None, description="Project description")
    status: str = Field("active", description="Project status")
    
    @validator('status')
    def validate_status(cls, v):
        allowed_statuses = ['active', 'inactive', 'archived']
        if v not in allowed_statuses:
            raise ValueError(f"Status must be one of {allowed_statuses}")
        return v


class ProjectCreate(ProjectBase):
    """Project creation model"""
    pass


class ProjectUpdate(BaseModel):
    """Project update model"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    status: Optional[str] = None
    
    @validator('status')
    def validate_status(cls, v):
        if v is not None:
            allowed_statuses = ['active', 'inactive', 'archived']
            if v not in allowed_statuses:
                raise ValueError(f"Status must be one of {allowed_statuses}")
        return v


class Project(ProjectBase):
    """Complete project model with database fields"""
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ProjectDB(Base):
    """SQLAlchemy model for projects table"""
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default='active', index=True)
    created_by = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, server_default='now()')
    updated_at = Column(DateTime, nullable=False, server_default='now()', onupdate='now()')
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    test_cases = relationship("TestCase", back_populates="project")
    test_plans = relationship("TestPlan", back_populates="project")
    user_mappings = relationship("UserProjectMapping", back_populates="project")


class ProjectResponse(BaseModel):
    """Project response model for API"""
    id: int
    name: str
    description: Optional[str]
    status: str
    created_by: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    """Project list response model"""
    projects: list[ProjectResponse]
    total: int
    page: int
    size: int