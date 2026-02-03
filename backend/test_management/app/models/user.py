"""
User data models for Test Management Service
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class UserBase(BaseModel):
    """Base user model with common fields"""
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    email: EmailStr = Field(..., description="User email")
    full_name: Optional[str] = Field(None, max_length=100, description="Full name")
    is_active: bool = Field(True, description="User active status")


class UserCreate(UserBase):
    """User creation model"""
    password: str = Field(..., min_length=8, description="Password")


class UserUpdate(BaseModel):
    """User update model"""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None


class User(UserBase):
    """Complete user model with database fields"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserDB(Base):
    """SQLAlchemy model for users table"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False, unique=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default='now()')
    updated_at = Column(DateTime, nullable=False, server_default='now()', onupdate='now()')
    
    # Relationships
    created_projects = relationship("ProjectDB", foreign_keys="ProjectDB.created_by", back_populates="creator")
    test_cases = relationship("TestCase", back_populates="creator")
    test_plans = relationship("TestPlan", back_populates="creator")
    user_mappings = relationship("UserProjectMapping", back_populates="user")


class UserResponse(BaseModel):
    """User response model for API"""
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserProjectMappingDB(Base):
    """SQLAlchemy model for user_project_mapping table"""
    __tablename__ = "user_project_mapping"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    project_id = Column(Integer, nullable=False, index=True)
    role_id = Column(Integer, nullable=False)
    joined_at = Column(DateTime, nullable=False, server_default='now()')
    is_active = Column(Boolean, nullable=False, default=True)
    
    # Relationships
    user = relationship("UserDB", back_populates="user_mappings")
    project = relationship("ProjectDB", back_populates="user_mappings")