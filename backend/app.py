from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database import Database

# Import route blueprints
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.category_routes import category_bp
from routes.expense_routes import expense_bp

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS for all routes
CORS(app)

# Initialize database connection on first request
@app.before_request
def init_db():
    if Database.db is None:
        Database.initialize()

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(user_bp)
app.register_blueprint(category_bp)
app.register_blueprint(expense_bp)

# Root route
@app.route('/')
def index():
    return jsonify({
        'message': 'BudgetBuddy API',
        'version': '1.0.0',
        'status': 'running'
    })

# Health check route
@app.route('/health')
def health():
    return jsonify({'status': 'healthy'}), 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'message': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=Config.PORT,
        debug=Config.DEBUG
    )
