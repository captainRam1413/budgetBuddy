from flask import Blueprint, request, jsonify
from models.user import User
from utils.auth import generate_token

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'phone', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        # Create user
        result = User.create(
            name=data['name'],
            email=data['email'],
            phone=data['phone'],
            password=data['password']
        )
        
        if result['success']:
            # Generate token
            token = generate_token(result['userId'])
            return jsonify({
                'success': True,
                'message': result['message'],
                'token': token,
                'userId': result['userId']
            }), 201
        
        return jsonify(result), 400
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'email' not in data or 'password' not in data:
            return jsonify({'success': False, 'message': 'Email and password are required'}), 400
        
        # Authenticate user
        result = User.authenticate(data['email'], data['password'])
        
        if result['success']:
            # Generate token
            token = generate_token(result['user']['id'])
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'token': token,
                'user': result['user']
            }), 200
        
        return jsonify(result), 401
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
