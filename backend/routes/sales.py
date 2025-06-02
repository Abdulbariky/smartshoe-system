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

# ✅ FIXED: Get sale details WITHOUT fake customer names
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
        
        # ✅ FIXED: Return data WITHOUT any customer name generation
        response_data = {
            'id': sale.id,
            'invoice_number': sale.invoice_number,
            'sale_type': sale.sale_type,
            'total_amount': float(sale.total_amount),
            'payment_method': sale.payment_method,
            'created_at': sale.created_at.isoformat(),
            'items_count': len(items),
            'items': items
            # ❌ NO customer_name field at all - let frontend handle it
        }
        
        print(f"✅ Backend: Returning {len(items)} items for sale {sale.invoice_number}")
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"❌ Backend Error getting sale details: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ✅ FIXED: Working product performance analytics with proper error handling
@sales_bp.route('/analytics/product-performance', methods=['GET'])
@jwt_required()
def get_product_performance():
    try:
        print("📊 Getting REAL product performance analytics...")
        
        # First, let's check if we have sale_items at all
        total_sale_items = db.session.query(SaleItem).count()
        print(f"🔍 Total sale_items in database: {total_sale_items}")
        
        if total_sale_items == 0:
            print("⚠️ No sale_items found - returning all products with 0 sales")
            # Return all products with zero sales
            products = Product.query.all()
            result = []
            for product in products:
                result.append({
                    'id': product.id,
                    'name': product.name,
                    'brand': product.brand,
                    'category': product.category,
                    'retail_price': float(product.retail_price),
                    'units_sold': 0,
                    'revenue': 0,
                    'stock': product.get_current_stock()
                })
            
            return jsonify({
                'success': True,
                'products': result,
                'note': 'No sales data found - showing all products with 0 sales'
            }), 200
        
        # Use a simpler, more reliable query
        print("🔍 Running product analytics query...")
        
        # Get products with sales
        products_with_sales = db.session.query(
            Product.id,
            Product.name,
            Product.brand,
            Product.category,
            Product.retail_price,
            db.func.coalesce(db.func.sum(SaleItem.quantity), 0).label('total_units'),
            db.func.coalesce(db.func.sum(SaleItem.quantity * SaleItem.unit_price), 0).label('total_revenue')
        ).outerjoin(SaleItem, Product.id == SaleItem.product_id).group_by(
            Product.id, Product.name, Product.brand, Product.category, Product.retail_price
        ).all()
        
        result = []
        for row in products_with_sales:
            product = Product.query.get(row.id)
            current_stock = product.get_current_stock() if product else 0
            
            units_sold = int(row.total_units) if row.total_units else 0
            revenue = float(row.total_revenue) if row.total_revenue else 0
            
            print(f"📦 {row.name}: {units_sold} units, KES {revenue}")
            
            result.append({
                'id': row.id,
                'name': row.name,
                'brand': row.brand,
                'category': row.category,
                'retail_price': float(row.retail_price),
                'units_sold': units_sold,
                'revenue': revenue,
                'stock': current_stock
            })
        
        # Sort by units sold descending
        result.sort(key=lambda x: x['units_sold'], reverse=True)
        
        print(f"✅ Returning analytics for {len(result)} products")
        return jsonify({
            'success': True,
            'products': result
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting product performance: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

# ✅ FIXED: Working sales analytics
@sales_bp.route('/analytics/overview', methods=['GET'])
@jwt_required()
def get_sales_analytics():
    try:
        print("📊 Getting sales analytics overview...")
        
        # Get basic sales stats
        total_sales = db.session.query(db.func.sum(Sale.total_amount)).scalar() or 0
        total_transactions = Sale.query.count()
        
        # Get today's sales
        today = datetime.now().date()
        today_sales = db.session.query(db.func.sum(Sale.total_amount)).filter(
            db.func.date(Sale.created_at) == today
        ).scalar() or 0
        
        print(f"✅ Basic stats: {total_transactions} transactions, KES {total_sales}")
        
        # Try to get category analysis (with error handling)
        categories = []
        try:
            category_results = db.session.query(
                Product.category,
                db.func.coalesce(db.func.sum(SaleItem.quantity * SaleItem.unit_price), 0).label('revenue')
            ).outerjoin(SaleItem, Product.id == SaleItem.product_id).group_by(Product.category).all()
            
            colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d']
            for i, row in enumerate(category_results):
                categories.append({
                    'name': row.category,
                    'value': float(row.revenue),
                    'color': colors[i % len(colors)]
                })
        except Exception as e:
            print(f"⚠️ Category analysis failed: {e}")
        
        # Try to get brand analysis (with error handling)
        brands = []
        try:
            brand_results = db.session.query(
                Product.brand,
                db.func.coalesce(db.func.sum(SaleItem.quantity * SaleItem.unit_price), 0).label('sales'),
                db.func.coalesce(db.func.sum(SaleItem.quantity), 0).label('units')
            ).outerjoin(SaleItem, Product.id == SaleItem.product_id).group_by(Product.brand).order_by(
                db.func.sum(SaleItem.quantity * SaleItem.unit_price).desc()
            ).limit(5).all()
            
            for row in brand_results:
                brands.append({
                    'brand': row.brand,
                    'sales': float(row.sales),
                    'units': int(row.units)
                })
        except Exception as e:
            print(f"⚠️ Brand analysis failed: {e}")
        
        return jsonify({
            'success': True,
            'overview': {
                'total_sales': float(total_sales),
                'total_transactions': total_transactions,
                'today_sales': float(today_sales),
                'average_sale': float(total_sales / total_transactions) if total_transactions > 0 else 0
            },
            'categories': categories,
            'brands': brands
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting sales analytics: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

# ✅ FIXED: Debug endpoint to check sale items
@sales_bp.route('/debug/sale-items', methods=['GET'])
@jwt_required()
def debug_sale_items():
    """Debug endpoint to check what sale items exist in the database"""
    try:
        print("🐛 Debug: Checking sale items...")
        
        # Check if sale_items table exists and has data
        total_sale_items = db.session.query(SaleItem).count()
        total_sales = db.session.query(Sale).count()
        
        print(f"🔍 Total sales: {total_sales}")
        print(f"🔍 Total sale_items: {total_sale_items}")
        
        # Get recent sale items
        recent_items = db.session.query(SaleItem).join(Product).join(Sale).limit(10).all()
        
        sale_items = []
        for item in recent_items:
            sale_items.append({
                'sale_item_id': item.id,
                'sale_id': item.sale_id,
                'product_id': item.product_id,
                'product_name': item.product.name if item.product else 'Unknown',
                'quantity': item.quantity,
                'unit_price': float(item.unit_price),
                'invoice_number': item.sale.invoice_number if item.sale else 'Unknown',
                'created_at': item.sale.created_at.isoformat() if item.sale and item.sale.created_at else None
            })
        
        # Get summary by product
        summary = []
        try:
            summary_results = db.session.query(
                Product.name,
                db.func.count(SaleItem.id).label('sale_count'),
                db.func.sum(SaleItem.quantity).label('total_quantity'),
                db.func.sum(SaleItem.quantity * SaleItem.unit_price).label('total_revenue')
            ).join(SaleItem).group_by(Product.name).order_by(
                db.func.sum(SaleItem.quantity).desc()
            ).all()
            
            for row in summary_results:
                summary.append({
                    'product_name': row.name,
                    'sale_count': row.sale_count,
                    'total_quantity': int(row.total_quantity),
                    'total_revenue': float(row.total_revenue)
                })
        except Exception as e:
            print(f"⚠️ Summary query failed: {e}")
        
        return jsonify({
            'success': True,
            'total_sales': total_sales,
            'total_sale_items': total_sale_items,
            'sale_items': sale_items,
            'summary_by_product': summary
        }), 200
        
    except Exception as e:
        print(f"❌ Error in debug sale items: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

# ✅ FIXED: Sales trend endpoint
@sales_bp.route('/analytics/sales-trend', methods=['GET'])
@jwt_required()
def get_sales_trend():
    try:
        print("📊 Getting sales trend...")
        
        # Get last 7 days of sales data
        trend_data = []
        today = datetime.now().date()
        
        for i in range(6, -1, -1):
            date = today - timedelta(days=i)
            day_name = date.strftime('%a')
            
            # Get sales for this day
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