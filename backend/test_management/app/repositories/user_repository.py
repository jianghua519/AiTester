"""
User repository for data access operations
"""

from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.user import UserDB, UserCreate, UserUpdate


class UserRepository:
    """Repository class for user data access operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, user_data: UserCreate) -> UserDB:
        """Create a new user"""
        # Note: In a real implementation, password would be hashed here
        # For now, we'll store it as-is (should be bcrypt hashed in production)
        db_user = UserDB(
            username=user_data.username,
            email=user_data.email,
            password_hash=user_data.password,  # Should be hashed!
            full_name=user_data.full_name,
            is_active=user_data.is_active
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user
    
    def get_by_id(self, user_id: int) -> Optional[UserDB]:
        """Get user by ID"""
        return self.db.query(UserDB).filter(UserDB.id == user_id).first()
    
    def get_by_username(self, username: str) -> Optional[UserDB]:
        """Get user by username"""
        return self.db.query(UserDB).filter(UserDB.username == username).first()
    
    def get_by_email(self, email: str) -> Optional[UserDB]:
        """Get user by email"""
        return self.db.query(UserDB).filter(UserDB.email == email).first()
    
    def get_all(
        self, 
        skip: int = 0, 
        limit: int = 100,
        username: Optional[str] = None,
        email: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> List[UserDB]:
        """Get all users with optional filters"""
        query = self.db.query(UserDB)
        
        if username:
            query = query.filter(UserDB.username.ilike(f"%{username}%"))
        
        if email:
            query = query.filter(UserDB.email.ilike(f"%{email}%"))
        
        if is_active is not None:
            query = query.filter(UserDB.is_active == is_active)
        
        return query.offset(skip).limit(limit).all()
    
    def update(self, user_id: int, update_data: UserUpdate) -> Optional[UserDB]:
        """Update a user"""
        db_user = self.get_by_id(user_id)
        if not db_user:
            return None
        
        update_dict = update_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(db_user, field, value)
        
        self.db.commit()
        self.db.refresh(db_user)
        return db_user
    
    def delete(self, user_id: int) -> bool:
        """Delete a user (soft delete by setting is_active=False)"""
        db_user = self.get_by_id(user_id)
        if not db_user:
            return False
        
        db_user.is_active = False
        self.db.commit()
        return True
    
    def authenticate(self, email: str, password: str) -> Optional[UserDB]:
        """Authenticate user by email and password"""
        user = self.get_by_email(email)
        if not user or not user.is_active:
            return None
        
        # Note: In production, use bcrypt to verify password
        # if bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        #     return user
        
        # For demo purposes, simple string comparison
        if user.password_hash == password:
            return user
        
        return None
    
    def email_exists(self, email: str) -> bool:
        """Check if email already exists"""
        return self.db.query(UserDB).filter(UserDB.email == email).first() is not None
    
    def username_exists(self, username: str) -> bool:
        """Check if username already exists"""
        return self.db.query(UserDB).filter(UserDB.username == username).first() is not None