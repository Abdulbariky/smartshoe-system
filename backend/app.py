from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import config
from models import db, migrate
from routes.auth import auth_bp
from routes.products import products_bp
from routes.inventory import inventory_bp
from routes.sales import sales_bp
from routes.categories import categories_bp

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # CORS configuration
    CORS(app)
    app.after_request(add_cors_headers)
    
    # Disable strict slashes
    app.url_map.strict_slashes = False
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    JWTManager(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(inventory_bp, url_prefix='/api/inventory')
    app.register_blueprint(sales_bp, url_prefix='/api/sales')
    app.register_blueprint(categories_bp, url_prefix='/api')
    
    @app.route('/')
    def home():
        return jsonify({
            "message": "SmartShoe API Running ✅", 
            "database": "Connected",
            "version": "1.0.0",
            "status": "All systems operational"
        })
    
    @app.route('/test-cors', methods=['GET', 'POST', 'OPTIONS'])
    def test_cors():
        print(f"Test CORS - Method: {request.method}")
        return jsonify({"message": "CORS test working", "method": request.method})
    
    return app

def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        from models.user import User
        from models.product import Product
        from models.inventory import InventoryItem
        from models.sale import Sale, SaleItem
        
        db.create_all()
        print("✅ Database tables created!")
        print("🚀 Server starting on http://localhost:5000")
        print("🔗 CORS enabled for http://localhost:5173")
    
    app.run(debug=True, host='127.0.0.1', port=5000)