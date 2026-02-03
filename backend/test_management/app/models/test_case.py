"""
Test case data models for Test Management Service
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator, conlist
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()


class TestCaseStatus(str, enum.Enum):
    """Test case status enumeration"""
    DRAFT = "draft"
    ACTIVE = "active"
    BLOCKED = "blocked"
    DEPRECATED = "deprecated"


class TestCasePriority(str, enum.Enum):
    """Test case priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TestCaseType(str, enum.Enum):
    """Test case type enumeration"""
    FUNCTIONAL = "functional"
    PERFORMANCE = "performance"
    SECURITY = "security"
    REGRESSION = "regression"
    MANUAL = "manual"
    AUTOMATED = "automated"


class TestCaseBase(BaseModel):
    """Base test case model with common fields"""
    title: str = Field(..., min_length=1, max_length=200, description="Test case title")
    description: Optional[str] = Field(None, description="Test case description")
    status: TestCaseStatus = Field(TestCaseStatus.ACTIVE, description="Test case status")
    priority: TestCasePriority = Field(TestCasePriority.MEDIUM, description="Test case priority")
    type: TestCaseType = Field(TestCaseType.FUNCTIONAL, description="Test case type")
    preconditions: Optional[str] = Field(None, description="Test preconditions")
    steps: List[str] = Field(default_factory=list, description="Test steps")
    expected_results: List[str] = Field(default_factory=list, description="Expected results")
    estimated_duration: Optional[int] = Field(None, ge=0, description="Estimated duration in minutes")
    tags: Optional[List[str]] = Field(default_factory=list, description="Test case tags")
    
    @validator('steps')
    def validate_steps(cls, v):
        if len(v) > 50:
            raise ValueError("Maximum 50 steps allowed")
        return v
    
    @validator('expected_results')
    def validate_expected_results(cls, v):
        if len(v) > 50:
            raise ValueError("Maximum 50 expected results allowed")
        return v
    
    @validator('tags')
    def validate_tags(cls, v):
        if len(v) > 20:
            raise ValueError("Maximum 20 tags allowed")
        return v


class TestCaseCreate(TestCaseBase):
    """Test case creation model"""
    pass


class TestCaseUpdate(BaseModel):
    """Test case update model"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[TestCaseStatus] = None
    priority: Optional[TestCasePriority] = None
    type: Optional[TestCaseType] = None
    preconditions: Optional[str] = None
    steps: Optional[List[str]] = None
    expected_results: Optional[List[str]] = None
    estimated_duration: Optional[int] = Field(None, ge=0)
    tags: Optional[List[str]] = None
    
    @validator('steps')
    def validate_steps(cls, v):
        if v is not None and len(v) > 50:
            raise ValueError("Maximum 50 steps allowed")
        return v
    
    @validator('expected_results')
    def validate_expected_results(cls, v):
        if v is not None and len(v) > 50:
            raise ValueError("Maximum 50 expected results allowed")
        return v
    
    @validator('tags')
    def validate_tags(cls, v):
        if v is not None and len(v) > 20:
            raise ValueError("Maximum 20 tags allowed")
        return v


class TestCase(TestCaseBase):
    """Complete test case model with database fields"""
    id: int
    project_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    updated_by: Optional[int] = None
    
    class Config:
        from_attributes = True


class TestCaseDB(Base):
    """SQLAlchemy model for test_cases table"""
    __tablename__ = "test_cases"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, nullable=False, index=True)
    created_by = Column(Integer, nullable=False, index=True)
    updated_by = Column(Integer, nullable=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(Enum(TestCaseStatus), nullable=False, default=TestCaseStatus.ACTIVE, index=True)
    priority = Column(Enum(TestCasePriority), nullable=False, default=TestCasePriority.MEDIUM, index=True)
    type = Column(Enum(TestCaseType), nullable=False, default=TestCaseType.FUNCTIONAL, index=True)
    preconditions = Column(Text, nullable=True)
    steps = Column(Text, nullable=True)  # JSON string format
    expected_results = Column(Text, nullable=True)  # JSON string format
    estimated_duration = Column(Integer, nullable=True)
    tags = Column(Text, nullable=True)  # JSON string format
    created_at = Column(DateTime, nullable=False, server_default='now()')
    updated_at = Column(DateTime, nullable=False, server_default='now()', onupdate='now()')
    
    # Relationships
    project = relationship("ProjectDB", back_populates="test_cases")
    creator = relationship("UserDB", foreign_keys=[created_by], back_populates="test_cases")
    updater = relationship("UserDB", foreign_keys=[updated_by], back_populates="updated_test_cases")
    
    def get_steps_list(self) -> List[str]:
        """Get steps as list from JSON string"""
        import json
        if self.steps:
            try:
                return json.loads(self.steps)
            except json.JSONDecodeError:
                return []
        return []
    
    def get_expected_results_list(self) -> List[str]:
        """Get expected results as list from JSON string"""
        import json
        if self.expected_results:
            try:
                return json.loads(self.expected_results)
            except json.JSONDecodeError:
                return []
        return []
    
    def get_tags_list(self) -> List[str]:
        """Get tags as list from JSON string"""
        import json
        if self.tags:
            try:
                return json.loads(self.tags)
            except json.JSONDecodeError:
                return []
        return []
    
    def set_steps_list(self, steps: List[str]) -> None:
        """Set steps from list to JSON string"""
        import json
        self.steps = json.dumps(steps)
    
    def set_expected_results_list(self, results: List[str]) -> None:
        """Set expected results from list to JSON string"""
        import json
        self.expected_results = json.dumps(results)
    
    def set_tags_list(self, tags: List[str]) -> None:
        """Set tags from list to JSON string"""
        import json
        self.tags = json.dumps(tags)


class TestCaseResponse(TestCaseBase):
    """Test case response model for API"""
    id: int
    project_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    updated_by: Optional[int] = None
    
    class Config:
        from_attributes = True


class TestCaseListResponse(BaseModel):
    """Test case list response model"""
    test_cases: List[TestCaseResponse]
    total: int
    page: int
    size: int
    has_next: bool
    has_prev: bool


class TestCaseSearchQuery(BaseModel):
    """Test case search query parameters"""
    page: int = Field(1, ge=1, description="Page number")
    size: int = Field(10, ge=1, le=100, description="Page size")
    title: Optional[str] = Field(None, description="Filter by title (contains)")
    status: Optional[TestCaseStatus] = Field(None, description="Filter by status")
    priority: Optional[TestCasePriority] = Field(None, description="Filter by priority")
    type: Optional[TestCaseType] = Field(None, description="Filter by type")
    tags: Optional[List[str]] = Field(None, description="Filter by tags")
    created_by: Optional[int] = Field(None, description="Filter by creator")
    created_after: Optional[datetime] = Field(None, description="Filter by creation date (after)")
    created_before: Optional[datetime] = Field(None, description="Filter by creation date (before)")
    
    @validator('tags')
    def validate_tags(cls, v):
        if v is not None and len(v) > 10:
            raise ValueError("Maximum 10 tags filter allowed")
        return v