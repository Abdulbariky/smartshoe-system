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

# NEW: Get sale details with actual items
@sales_bp.route('/<int:sale_id>', methods=['GET'])
@jwt_required()
def get_sale_details(sale_id):
    try:
        sale = Sale.query.get_or_404(sale_id)
        
        # Get all sale items with product details
        items = []
        for sale_item in sale.items:
            product = sale_item.product
            items.append({
                'id': sale_item.id,
                'product_id': sale_item.product_id,
                'product_name': f"{product.name} - {product.brand} ({product.size}, {product.color})",
                'quantity': sale_item.quantity,
                'unit_price': sale_item.unit_price,
                'subtotal': sale_item.quantity * sale_item.unit_price
            })
        
        return jsonify({
            'success': True,
            'sale': {
                'id': sale.id,
                'invoice_number': sale.invoice_number,
                'sale_type': sale.sale_type,
                'total_amount': sale.total_amount,
                'payment_method': sale.payment_method,
                'created_at': sale.created_at.isoformat(),
                'items': items
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# NEW: Get real product performance analytics
@sales_bp.route('/analytics/product-performance', methods=['GET'])
@jwt_required()
def get_product_performance():
    try:
        # Query actual sales data from database
        query = """
        SELECT 
            p.id,
            p.name,
            p.brand,
            COALESCE(SUM(si.quantity), 0) as total_quantity_sold,
            COALESCE(SUM(si.quantity * si.unit_price), 0) as total_revenue,
            p.current_stock
        FROM products p
        LEFT JOIN sale_items si ON p.id = si.product_id
        GROUP BY p.id, p.name, p.brand
        ORDER BY total_quantity_sold DESC
        """
        
        result = db.session.execute(query)
        products = []
        
        for row in result:
            # Get current stock properly
            product = Product.query.get(row[0])
            current_stock = product.get_current_stock() if product else 0
            
            products.append({
                'id': row[0],
                'name': row[1],
                'brand': row[2],
                'units_sold': int(row[3]) if row[3] else 0,
                'revenue': float(row[4]) if row[4] else 0.0,
                'stock': current_stock
            })
        
        return jsonify({
            'success': True,
            'products': products
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting product performance: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# NEW: Get real sales analytics data  
@sales_bp.route('/analytics/overview', methods=['GET'])
@jwt_required()
def get_sales_analytics():
    try:
        # Get actual sales summary
        total_sales = db.session.query(db.func.sum(Sale.total_amount)).scalar() or 0
        total_transactions = Sale.query.count()
        
        # Get today's sales
        today = datetime.now().date()
        today_sales = db.session.query(db.func.sum(Sale.total_amount)).filter(
            db.func.date(Sale.created_at) == today
        ).scalar() or 0
        
        # Get sales by category (real data)
        category_query = """
        SELECT 
            p.category,
            SUM(si.quantity * si.unit_price) as revenue
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        GROUP BY p.category
        ORDER BY revenue DESC
        """
        
        category_result = db.session.execute(category_query)
        categories = []
        colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d']
        
        for i, row in enumerate(category_result):
            categories.append({
                'name': row[0],
                'value': float(row[1]),
                'color': colors[i % len(colors)]
            })
        
        # Get brand performance (real data)
        brand_query = """
        SELECT 
            p.brand,
            SUM(si.quantity * si.unit_price) as sales,
            SUM(si.quantity) as units
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        GROUP BY p.brand
        ORDER BY sales DESC
        LIMIT 5
        """
        
        brand_result = db.session.execute(brand_query)
        brands = []
        
        for row in brand_result:
            brands.append({
                'brand': row[0],
                'sales': float(row[1]),
                'units': int(row[2])
            })
        
        return jsonify({
            'success': True,
            'overview': {
                'total_sales': total_sales,
                'total_transactions': total_transactions,
                'today_sales': today_sales,
                'average_sale': total_sales / total_transactions if total_transactions > 0 else 0
            },
            'categories': categories,
            'brands': brands
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting sales analytics: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500