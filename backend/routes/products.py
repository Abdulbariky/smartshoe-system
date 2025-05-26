from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db
from models.product import Product
import uuid

products_bp = Blueprint('products', __name__)

@products_bp.route('/', methods=['GET'])
@jwt_required()
def list_products():
    products = Product.query.all()
    return jsonify({
        'products': [product.to_dict() for product in products],
        'count': len(products)
    }), 200

@products_bp.route('/', methods=['POST'])
@jwt_required()
def add_product():
    data = request.get_json()
    
    required_fields = ['name', 'category', 'size', 'color', 'purchase_price', 'retail_price', 'wholesale_price']
    if not all(field in data for field in required_fields):
        return jsonify({'message': 'Missing required fields'}), 400
    
    # Generate SKU
    sku = f"{data['name'][:3].upper()}-{data['category'][:3].upper()}-{uuid.uuid4().hex[:6].upper()}"
    
    product = Product(
        name=data['name'],
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
    
    return jsonify({
        'message': 'Product created successfully',
        'product': product.to_dict()
    }), 201