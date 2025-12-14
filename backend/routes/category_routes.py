from flask import Blueprint, request, jsonify
from models.category import Category
from utils.auth import token_required

category_bp = Blueprint('category', __name__, url_prefix='/api/categories')

@category_bp.route('/', methods=['GET'])
@token_required
def get_categories(user_id):
    """Get all categories for the user"""
    try:
        result = Category.get_all_by_user(user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@category_bp.route('/', methods=['POST'])
@token_required
def create_category(user_id):
    """Create a new category"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'icon', 'color']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        result = Category.create(
            user_id=user_id,
            name=data['name'],
            icon=data['icon'],
            color=data['color'],
            budget=data.get('budget', 0)
        )
        
        return jsonify(result), 201 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@category_bp.route('/bulk', methods=['POST'])
@token_required
def create_multiple_categories(user_id):
    """Create multiple categories at once"""
    try:
        data = request.get_json()
        
        if 'categories' not in data or not isinstance(data['categories'], list):
            return jsonify({'success': False, 'message': 'categories array is required'}), 400
        
        result = Category.create_multiple(user_id, data['categories'])
        return jsonify(result), 201 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@category_bp.route('/<category_name>/budget', methods=['PUT'])
@token_required
def update_category_budget(user_id, category_name):
    """Update category budget"""
    try:
        data = request.get_json()
        
        if 'budget' not in data:
            return jsonify({'success': False, 'message': 'budget is required'}), 400
        
        result = Category.update_budget(user_id, category_name, data['budget'])
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@category_bp.route('/budgets/bulk', methods=['PUT'])
@token_required
def update_multiple_budgets(user_id):
    """Update multiple category budgets at once"""
    try:
        data = request.get_json()
        
        if 'budgets' not in data or not isinstance(data['budgets'], dict):
            return jsonify({'success': False, 'message': 'budgets object is required'}), 400
        
        result = Category.update_multiple_budgets(user_id, data['budgets'])
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@category_bp.route('/<category_name>', methods=['DELETE'])
@token_required
def delete_category(user_id, category_name):
    """Delete a category"""
    try:
        result = Category.delete(user_id, category_name)
        return jsonify(result), 200 if result['success'] else 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
