from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db
from models.sale import Sale, SaleItem
from models.inventory import InventoryItem
from models.product import Product
from datetime import datetime
import uuid

sales_bp = Blueprint('sales', __name__)

@sales_bp.route('/', methods=['POST'])
@jwt_required()
def create_sale():
    data = request.get_json()
    
    if not data or not data.get('items') or not data.get('sale_type'):
        return jsonify({'message': 'Missing required fields (items, sale_type)'}), 400
    
    # Validate products and stock
    for item in data['items']:
        if not item.get('product_id') or not item.get('quantity') or not item.get('unit_price'):
            return jsonify({'message': 'Missing fields in sale items'}), 400
        
        product = Product.query.get(item['product_id'])
        if not product:
            return jsonify({'message': f'Product {item["product_id"]} not found'}), 404
        
        current_stock = product.get_current_stock()
        if current_stock < item['quantity']:
            return jsonify({
                'message': f'Insufficient stock for {product.name}. Available: {current_stock}'
            }), 400
    
    # Calculate total
    total_amount = sum(item['quantity'] * item['unit_price'] for item in data['items'])
    
    # Create sale
    invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    sale = Sale(
        invoice_number=invoice_number,
        sale_type=data['sale_type'],
        total_amount=total_amount,
        payment_method=data.get('payment_method', 'cash')
    )
    
    db.session.add(sale)
    db.session.flush()  # Get sale ID
    
    # Add sale items and update inventory
    for item_data in data['items']:
        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=item_data['product_id'],
            quantity=item_data['quantity'],
            unit_price=item_data['unit_price']
        )
        db.session.add(sale_item)
        
        # Update inventory (stock out)
        inventory_out = InventoryItem(
            product_id=item_data['product_id'],
            transaction_type='out',
            quantity=item_data['quantity'],
            notes=f"Sale: {invoice_number}"
        )
        db.session.add(inventory_out)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Sale created successfully',
        'invoice_number': invoice_number,
        'total_amount': total_amount,
        'sale_id': sale.id
    }), 201

@sales_bp.route('/', methods=['GET'])
@jwt_required()
def list_sales():
    sales = Sale.query.order_by(Sale.created_at.desc()).limit(50).all()
    
    result = []
    for s in sales:
        result.append({
            'id': s.id,
            'invoice_number': s.invoice_number,
            'sale_type': s.sale_type,
            'total_amount': s.total_amount,
            'payment_method': s.payment_method,
            'created_at': s.created_at.isoformat(),
            'items_count': len(s.items)
        })
    
    return jsonify({'sales': result, 'count': len(result)}), 200