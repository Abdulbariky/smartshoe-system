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

# ✅ FIXED: Product Performance with Real Profit
@sales_bp.route('/analytics/product-performance', methods=['GET'])
@jwt_required()
def get_product_performance():
    try:
        print("📊 Getting product performance with REAL profit...")
        
        # Get products with sales data
        query = """
        SELECT 
            p.id,
            p.name,
            p.brand,
            p.purchase_price,
            COALESCE(SUM(si.quantity), 0) as units_sold,
            COALESCE(SUM(si.quantity * si.unit_price), 0) as revenue,
            COALESCE(SUM(si.quantity * (si.unit_price - p.purchase_price)), 0) as actual_profit
        FROM products p
        LEFT JOIN sale_items si ON p.id = si.product_id
        LEFT JOIN sales s ON si.sale_id = s.id
        GROUP BY p.id, p.name, p.brand, p.purchase_price
        HAVING COALESCE(SUM(si.quantity), 0) > 0
        ORDER BY units_sold DESC
        LIMIT 20
        """
        
        result = db.session.execute(db.text(query))
        products = []
        
        for row in result:
            # Calculate current stock for this product using the same method as Product.get_current_stock()
            total_in = db.session.query(db.func.sum(InventoryItem.quantity)).filter_by(
                product_id=row.id, 
                transaction_type='in'
            ).scalar() or 0
            
            total_out = db.session.query(db.func.sum(InventoryItem.quantity)).filter_by(
                product_id=row.id, 
                transaction_type='out'
            ).scalar() or 0
            
            current_stock = total_in - total_out
            
            product_data = {
                'id': row.id,
                'name': row.name,
                'brand': row.brand,
                'units_sold': int(row.units_sold),
                'revenue': float(row.revenue),
                'actual_profit': float(row.actual_profit),  # ✅ Fixed: using 'actual_profit'
                'stock': int(current_stock),
                'profit_margin': round((row.actual_profit / row.revenue * 100), 2) if row.revenue > 0 else 0
            }
            products.append(product_data)
            print(f"📦 Product: {row.name} - Units: {row.units_sold}, Revenue: {row.revenue}, Profit: {row.actual_profit}")
        
        print(f"✅ Found {len(products)} products with sales data")
        return jsonify({'success': True, 'products': products}), 200
        
    except Exception as e:
        print(f"❌ Error getting product performance: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

@sales_bp.route('/analytics/monthly-trend', methods=['GET'])
@jwt_required()
def get_monthly_trend():
    """Get monthly revenue and REAL profit trend (last 6 months)"""
    try:
        print("📊 Getting monthly trend with REAL profit...")
        
        monthly_data = []
        today = datetime.now(nairobi_tz).date()
        
        for i in range(5, -1, -1):  # Last 6 months
            # Calculate start and end of month
            if i == 0:
                month_start = today.replace(day=1)
                if today.month == 12:
                    month_end = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
                else:
                    month_end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
            else:
                # Go back i months
                year = today.year
                month = today.month - i
                if month <= 0:
                    month += 12
                    year -= 1
                month_start = datetime(year, month, 1).date()
                if month == 12:
                    month_end = datetime(year + 1, 1, 1).date() - timedelta(days=1)
                else:
                    month_end = datetime(year, month + 1, 1).date() - timedelta(days=1)
            
            # Query for real profit calculation
            query = """
            SELECT 
                COALESCE(SUM(si.quantity * si.unit_price), 0) as revenue,
                COALESCE(SUM(si.quantity * (si.unit_price - p.purchase_price)), 0) as actual_profit
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN products p ON si.product_id = p.id
            WHERE DATE(s.created_at) >= :start_date AND DATE(s.created_at) <= :end_date
            """
            
            result = db.session.execute(db.text(query), {
                'start_date': month_start,
                'end_date': month_end
            }).fetchone()
            
            revenue = float(result.revenue) if result.revenue else 0
            actual_profit = float(result.actual_profit) if result.actual_profit else 0
            
            monthly_data.append({
                'month': month_start.strftime('%b'),
                'revenue': revenue,
                'profit': actual_profit,  # ✅ REAL profit, not 30% estimate
                'profit_margin': (actual_profit / revenue * 100) if revenue > 0 else 0
            })
        
        print("✅ Generated monthly trend with REAL profit calculations")
        return jsonify({
            'success': True,
            'monthly_trend': monthly_data
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting monthly trend: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

@sales_bp.route('/analytics/profit-summary', methods=['GET'])
@jwt_required()
def get_profit_summary():
    """Get overall profit summary with real calculations"""
    try:
        print("📊 Getting profit summary...")
        
        # Calculate total real profit
        query = """
        SELECT 
            COALESCE(SUM(si.quantity * si.unit_price), 0) as total_revenue,
            COALESCE(SUM(si.quantity * p.purchase_price), 0) as total_cost,
            COALESCE(SUM(si.quantity * (si.unit_price - p.purchase_price)), 0) as total_profit
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN sales s ON si.sale_id = s.id
        """
        
        result = db.session.execute(db.text(query)).fetchone()
        
        total_revenue = float(result.total_revenue) if result.total_revenue else 0
        total_cost = float(result.total_cost) if result.total_cost else 0
        total_profit = float(result.total_profit) if result.total_profit else 0
        profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        return jsonify({
            'success': True,
            'profit_summary': {
                'total_revenue': total_revenue,
                'total_cost': total_cost,
                'total_profit': total_profit,
                'profit_margin': profit_margin
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting profit summary: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

@sales_bp.route('/analytics/category-performance', methods=['GET'])
@jwt_required()
def get_category_performance():
    """Get category performance with real profit"""
    try:
        print("📊 Getting category performance...")
        
        query = """
        SELECT 
            p.category,
            COALESCE(SUM(si.quantity * si.unit_price), 0) as revenue,
            COALESCE(SUM(si.quantity * (si.unit_price - p.purchase_price)), 0) as profit,
            COALESCE(SUM(si.quantity), 0) as units_sold
        FROM products p
        LEFT JOIN sale_items si ON p.id = si.product_id
        LEFT JOIN sales s ON si.sale_id = s.id
        GROUP BY p.category
        HAVING COALESCE(SUM(si.quantity), 0) > 0
        ORDER BY revenue DESC
        """
        
        result = db.session.execute(db.text(query))
        categories = []
        colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d']
        
        for i, row in enumerate(result):
            categories.append({
                'name': row.category,
                'value': float(row.revenue),
                'profit': float(row.profit),
                'units_sold': int(row.units_sold),
                'color': colors[i % len(colors)]
            })
        
        return jsonify({
            'success': True,
            'categories': categories
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting category performance: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

@sales_bp.route('/analytics/brand-performance', methods=['GET'])
@jwt_required()
def get_brand_performance():
    """Get brand performance with real profit"""
    try:
        print("📊 Getting brand performance...")
        
        query = """
        SELECT 
            p.brand,
            COALESCE(SUM(si.quantity * si.unit_price), 0) as sales,
            COALESCE(SUM(si.quantity), 0) as units,
            COALESCE(SUM(si.quantity * (si.unit_price - p.purchase_price)), 0) as profit
        FROM products p
        LEFT JOIN sale_items si ON p.id = si.product_id
        LEFT JOIN sales s ON si.sale_id = s.id
        GROUP BY p.brand
        HAVING COALESCE(SUM(si.quantity), 0) > 0
        ORDER BY sales DESC
        LIMIT 10
        """
        
        result = db.session.execute(db.text(query))
        brands = []
        
        for row in result:
            brands.append({
                'brand': row.brand,
                'sales': float(row.sales),
                'units': int(row.units),
                'profit': float(row.profit)
            })
        
        return jsonify({
            'success': True,
            'brands': brands
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting brand performance: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500