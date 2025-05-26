from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db
from models.inventory import InventoryItem
from models.product import Product

inventory_bp = Blueprint('inventory', __name__)

@inventory_bp.route('/stock-in', methods=['POST'])
@jwt_required()
def stock_in():
    data = request.get_json()
    
    if not data or not data.get('product_id') or not data.get('quantity'):
        return jsonify({'message': 'Missing required fields'}), 400
    
    # Check if product exists
    product = Product.query.get(data['product_id'])
    if not product:
        return jsonify({'message': 'Product not found'}), 404
    
    transaction = InventoryItem(
        product_id=data['product_id'],
        transaction_type='in',
        quantity=int(data['quantity']),
        batch_number=data.get('batch_number', 'BATCH-001'),
        notes=data.get('notes', '')
    )
    
    db.session.add(transaction)
    db.session.commit()
    
    return jsonify({
        'message': 'Stock added successfully',
        'transaction_id': transaction.id,
        'product_name': product.name,
        'new_stock': product.get_current_stock()
    }), 201

@inventory_bp.route('/transactions', methods=['GET'])
@jwt_required()
def list_transactions():
    transactions = InventoryItem.query.order_by(InventoryItem.created_at.desc()).limit(50).all()
    
    result = []
    for t in transactions:
        result.append({
            'id': t.id,
            'product_id': t.product_id,
            'product_name': t.product.name if t.product else 'Unknown',
            'transaction_type': t.transaction_type,
            'quantity': t.quantity,
            'batch_number': t.batch_number,
            'notes': t.notes,
            'created_at': t.created_at.isoformat()
        })
    
    return jsonify({'transactions': result, 'count': len(result)}), 200