"""
User service for business logic operations
"""

from typing import Optional, List
from sqlalchemy.orm import Session

from app.repositories.user_repository import UserRepository
from app.models.user import User, UserCreate, UserUpdate, UserResponse


class UserService:
    """Service class for user business logic"""
    
    def __init__(self, db: Session):
        self.db = db
        self.user_repository = UserRepository(db)
    
    def create_user(self, user_data: UserCreate) -> UserResponse:
        """Create a new user"""
        # Check if email or username already exists
        if self.user_repository.email_exists(user_data.email):
            raise ValueError("Email already registered")
        
        if self.user_repository.username_exists(user_data.username):
            raise ValueError("Username already taken")
        
        # Create user
        db_user = self.user_repository.create(user_data)
        
        # Convert to response model (exclude password hash)
        return UserResponse(
            id=db_user.id,
            username=db_user.username,
            email=db_user.email,
            full_name=db_user.full_name,
            is_active=db_user.is_active,
            created_at=db_user.created_at,
            updated_at=db_user.updated_at
        )
    
    def get_user_by_id(self, user_id: int) -> Optional[UserResponse]:
        """Get user by ID"""
        db_user = self.user_repository.get_by_id(user_id)
        if not db_user:
            return None
        
        return UserResponse.from_orm(db_user)
    
    def get_user_by_username(self, username: str) -> Optional[UserResponse]:
        """Get user by username"""
        db_user = self.user_repository.get_by_username(username)
        if not db_user:
            return None
        
        return UserResponse.from_orm(db_user)
    
    def get_user_by_email(self, email: str) -> Optional[UserResponse]:
        """Get user by email"""
        db_user = self.user_repository.get_by_email(email)
        if not db_user:
            return None
        
        return UserResponse.from_orm(db_user)
    
    def get_all_users(
        self, 
        skip: int = 0, 
        limit: int = 100,
        username: Optional[str] = None,
        email: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> List[UserResponse]:
        """Get all users with optional filters"""
        users = self.user_repository.get_all(skip, limit, username, email, is_active)
        return [UserResponse.from_orm(user) for user in users]
    
    def update_user(self, user_id: int, update_data: UserUpdate) -> Optional[UserResponse]:
        """Update a user"""
        # Check if email is being updated and if it conflicts with existing user
        if update_data.email:
            existing_user = self.user_repository.get_by_email(update_data.email)
            if existing_user and existing_user.id != user_id:
                raise ValueError("Email already registered")
        
        # Update user
        db_user = self.user_repository.update(user_id, update_data)
        if not db_user:
            return None
        
        return UserResponse.from_orm(db_user)
    
    def delete_user(self, user_id: int) -> bool:
        """Delete a user (soft delete)"""
        return self.user_repository.delete(user_id)
    
    def authenticate_user(self, email: str, password: str) -> Optional[UserResponse]:
        """Authenticate user by email and password"""
        db_user = self.user_repository.authenticate(email, password)
        if not db_user:
            return None
        
        return UserResponse.from_orm(db_user)
    
    def is_email_available(self, email: str) -> bool:
        """Check if email is available for registration"""
        return not self.user_repository.email_exists(email)
    
    def is_username_available(self, username: str) -> bool:
        """Check if username is available for registration"""
        return not self.user_repository.username_exists(username)