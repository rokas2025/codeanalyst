"""
User service layer
Business logic for user operations
"""
from typing import Optional, List
from app.models.user import User
from app.database import db_session


class UserService:
    """
    Service class for user-related operations
    Handles business logic and database interactions
    """
    
    def create_user(self, email: str, username: str, password: str) -> User:
        """
        Create a new user
        
        Args:
            email: User email
            username: Username
            password: Plain text password
        
        Returns:
            User: Created user object
        """
        user = User(email=email, username=username)
        user.set_password(password)
        
        db_session.add(user)
        db_session.commit()
        
        return user
    
    def get_by_id(self, user_id: int) -> Optional[User]:
        """
        Get user by ID
        
        Args:
            user_id: User ID
        
        Returns:
            User object or None if not found
        """
        return db_session.query(User).filter(User.id == user_id).first()
    
    def get_by_email(self, email: str) -> Optional[User]:
        """
        Get user by email
        
        Args:
            email: User email
        
        Returns:
            User object or None if not found
        """
        return db_session.query(User).filter(User.email == email).first()
    
    def get_by_username(self, username: str) -> Optional[User]:
        """
        Get user by username
        
        Args:
            username: Username
        
        Returns:
            User object or None if not found
        """
        return db_session.query(User).filter(User.username == username).first()
    
    def get_all_users(self, limit: int = 100, offset: int = 0) -> List[User]:
        """
        Get all users with pagination
        
        Args:
            limit: Maximum number of users to return
            offset: Number of users to skip
        
        Returns:
            List of User objects
        """
        return db_session.query(User)\
            .filter(User.is_active == True)\
            .limit(limit)\
            .offset(offset)\
            .all()
    
    def update_user(self, user_id: int, **kwargs) -> Optional[User]:
        """
        Update user information
        
        Args:
            user_id: User ID
            **kwargs: Fields to update
        
        Returns:
            Updated User object or None if not found
        """
        user = self.get_by_id(user_id)
        
        if not user:
            return None
        
        # Update allowed fields
        allowed_fields = ['email', 'username', 'is_active']
        for field in allowed_fields:
            if field in kwargs:
                setattr(user, field, kwargs[field])
        
        # Update password if provided
        if 'password' in kwargs:
            user.set_password(kwargs['password'])
        
        db_session.commit()
        return user
    
    def delete_user(self, user_id: int) -> bool:
        """
        Soft delete user (deactivate)
        
        Args:
            user_id: User ID
        
        Returns:
            bool: True if deleted, False if not found
        """
        user = self.get_by_id(user_id)
        
        if not user:
            return False
        
        user.is_active = False
        db_session.commit()
        
        return True

