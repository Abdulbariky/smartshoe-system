from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db
from models.product import Product
import uuid

products_bp = Blueprint('products', __name__)

# ✅ NUCLEAR FIX: Define routes without trailing slash confusion
@products_bp.route('', methods=['GET', 'POST', 'OPTIONS'])  # Empty string, not '/'
@products_bp.route('/', methods=['GET', 'POST', 'OPTIONS'])  # Also handle with slash
def handle_products():
    print(f"🔍 Request method: {request.method}")
    print(f"🔍 Request path: {request.path}")
    
    # Handle OPTIONS for CORS - NO JWT CHECK HERE
    if request.method == 'OPTIONS':
        print("✅ Handling OPTIONS request")
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        return response, 200
    
    # Handle GET request
    if request.method == 'GET':
        return get_all_products()
    
    # Handle POST request  
    if request.method == 'POST':
        return create_new_product()

@jwt_required()
def get_all_products():
    try:
        print("🔍 Getting all products...")
        products = Product.query.order_by(Product.created_at.desc()).all()
        return jsonify({
            'success': True,
            'products': [product.to_dict() for product in products],
            'count': len(products)
        }), 200
    except Exception as e:
        print(f"❌ Error getting products: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@jwt_required()
def create_new_product():
    try:
        data = request.get_json()
        print(f"🔍 Creating product with data: {data}")

        # Validate required fields
        required_fields = ['name', 'brand', 'category', 'size', 'color', 
                          'purchase_price', 'retail_price', 'wholesale_price']
        
        missing = [field for field in required_fields if not data.get(field)]
        if missing:
            return jsonify({
                'success': False, 
                'message': f'Missing required fields: {missing}'
            }), 400

        # Generate SKU
        if not data.get('sku'):
            sku = f"{data['brand'][:2].upper()}-{data['category'][:3].upper()}-{uuid.uuid4().hex[:6].upper()}"
        else:
            sku = data['sku']
            if Product.query.filter_by(sku=sku).first():
                return jsonify({'success': False, 'message': 'SKU already exists'}), 400

        # Create product
        product = Product(
            name=data['name'],
            brand=data['brand'],
            category=data['category'],
            size=data['size'],
            color=data['color'],
            purchase_price=float(data['purchase_price']),
            retail_price=float(data['retail_price']),
            wholesale_price=float(data['wholesale_price']),
            supplier=data.get('supplier', ''),
            sku=sku
        )

        db.session.add(product)
        db.session.commit()
        
        print(f"✅ Product created: {product.name} with SKU: {sku}")

        return jsonify({
            'success': True,
            'message': 'Product created successfully',
            'product': product.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"❌ Error creating product: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# Handle individual product operations
@products_bp.route('/<int:product_id>', methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
def handle_single_product(product_id):
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        return response, 200
    
    if request.method == 'GET':
        return get_product_by_id(product_id)
    elif request.method == 'PUT':
        return update_product_by_id(product_id)
    elif request.method == 'DELETE':
        return delete_product_by_id(product_id)

@jwt_required()
def get_product_by_id(product_id):
    try:
        product = Product.query.get_or_404(product_id)
        return jsonify({
            'success': True,
            'product': product.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@jwt_required()
def update_product_by_id(product_id):
    try:
        product = Product.query.get_or_404(product_id)
        data = request.get_json()

        # Update fields
        updateable_fields = ['name', 'brand', 'category', 'size', 'color', 'supplier']
        for field in updateable_fields:
            if field in data:
                setattr(product, field, data[field])

        # Update price fields
        price_fields = ['purchase_price', 'retail_price', 'wholesale_price']
        for field in price_fields:
            if field in data:
                setattr(product, field, float(data[field]))

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Product updated successfully',
            'product': product.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@jwt_required()
def delete_product_by_id(product_id):
    try:
        product = Product.query.get_or_404(product_id)
        
        # Check stock before deletion
        if hasattr(product, 'get_current_stock') and product.get_current_stock() > 0:
            return jsonify({
                'success': False,
                'message': 'Cannot delete product with existing stock'
            }), 400

        db.session.delete(product)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Product deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500