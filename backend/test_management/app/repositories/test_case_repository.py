"""
Test case repository for data access operations
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from sqlalchemy.sql import func

from app.models.test_case import TestCaseDB, TestCase, TestCaseCreate, TestCaseUpdate, TestCaseSearchQuery, TestCaseStatus, TestCasePriority, TestCaseType
from app.models.user import UserDB


class TestCaseRepository:
    """Repository class for test case data access operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, test_case_data: TestCaseCreate, project_id: int, created_by: int) -> TestCaseDB:
        """Create a new test case"""
        db_test_case = TestCaseDB(
            project_id=project_id,
            created_by=created_by,
            title=test_case_data.title,
            description=test_case_data.description,
            status=test_case_data.status,
            priority=test_case_data.priority,
            type=test_case_data.type,
            preconditions=test_case_data.preconditions,
            estimated_duration=test_case_data.estimated_duration,
        )
        
        # Handle list fields (convert to JSON strings)
        if test_case_data.steps:
            db_test_case.set_steps_list(test_case_data.steps)
        if test_case_data.expected_results:
            db_test_case.set_expected_results_list(test_case_data.expected_results)
        if test_case_data.tags:
            db_test_case.set_tags_list(test_case_data.tags)
        
        self.db.add(db_test_case)
        self.db.commit()
        self.db.refresh(db_test_case)
        return db_test_case
    
    def get_by_id(self, test_case_id: int) -> Optional[TestCaseDB]:
        """Get test case by ID"""
        return self.db.query(TestCaseDB).filter(TestCaseDB.id == test_case_id).first()
    
    def get_by_id_and_project(self, test_case_id: int, project_id: int) -> Optional[TestCaseDB]:
        """Get test case by ID and project ID (for access control)"""
        return self.db.query(TestCaseDB).filter(
            and_(TestCaseDB.id == test_case_id, TestCaseDB.project_id == project_id)
        ).first()
    
    def get_by_project(
        self, 
        project_id: int,
        skip: int = 0, 
        limit: int = 100,
        query_params: Optional[TestCaseSearchQuery] = None
    ) -> tuple[List[TestCaseDB], int]:
        """Get test cases for a project with optional filters"""
        query = self.db.query(TestCaseDB).filter(TestCaseDB.project_id == project_id)
        total_query = self.db.query(TestCaseDB).filter(TestCaseDB.project_id == project_id)
        
        # Apply filters
        if query_params:
            if query_params.title:
                query = query.filter(TestCaseDB.title.contains(query_params.title))
                total_query = total_query.filter(TestCaseDB.title.contains(query_params.title))
            
            if query_params.status:
                query = query.filter(TestCaseDB.status == query_params.status)
                total_query = total_query.filter(TestCaseDB.status == query_params.status)
            
            if query_params.priority:
                query = query.filter(TestCaseDB.priority == query_params.priority)
                total_query = total_query.filter(TestCaseDB.priority == query_params.priority)
            
            if query_params.type:
                query = query.filter(TestCaseDB.type == query_params.type)
                total_query = total_query.filter(TestCaseDB.type == query_params.type)
            
            if query_params.created_by:
                query = query.filter(TestCaseDB.created_by == query_params.created_by)
                total_query = total_query.filter(TestCaseDB.created_by == query_params.created_by)
            
            if query_params.created_after:
                query = query.filter(TestCaseDB.created_at >= query_params.created_after)
                total_query = total_query.filter(TestCaseDB.created_at >= query_params.created_after)
            
            if query_params.created_before:
                query = query.filter(TestCaseDB.created_at <= query_params.created_before)
                total_query = total_query.filter(TestCaseDB.created_at <= query_params.created_before)
            
            # Tag filtering
            if query_params.tags:
                for tag in query_params.tags:
                    query = query.filter(TestCaseDB.tags.contains(f'"{tag}"'))
                    total_query = total_query.filter(TestCaseDB.tags.contains(f'"{tag}"'))
        
        # Apply pagination and ordering
        query = query.order_by(desc(TestCaseDB.created_at))
        test_cases = query.offset(skip).limit(limit).all()
        total = total_query.count()
        
        return test_cases, total
    
    def get_all(
        self, 
        skip: int = 0, 
        limit: int = 100,
        status: Optional[TestCaseStatus] = None,
        priority: Optional[TestCasePriority] = None,
        type: Optional[TestCaseType] = None,
        created_by: Optional[int] = None
    ) -> List[TestCaseDB]:
        """Get all test cases with optional filters"""
        query = self.db.query(TestCaseDB)
        
        if status:
            query = query.filter(TestCaseDB.status == status)
        
        if priority:
            query = query.filter(TestCaseDB.priority == priority)
        
        if type:
            query = query.filter(TestCaseDB.type == type)
        
        if created_by:
            query = query.filter(TestCaseDB.created_by == created_by)
        
        return query.order_by(desc(TestCaseDB.created_at)).offset(skip).limit(limit).all()
    
    def count(
        self, 
        project_id: Optional[int] = None,
        status: Optional[TestCaseStatus] = None, 
        priority: Optional[TestCasePriority] = None,
        type: Optional[TestCaseType] = None,
        created_by: Optional[int] = None
    ) -> int:
        """Count test cases with optional filters"""
        query = self.db.query(TestCaseDB)
        
        if project_id:
            query = query.filter(TestCaseDB.project_id == project_id)
        
        if status:
            query = query.filter(TestCaseDB.status == status)
        
        if priority:
            query = query.filter(TestCaseDB.priority == priority)
        
        if type:
            query = query.filter(TestCaseDB.type == type)
        
        if created_by:
            query = query.filter(TestCaseDB.created_by == created_by)
        
        return query.count()
    
    def update(self, test_case_id: int, update_data: TestCaseUpdate) -> Optional[TestCaseDB]:
        """Update a test case"""
        db_test_case = self.get_by_id(test_case_id)
        if not db_test_case:
            return None
        
        update_dict = update_data.dict(exclude_unset=True)
        
        # Handle list fields (convert to JSON strings)
        if 'steps' in update_dict and update_dict['steps'] is not None:
            db_test_case.set_steps_list(update_dict['steps'])
            del update_dict['steps']
        
        if 'expected_results' in update_dict and update_dict['expected_results'] is not None:
            db_test_case.set_expected_results_list(update_dict['expected_results'])
            del update_dict['expected_results']
        
        if 'tags' in update_dict and update_dict['tags'] is not None:
            db_test_case.set_tags_list(update_dict['tags'])
            del update_dict['tags']
        
        # Update other fields
        for field, value in update_dict.items():
            setattr(db_test_case, field, value)
        
        db_test_case.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(db_test_case)
        return db_test_case
    
    def delete(self, test_case_id: int) -> bool:
        """Delete a test case"""
        db_test_case = self.get_by_id(test_case_id)
        if not db_test_case:
            return False
        
        self.db.delete(db_test_case)
        self.db.commit()
        return True
    
    def user_has_access(self, user_id: int, project_id: int) -> bool:
        """Check if user has access to a project's test cases"""
        # This would be implemented with proper project access control
        # For now, we'll check if user exists and project exists
        from app.repositories.project_repository import ProjectRepository
        project_repo = ProjectRepository(self.db)
        return project_repo.user_has_access(user_id, project_id)
    
    def get_project_test_cases_count(self, project_id: int) -> Dict[str, int]:
        """Get count of test cases by status for a project"""
        counts = {}
        for status in TestCaseStatus:
            counts[status.value] = self.count(project_id=project_id, status=status)
        return counts
    
    def get_priority_distribution(self, project_id: int) -> Dict[str, int]:
        """Get count of test cases by priority for a project"""
        counts = {}
        for priority in TestCasePriority:
            counts[priority.value] = self.count(project_id=project_id, priority=priority)
        return counts
    
    def get_type_distribution(self, project_id: int) -> Dict[str, int]:
        """Get count of test cases by type for a project"""
        counts = {}
        for type_ in TestCaseType:
            counts[type_.value] = self.count(project_id=project_id, type=type_)
        return counts
    
    def search_similar_test_cases(self, project_id: int, title: str, exclude_id: Optional[int] = None) -> List[TestCaseDB]:
        """Search for similar test cases by title"""
        query = self.db.query(TestCaseDB).filter(TestCaseDB.project_id == project_id)
        
        if exclude_id:
            query = query.filter(TestCaseDB.id != exclude_id)
        
        # Simple similarity search - contains words from title
        words = title.lower().split()
        for word in words:
            if len(word) > 2:  # Skip very short words
                query = query.or_(TestCaseDB.title.contains(word))
        
        return query.order_by(desc(TestCaseDB.created_at)).limit(10).all()