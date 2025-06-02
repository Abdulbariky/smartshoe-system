#!/usr/bin/env python3
"""
Debug script to check what sales data exists in your database
This will help identify why the analytics are showing wrong numbers.
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def login_and_get_token():
    """Login and get access token"""
    print("🔐 Logging in...")
    
    url = f"{BASE_URL}/api/auth/login"
    data = {"username": "admin", "password": "admin123"}
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            result = response.json()
            token = result.get('access_token')
            print(f"✅ Login successful!")
            return token
        else:
            print(f"❌ Login failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def check_sale_items_debug(token):
    """Check the debug endpoint for sale items"""
    print("\n🔍 Checking sale items in database...")
    
    url = f"{BASE_URL}/api/sales/debug/sale-items"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            
            print(f"📊 Database Analysis:")
            print(f"   Total sale items found: {data.get('total_sale_items', 0)}")
            
            # Show summary by product
            summary = data.get('summary_by_product', [])
            if summary:
                print(f"\n📦 Sales Summary by Product:")
                for item in summary[:5]:  # Show top 5
                    print(f"   {item['product_name']}: {item['total_quantity']} units, KES {item['total_revenue']}")
            else:
                print("❌ No sales summary found - this means no sale_items exist!")
            
            # Show recent sale items
            sale_items = data.get('sale_items', [])
            if sale_items:
                print(f"\n📋 Recent Sale Items (last {len(sale_items)}):")
                for item in sale_items[:3]:  # Show first 3
                    print(f"   Invoice: {item['invoice_number']} | Product: {item['product_name']} | Qty: {item['quantity']}")
            else:
                print("❌ No individual sale items found!")
            
            return data
        else:
            print(f"❌ Debug request failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Debug request error: {e}")
        return None

def check_product_analytics(token):
    """Check the product analytics endpoint"""
    print("\n📊 Checking product analytics...")
    
    url = f"{BASE_URL}/api/sales/analytics/product-performance"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success') and data.get('products'):
                products = data['products']
                print(f"✅ Analytics returned {len(products)} products")
                
                print(f"\n📊 Top 5 Product Analytics:")
                for i, product in enumerate(products[:5]):
                    units = product.get('units_sold', 0)
                    revenue = product.get('revenue', 0)
                    print(f"   {i+1}. {product['name']}: {units} units, KES {revenue}")
                
                # Check if all products have same numbers (indicates bug)
                if len(products) > 1:
                    first_units = products[0].get('units_sold', 0)
                    first_revenue = products[0].get('revenue', 0)
                    
                    all_same_units = all(p.get('units_sold', 0) == first_units for p in products)
                    all_same_revenue = all(p.get('revenue', 0) == first_revenue for p in products)
                    
                    if all_same_units and all_same_revenue:
                        print(f"\n❌ BUG DETECTED: All products have same numbers!")
                        print(f"   This indicates the SQL query is not working correctly.")
                    else:
                        print(f"\n✅ Products have different numbers - analytics working correctly!")
                
                return products
            else:
                print(f"❌ Analytics failed: {data}")
                return None
        else:
            print(f"❌ Analytics request failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Analytics request error: {e}")
        return None

def check_sales_list(token):
    """Check basic sales list"""
    print("\n📋 Checking sales list...")
    
    url = f"{BASE_URL}/api/sales/"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            sales = data.get('sales', [])
            
            print(f"📊 Found {len(sales)} sales in database")
            
            if sales:
                total_amount = sum(sale.get('total_amount', 0) for sale in sales)
                print(f"💰 Total sales value: KES {total_amount}")
                
                print(f"\n📋 Recent sales:")
                for sale in sales[:3]:
                    print(f"   {sale.get('invoice_number')}: KES {sale.get('total_amount')} ({sale.get('items_count', 0)} items)")
            
            return sales
        else:
            print(f"❌ Sales list request failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Sales list error: {e}")
        return None

def main():
    """Main debug function"""
    print("=" * 60)
    print("🐛 SMARTSHOE SALES DATA DEBUG")
    print("=" * 60)
    print("This script will help identify why your analytics show wrong numbers.")
    print()
    
    # Step 1: Login
    token = login_and_get_token()
    if not token:
        print("❌ Cannot continue without token")
        return
    
    # Step 2: Check sales list
    sales = check_sales_list(token)
    
    # Step 3: Check sale items debug data
    debug_data = check_sale_items_debug(token)
    
    # Step 4: Check product analytics
    analytics = check_product_analytics(token)
    
    # Step 5: Analysis and recommendations
    print("\n" + "=" * 60)
    print("🔍 DIAGNOSIS & RECOMMENDATIONS")
    print("=" * 60)
    
    if not sales or len(sales) == 0:
        print("❌ ISSUE: No sales found in database")
        print("🔧 SOLUTION: Create some sales through the POS system first")
        
    elif not debug_data or not debug_data.get('sale_items'):
        print("❌ ISSUE: Sales exist but no sale_items found")
        print("🔧 SOLUTION: Check if your sales are properly creating sale_items")
        print("   - Each sale should create entries in both 'sales' and 'sale_items' tables")
        
    elif not analytics or len(analytics) == 0:
        print("❌ ISSUE: Sale items exist but analytics returns no data")
        print("🔧 SOLUTION: Check the SQL query in the backend analytics endpoint")
        
    elif analytics and len(analytics) > 1:
        # Check if all products have same numbers
        first_product = analytics[0]
        all_same = all(
            p.get('units_sold') == first_product.get('units_sold') and 
            p.get('revenue') == first_product.get('revenue') 
            for p in analytics
        )
        
        if all_same:
            print("❌ ISSUE: All products show same numbers (like 49 units, KES 171,500)")
            print("🔧 SOLUTION: The SQL query in backend is not grouping correctly")
            print("   - Update the product analytics endpoint in routes/sales.py")
            print("   - Make sure the GROUP BY clause includes p.id")
        else:
            print("✅ SUCCESS: Analytics are working correctly!")
            print("🎉 Each product shows different units sold and revenue")
    
    print("\n📋 Next Steps:")
    print("1. Apply the fixed backend code I provided")
    print("2. Restart your Flask server")
    print("3. Test the analytics again")
    print("4. Run this script again to verify the fix")

if __name__ == "__main__":
    main()