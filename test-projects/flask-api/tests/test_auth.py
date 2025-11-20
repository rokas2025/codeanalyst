"""
Tests for authentication routes
"""
import pytest
from app import create_app
from app.models.user import User
from app.database import db_session


@pytest.fixture
def app():
    """Create and configure test app"""
    app = create_app('testing')
    yield app


@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()


class TestAuthRoutes:
    """Test authentication endpoints"""
    
    def test_register_success(self, client):
        """Test successful user registration"""
        response = client.post('/api/auth/register', json={
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'Test1234'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert 'access_token' in data
        assert data['user']['email'] == 'test@example.com'
    
    def test_register_missing_fields(self, client):
        """Test registration with missing fields"""
        response = client.post('/api/auth/register', json={
            'email': 'test@example.com'
        })
        
        assert response.status_code == 400
        assert 'error' in response.get_json()
    
    def test_register_invalid_email(self, client):
        """Test registration with invalid email"""
        response = client.post('/api/auth/register', json={
            'email': 'invalid-email',
            'username': 'testuser',
            'password': 'Test1234'
        })
        
        assert response.status_code == 400
    
    def test_register_weak_password(self, client):
        """Test registration with weak password"""
        response = client.post('/api/auth/register', json={
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'weak'
        })
        
        assert response.status_code == 400
    
    def test_login_success(self, client):
        """Test successful login"""
        # First register a user
        client.post('/api/auth/register', json={
            'email': 'login@example.com',
            'username': 'loginuser',
            'password': 'Login1234'
        })
        
        # Then login
        response = client.post('/api/auth/login', json={
            'email': 'login@example.com',
            'password': 'Login1234'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'access_token' in data
    
    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials"""
        response = client.post('/api/auth/login', json={
            'email': 'nonexistent@example.com',
            'password': 'Wrong1234'
        })
        
        assert response.status_code == 401

