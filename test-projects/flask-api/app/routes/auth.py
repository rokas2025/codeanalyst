"""
Authentication routes
Handles user registration, login, and token management
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models.user import User
from app.services.user_service import UserService
from app.utils.validators import validate_email, validate_password


auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
user_service = UserService()


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user
    
    Request Body:
        email (str): User email
        username (str): Username
        password (str): Password (min 8 characters)
    
    Returns:
        JSON response with user data and access token
    
    Raises:
        400: Invalid input or user already exists
    """
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ['email', 'username', 'password']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    email = data['email']
    username = data['username']
    password = data['password']
    
    # Validate email format
    if not validate_email(email):
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Validate password strength
    password_errors = validate_password(password)
    if password_errors:
        return jsonify({'error': 'Invalid password', 'details': password_errors}), 400
    
    # Check if user already exists
    if user_service.get_by_email(email):
        return jsonify({'error': 'Email already registered'}), 400
    
    if user_service.get_by_username(username):
        return jsonify({'error': 'Username already taken'}), 400
    
    # Create new user
    user = user_service.create_user(email, username, password)
    
    # Generate access token
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict(),
        'access_token': access_token
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate user and return access token
    
    Request Body:
        email (str): User email
        password (str): User password
    
    Returns:
        JSON response with access token
    
    Raises:
        401: Invalid credentials
    """
    data = request.get_json()
    
    if not all(k in data for k in ['email', 'password']):
        return jsonify({'error': 'Missing email or password'}), 400
    
    email = data['email']
    password = data['password']
    
    # Find user by email
    user = user_service.get_by_email(email)
    
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 401
    
    # Generate access token
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get current authenticated user information
    
    Requires:
        JWT token in Authorization header
    
    Returns:
        JSON response with user data
    """
    user_id = get_jwt_identity()
    user = user_service.get_by_id(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200

