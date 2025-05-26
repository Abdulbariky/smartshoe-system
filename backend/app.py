from flask import Flask, jsonify
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
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    JWTManager(app)
    CORS(app)
    
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
            "endpoints": {
                "authentication": [
                    "/api/auth/register", 
                    "/api/auth/login"
                ],
                "products": [
                    "GET/POST /api/products",
                    "GET/PUT/DELETE /api/products/{id}"
                ],
                "inventory": [
                    "POST /api/inventory/stock-in",
                    "GET /api/inventory/transactions"
                ],
                "sales": [
                    "GET/POST /api/sales",
                    "GET /api/sales/{id}"
                ]
            },
            "status": "All systems operational"
        })
    
    @app.route('/health')
    def health_check():
        return jsonify({
            "status": "healthy",
            "database": "connected",
            "timestamp": db.func.now()
        })
    
    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        # Import models to register them
        from models.user import User
        from models.product import Product
        from models.inventory import InventoryItem
        from models.sale import Sale, SaleItem
        
        db.create_all()
        print("✅ Database tables created!")
        print("🚀 SmartShoe Inventory API starting...")
        print("📊 Available endpoints:")
        print("   - Authentication: /api/auth/register, /api/auth/login")
        print("   - Products: /api/products")
        print("   - Inventory: /api/inventory/stock-in, /api/inventory/transactions")
        print("   - Sales: /api/sales")
        print("🌐 Server running at: http://localhost:5000")
    
    app.run(debug=True)