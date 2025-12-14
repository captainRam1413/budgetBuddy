from flask import Blueprint, request, jsonify
from models.user import User
from utils.auth import token_required

user_bp = Blueprint('user', __name__, url_prefix='/api/user')

@user_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(user_id):
    """Get user profile"""
    try:
        result = User.get_by_id(user_id)
        if result['success']:
            return jsonify(result), 200
        return jsonify(result), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@user_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(user_id):
    """Update user profile"""
    try:
        data = request.get_json()
        result = User.update_profile(
            user_id=user_id,
            name=data.get('name'),
            phone=data.get('phone')
        )
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@user_bp.route('/budget', methods=['PUT'])
@token_required
def update_budget(user_id):
    """Update user's total budget"""
    try:
        data = request.get_json()
        
        if 'totalBudget' not in data:
            return jsonify({'success': False, 'message': 'totalBudget is required'}), 400
        
        result = User.update_budget(user_id, data['totalBudget'])
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@user_bp.route('/onboarding/complete', methods=['POST'])
@token_required
def complete_onboarding(user_id):
    """Mark onboarding as complete"""
    try:
        result = User.complete_onboarding(user_id)
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
