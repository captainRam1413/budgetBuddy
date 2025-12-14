from flask import Blueprint, request, jsonify
from models.expense import Expense
from utils.auth import token_required

expense_bp = Blueprint('expense', __name__, url_prefix='/api/expenses')

@expense_bp.route('/', methods=['GET'])
@token_required
def get_expenses(user_id):
    """Get all expenses for the user"""
    try:
        result = Expense.get_all_by_user(user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@expense_bp.route('/category/<category_name>', methods=['GET'])
@token_required
def get_expenses_by_category(user_id, category_name):
    """Get expenses for a specific category"""
    try:
        result = Expense.get_by_category(user_id, category_name)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@expense_bp.route('/category/<category_name>/total', methods=['GET'])
@token_required
def get_category_total(user_id, category_name):
    """Get total spending for a category"""
    try:
        result = Expense.get_category_total(user_id, category_name)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@expense_bp.route('/summary', methods=['GET'])
@token_required
def get_spending_summary(user_id):
    """Get spending summary grouped by category"""
    try:
        result = Expense.get_spending_summary(user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@expense_bp.route('/', methods=['POST'])
@token_required
def create_expense(user_id):
    """Create a new expense"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'amount', 'category', 'icon', 'color']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        result = Expense.create(
            user_id=user_id,
            title=data['title'],
            amount=data['amount'],
            category=data['category'],
            icon=data['icon'],
            color=data['color']
        )
        
        return jsonify(result), 201 if result['success'] else 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@expense_bp.route('/<expense_id>', methods=['DELETE'])
@token_required
def delete_expense(user_id, expense_id):
    """Delete an expense"""
    try:
        result = Expense.delete(user_id, expense_id)
        return jsonify(result), 200 if result['success'] else 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
