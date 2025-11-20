"""
Tests for validation utilities
"""
import pytest
from app.utils.validators import validate_email, validate_password, validate_username


class TestValidators:
    """Test validation functions"""
    
    def test_validate_email_valid(self):
        """Test valid email addresses"""
        assert validate_email('test@example.com') == True
        assert validate_email('user.name@domain.co.uk') == True
        assert validate_email('user+tag@example.com') == True
    
    def test_validate_email_invalid(self):
        """Test invalid email addresses"""
        assert validate_email('invalid') == False
        assert validate_email('@example.com') == False
        assert validate_email('user@') == False
        assert validate_email('') == False
    
    def test_validate_password_valid(self):
        """Test valid passwords"""
        assert validate_password('ValidPass123') == []
        assert validate_password('Complex1Password') == []
    
    def test_validate_password_too_short(self):
        """Test password too short"""
        errors = validate_password('Short1')
        assert len(errors) > 0
        assert any('8 characters' in error for error in errors)
    
    def test_validate_password_no_uppercase(self):
        """Test password without uppercase"""
        errors = validate_password('lowercase123')
        assert any('uppercase' in error for error in errors)
    
    def test_validate_password_no_lowercase(self):
        """Test password without lowercase"""
        errors = validate_password('UPPERCASE123')
        assert any('lowercase' in error for error in errors)
    
    def test_validate_password_no_digit(self):
        """Test password without digit"""
        errors = validate_password('NoDigitsHere')
        assert any('digit' in error for error in errors)
    
    def test_validate_username_valid(self):
        """Test valid usernames"""
        assert validate_username('validuser') == []
        assert validate_username('user_123') == []
        assert validate_username('test') == []
    
    def test_validate_username_too_short(self):
        """Test username too short"""
        errors = validate_username('ab')
        assert len(errors) > 0
    
    def test_validate_username_too_long(self):
        """Test username too long"""
        errors = validate_username('a' * 25)
        assert len(errors) > 0
    
    def test_validate_username_invalid_chars(self):
        """Test username with invalid characters"""
        errors = validate_username('user@name')
        assert len(errors) > 0

