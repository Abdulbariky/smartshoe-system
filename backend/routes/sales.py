import pytz
nairobi_tz = pytz.timezone("Africa/Nairobi")

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db
from models.sale import Sale, SaleItem
from models.inventory import InventoryItem
from models.product import Product
from datetime import datetime, timedelta
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
    invoice_number = f"INV-{datetime.now(nairobi_tz).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
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

@sales_bp.route('/<int:sale_id>', methods=['GET'])
@jwt_required()
def get_sale_details(sale_id):
    try:
        print(f"🔍 Backend: Fetching sale details for ID: {sale_id}")
        
        sale = Sale.query.get_or_404(sale_id)
        print(f"📦 Backend: Found sale: {sale.invoice_number}")
        
        # Get all sale items with product details
        items = []
        for sale_item in sale.items:
            product = sale_item.product
            if not product:
                print(f"⚠️ Warning: Product {sale_item.product_id} not found")
                continue
                
            item_detail = {
                'id': sale_item.id,
                'product_id': sale_item.product_id,
                'product_name': product.name,
                'product_brand': product.brand,
                'product_size': product.size,
                'product_color': product.color,
                'quantity': sale_item.quantity,
                'unit_price': float(sale_item.unit_price),
                'subtotal': float(sale_item.quantity * sale_item.unit_price)
            }
            items.append(item_detail)
            print(f"📦 Added item: {product.name} x{sale_item.quantity}")
        
        response_data = {
            'id': sale.id,
            'invoice_number': sale.invoice_number,
            'sale_type': sale.sale_type,
            'total_amount': float(sale.total_amount),
            'payment_method': sale.payment_method,
            'created_at': sale.created_at.isoformat(),
            'items_count': len(items),
            'items': items
        }
        
        print(f"✅ Backend: Returning {len(items)} items for sale {sale.invoice_number}")
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"❌ Backend Error getting sale details: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/analytics/overview', methods=['GET'])
@jwt_required()
def get_sales_analytics():
    try:
        print("📊 Getting sales analytics overview...")
        
        total_sales = db.session.query(db.func.sum(Sale.total_amount)).scalar() or 0
        total_transactions = Sale.query.count()
        
        today = datetime.now(nairobi_tz).date()
        today_sales = db.session.query(db.func.sum(Sale.total_amount)).filter(
            db.func.date(Sale.created_at) == today
        ).scalar() or 0
        
        return jsonify({
            'success': True,
            'overview': {
                'total_sales': float(total_sales),
                'total_transactions': total_transactions,
                'today_sales': float(today_sales),
                'average_sale': float(total_sales / total_transactions) if total_transactions > 0 else 0
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting sales analytics: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

@sales_bp.route('/analytics/sales-trend', methods=['GET'])
@jwt_required()
def get_sales_trend():
    try:
        print("📊 Getting sales trend...")
        
        trend_data = []
        today = datetime.now(nairobi_tz).date()
        
        for i in range(6, -1, -1):
            date = today - timedelta(days=i)
            day_name = date.strftime('%a')
            
            daily_sales = db.session.query(db.func.sum(Sale.total_amount)).filter(
                db.func.date(Sale.created_at) == date
            ).scalar() or 0
            
            daily_transactions = db.session.query(db.func.count(Sale.id)).filter(
                db.func.date(Sale.created_at) == date
            ).scalar() or 0
            
            trend_data.append({
                'name': day_name,
                'sales': float(daily_sales),
                'transactions': int(daily_transactions),
                'date': date.isoformat()
            })
        
        return jsonify({
            'success': True,
            'trend': trend_data
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting sales trend: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500
