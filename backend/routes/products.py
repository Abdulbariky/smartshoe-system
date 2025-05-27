from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db
from models.product import Product
import uuid

products_bp = Blueprint('products', __name__)

@products_bp.route('/', methods=['GET', 'OPTIONS'])
@jwt_required()
def list_products():
    if request.method == 'OPTIONS':
        return '', 200
    try:
        products = Product.query.order_by(Product.created_at.desc()).all()
        return jsonify({
            'success': True,
            'products': [product.to_dict() for product in products],
            'count': len(products)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@products_bp.route('/', methods=['POST', 'OPTIONS'])
@jwt_required()
def add_product():
    if request.method == 'OPTIONS':
        return '', 200
    try:
        data = request.get_json()

        required_fields = ['name', 'brand', 'category', 'size', 'color', 
                          'purchase_price', 'retail_price', 'wholesale_price']
        if not all(field in data for field in required_fields):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        if 'sku' in data and Product.query.filter_by(sku=data['sku']).first():
            return jsonify({'success': False, 'message': 'SKU already exists'}), 400
        
        if 'sku' not in data or not data['sku']:
            sku = f"{data['brand'][:2].upper()}-{data['category'][:3].upper()}-{uuid.uuid4().hex[:6].upper()}"
            data['sku'] = sku
        
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
            sku=data['sku']
        )
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product created successfully',
            'product': product.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@products_bp.route('/<int:id>', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_product(id):
    if request.method == 'OPTIONS':
        return '', 200
    try:
        product = Product.query.get(id)
        if not product:
            return jsonify({'success': False, 'message': 'Product not found'}), 404
        
        data = request.get_json()

        if 'name' in data:
            product.name = data['name']
        if 'brand' in data:
            product.brand = data['brand']
        if 'category' in data:
            product.category = data['category']
        if 'size' in data:
            product.size = data['size']
        if 'color' in data:
            product.color = data['color']
        if 'purchase_price' in data:
            product.purchase_price = float(data['purchase_price'])
        if 'retail_price' in data:
            product.retail_price = float(data['retail_price'])
        if 'wholesale_price' in data:
            product.wholesale_price = float(data['wholesale_price'])
        if 'supplier' in data:
            product.supplier = data['supplier']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product updated successfully',
            'product': product.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@products_bp.route('/<int:id>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def delete_product(id):
    if request.method == 'OPTIONS':
        return '', 200
    try:
        product = Product.query.get(id)
        if not product:
            return jsonify({'success': False, 'message': 'Product not found'}), 404
        
        if product.get_current_stock() > 0:
            return jsonify({
                'success': False, 
                'message': 'Cannot delete product with existing stock. Please clear inventory first.'
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
