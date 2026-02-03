"""
Test case service for business logic operations
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session

from app.repositories.test_case_repository import TestCaseRepository
from app.repositories.project_repository import ProjectRepository
from app.repositories.user_repository import UserRepository
from app.models.test_case import (
    TestCase, TestCaseCreate, TestCaseUpdate, TestCaseResponse, 
    TestCaseListResponse, TestCaseSearchQuery, TestCaseStatus, TestCasePriority, TestCaseType
)
from app.models.user import User


class TestCaseService:
    """Service class for test case business logic"""
    
    def __init__(self, db: Session):
        self.db = db
        self.test_case_repository = TestCaseRepository(db)
        self.project_repository = ProjectRepository(db)
        self.user_repository = UserRepository(db)
    
    def create_test_case(self, test_case_data: TestCaseCreate, project_id: int, user_id: int) -> TestCaseResponse:
        """Create a new test case"""
        # Verify user and project exist
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        project = self.project_repository.get_by_id(project_id)
        if not project:
            raise ValueError("Project not found")
        
        # Check user access to project
        if not self.project_repository.user_has_access(user_id, project_id):
            raise ValueError("Access denied to project")
        
        # Create test case
        db_test_case = self.test_case_repository.create(test_case_data, project_id, user_id)
        
        # Convert to response model
        return TestCaseResponse.from_orm(db_test_case)
    
    def get_test_case(self, test_case_id: int, user_id: int) -> Optional[TestCaseResponse]:
        """Get test case by ID with user access check"""
        test_case = self.test_case_repository.get_by_id(test_case_id)
        if not test_case:
            return None
        
        # Check user access to project
        if not self.project_repository.user_has_access(user_id, test_case.project_id):
            raise ValueError("Access denied")
        
        return TestCaseResponse.from_orm(test_case)
    
    def get_project_test_cases(
        self, 
        project_id: int, 
        user_id: int, 
        query_params: Optional[TestCaseSearchQuery] = None
    ) -> TestCaseListResponse:
        """Get all test cases for a project with filtering and pagination"""
        # Check user access to project
        if not self.project_repository.user_has_access(user_id, project_id):
            raise ValueError("Access denied")
        
        # Set default pagination if not provided
        if query_params is None:
            query_params = TestCaseSearchQuery(page=1, size=10)
        
        # Calculate skip value
        skip = (query_params.page - 1) * query_params.size
        
        # Get test cases with filters
        test_cases, total = self.test_case_repository.get_by_project(
            project_id, skip, query_params.size, query_params
        )
        
        # Convert to response models
        test_case_responses = [TestCaseResponse.from_orm(test_case) for test_case in test_cases]
        
        # Calculate pagination info
        has_next = skip + query_params.size < total
        has_prev = query_params.page > 1
        
        return TestCaseListResponse(
            test_cases=test_case_responses,
            total=total,
            page=query_params.page,
            size=query_params.size,
            has_next=has_next,
            has_prev=has_prev
        )
    
    def update_test_case(
        self, 
        test_case_id: int, 
        update_data: TestCaseUpdate, 
        user_id: int
    ) -> Optional[TestCaseResponse]:
        """Update a test case"""
        # Get existing test case
        test_case = self.test_case_repository.get_by_id(test_case_id)
        if not test_case:
            return None
        
        # Check user access to project
        if not self.project_repository.user_has_access(user_id, test_case.project_id):
            raise ValueError("Access denied")
        
        # Update test case
        db_test_case = self.test_case_repository.update(test_case_id, update_data)
        if not db_test_case:
            return None
        
        return TestCaseResponse.from_orm(db_test_case)
    
    def delete_test_case(self, test_case_id: int, user_id: int) -> bool:
        """Delete a test case"""
        # Get existing test case
        test_case = self.test_case_repository.get_by_id(test_case_id)
        if not test_case:
            return False
        
        # Check user access to project
        if not self.project_repository.user_has_access(user_id, test_case.project_id):
            raise ValueError("Access denied")
        
        return self.test_case_repository.delete(test_case_id)
    
    def get_test_case_stats(self, project_id: int, user_id: int) -> Dict[str, Any]:
        """Get test case statistics for a project"""
        # Check user access to project
        if not self.project_repository.user_has_access(user_id, project_id):
            raise ValueError("Access denied")
        
        # Get status distribution
        status_counts = self.test_case_repository.get_project_test_cases_count(project_id)
        
        # Get priority distribution
        priority_counts = self.test_case_repository.get_priority_distribution(project_id)
        
        # Get type distribution
        type_counts = self.test_case_repository.get_type_distribution(project_id)
        
        # Get total count
        total_count = self.test_case_repository.count(project_id=project_id)
        
        # Get counts by creator
        from collections import defaultdict
        creator_counts = defaultdict(int)
        all_test_cases = self.test_case_repository.get_all(project_id=project_id)
        for test_case in all_test_cases:
            creator_counts[test_case.created_by] += 1
        
        return {
            'total_test_cases': total_count,
            'status_distribution': status_counts,
            'priority_distribution': priority_counts,
            'type_distribution': type_counts,
            'creator_distribution': dict(creator_counts)
        }
    
    def search_similar_test_cases(self, test_case_id: int, user_id: int) -> List[TestCaseResponse]:
        """Search for similar test cases"""
        # Get existing test case
        test_case = self.test_case_repository.get_by_id(test_case_id)
        if not test_case:
            raise ValueError("Test case not found")
        
        # Check user access to project
        if not self.project_repository.user_has_access(user_id, test_case.project_id):
            raise ValueError("Access denied")
        
        # Search for similar test cases
        similar_test_cases = self.test_case_repository.search_similar_test_cases(
            test_case.project_id, test_case.title, test_case_id
        )
        
        # Convert to response models
        return [TestCaseResponse.from_orm(test_case) for test_case in similar_test_cases]
    
    def get_test_cases_by_priority(self, project_id: int, user_id: int, priority: TestCasePriority) -> List[TestCaseResponse]:
        """Get test cases by priority"""
        # Check user access to project
        if not self.project_repository.user_has_access(user_id, project_id):
            raise ValueError("Access denied")
        
        # Get test cases by priority
        test_cases = self.test_case_repository.get_all(
            project_id=project_id, 
            priority=priority
        )
        
        # Convert to response models
        return [TestCaseResponse.from_orm(test_case) for test_case in test_cases]
    
    def get_test_cases_by_type(self, project_id: int, user_id: int, type_: TestCaseType) -> List[TestCaseResponse]:
        """Get test cases by type"""
        # Check user access to project
        if not self.project_repository.user_has_access(user_id, project_id):
            raise ValueError("Access denied")
        
        # Get test cases by type
        test_cases = self.test_case_repository.get_all(
            project_id=project_id, 
            type=type_
        )
        
        # Convert to response models
        return [TestCaseResponse.from_orm(test_case) for test_case in test_cases]
    
    def get_test_cases_by_status(self, project_id: int, user_id: int, status: TestCaseStatus) -> List[TestCaseResponse]:
        """Get test cases by status"""
        # Check user access to project
        if not self.project_repository.user_has_access(user_id, project_id):
            raise ValueError("Access denied")
        
        # Get test cases by status
        test_cases = self.test_case_repository.get_all(
            project_id=project_id, 
            status=status
        )
        
        # Convert to response models
        return [TestCaseResponse.from_orm(test_case) for test_case in test_cases]
    
    def bulk_update_test_cases_status(
        self, 
        project_id: int, 
        test_case_ids: List[int], 
        status: TestCaseStatus, 
        user_id: int
    ) -> Dict[str, Any]:
        """Bulk update test case status"""
        results = {
            'success': 0,
            'failed': 0,
            'errors': []
        }
        
        for test_case_id in test_case_ids:
            try:
                # Check user access
                test_case = self.test_case_repository.get_by_id_and_project(test_case_id, project_id)
                if not test_case:
                    results['failed'] += 1
                    results['errors'].append(f"Test case {test_case_id} not found")
                    continue
                
                if not self.project_repository.user_has_access(user_id, project_id):
                    results['failed'] += 1
                    results['errors'].append(f"Access denied for test case {test_case_id}")
                    continue
                
                # Update status
                from app.models.test_case import TestCaseUpdate
                update_data = TestCaseUpdate(status=status)
                updated_test_case = self.test_case_repository.update(test_case_id, update_data)
                
                if updated_test_case:
                    results['success'] += 1
                else:
                    results['failed'] += 1
                    results['errors'].append(f"Failed to update test case {test_case_id}")
                    
            except Exception as e:
                results['failed'] += 1
                results['errors'].append(f"Error updating test case {test_case_id}: {str(e)}")
        
        return results