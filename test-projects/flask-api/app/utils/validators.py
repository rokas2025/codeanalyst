"""
Input validation utilities
"""
import re
from typing import List


def validate_email(email: str) -> bool:
    """
    Validate email format
    
    Args:
        email: Email string to validate
    
    Returns:
        bool: True if valid email format
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password(password: str) -> List[str]:
    """
    Validate password strength
    
    Requirements:
    - At least 8 characters
    - Contains uppercase letter
    - Contains lowercase letter
    - Contains digit
    
    Args:
        password: Password to validate
    
    Returns:
        List of error messages (empty if valid)
    """
    errors = []
    
    if len(password) < 8:
        errors.append('Password must be at least 8 characters')
    
    if not re.search(r'[A-Z]', password):
        errors.append('Password must contain at least one uppercase letter')
    
    if not re.search(r'[a-z]', password):
        errors.append('Password must contain at least one lowercase letter')
    
    if not re.search(r'\d', password):
        errors.append('Password must contain at least one digit')
    
    return errors


def validate_username(username: str) -> List[str]:
    """
    Validate username
    
    Requirements:
    - 3-20 characters
    - Alphanumeric and underscores only
    
    Args:
        username: Username to validate
    
    Returns:
        List of error messages (empty if valid)
    """
    errors = []
    
    if len(username) < 3:
        errors.append('Username must be at least 3 characters')
    
    if len(username) > 20:
        errors.append('Username must not exceed 20 characters')
    
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        errors.append('Username can only contain letters, numbers, and underscores')
    
    return errors

