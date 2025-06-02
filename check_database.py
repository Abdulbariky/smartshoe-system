#!/usr/bin/env python3
"""
Database structure check script to identify why sale_items aren't being created
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

def test_debug_endpoint(token):
    """Test the new debug endpoint"""
    print("\n🔍 Testing debug endpoint...")
    
    url = f"{BASE_URL}/api/sales/debug/sale-items"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        print(f"📡 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Debug endpoint working!")
            
            print(f"\n📊 Database Analysis:")
            print(f"   Total sales: {data.get('total_sales', 0)}")
            print(f"   Total sale_items: {data.get('total_sale_items', 0)}")
            
            # Check the ratio
            total_sales = data.get('total_sales', 0)
            total_sale_items = data.get('total_sale_items', 0)
            
            if total_sales > 0 and total_sale_items == 0:
                print(f"\n❌ PROBLEM IDENTIFIED:")
                print(f"   You have {total_sales} sales but 0 sale_items!")
                print(f"   This means sales are being created but sale_items are not.")
                print(f"   Check your create_sale endpoint in routes/sales.py")
                
            elif total_sales > 0 and total_sale_items > 0:
                ratio = total_sale_items / total_sales
                print(f"\n✅ GOOD NEWS:")
                print(f"   Ratio: {ratio:.1f} sale_items per sale")
                if ratio >= 1:
                    print(f"   This looks healthy - sales are creating sale_items")
                else:
                    print(f"   This ratio is low - some sales might be missing sale_items")
            
            # Show summary
            summary = data.get('summary_by_product', [])
            if summary:
                print(f"\n📦 Product Sales Summary:")
                for item in summary[:5]:
                    print(f"   {item['product_name']}: {item['total_quantity']} units, KES {item['total_revenue']}")
            else:
                print(f"\n❌ No product sales summary - confirms sale_items issue")
            
            return data
        else:
            print(f"❌ Debug endpoint failed: {response.status_code}")
            if response.status_code == 500:
                print("   This is a server error - check Flask logs")
            return None
    except Exception as e:
        print(f"❌ Debug endpoint error: {e}")
        return None

def test_product_analytics(token):
    """Test the new product analytics endpoint"""
    print("\n📊 Testing product analytics...")
    
    url = f"{BASE_URL}/api/sales/analytics/product-performance"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        print(f"📡 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Product analytics working!")
            
            if data.get('success') and data.get('products'):
                products = data['products']
                print(f"\n📊 Analytics Results:")
                print(f"   Total products analyzed: {len(products)}")
                
                # Show top 5 products
                print(f"\n🏆 Top 5 Products:")
                for i, product in enumerate(products[:5]):
                    units = product.get('units_sold', 0)
                    revenue = product.get('revenue', 0)
                    print(f"   {i+1}. {product['name']}: {units} units, KES {revenue}")
                
                # Check if there are any sales at all
                total_units = sum(p.get('units_sold', 0) for p in products)
                total_revenue = sum(p.get('revenue', 0) for p in products)
                
                print(f"\n📈 Totals:")
                print(f"   Total units sold: {total_units}")
                print(f"   Total revenue: KES {total_revenue}")
                
                if total_units == 0:
                    print(f"\n❌ No units sold across all products!")
                    print(f"   This confirms the sale_items issue.")
                else:
                    print(f"\n✅ Analytics are working correctly!")
                
                return products
            else:
                print(f"❌ Analytics returned unsuccessful response")
                return None
        else:
            print(f"❌ Analytics endpoint failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Analytics endpoint error: {e}")
        return None

def create_test_sale(token):
    """Create a test sale to verify sale_items are created"""
    print("\n🛍️ Creating a test sale to check sale_items creation...")
    
    # First, get a product
    url = f"{BASE_URL}/api/products/"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            products_data = response.json()
            products = products_data.get('products', [])
            
            if not products:
                print("❌ No products available")
                return None
            
            # Use first product
            product = products[0]
            print(f"📦 Using product: {product['name']} (Stock: {product.get('current_stock', 0)})")
            
            if product.get('current_stock', 0) < 1:
                print("❌ Product has no stock - add stock first")
                return None
            
            # Create test sale
            sale_data = {
                "items": [
                    {
                        "product_id": product['id'],
                        "quantity": 1,
                        "unit_price": product['retail_price']
                    }
                ],
                "sale_type": "retail",
                "payment_method": "cash"
            }
            
            url = f"{BASE_URL}/api/sales/"
            response = requests.post(url, headers=headers, json=sale_data)
            
            if response.status_code == 201:
                result = response.json()
                print(f"✅ Test sale created: {result['invoice_number']}")
                
                # Now check if sale_items were created
                sale_id = result['sale_id']
                print(f"🔍 Checking if sale_items were created for sale ID: {sale_id}")
                
                # Test the debug endpoint again
                debug_data = test_debug_endpoint(token)
                
                return result
            else:
                print(f"❌ Failed to create test sale: {response.status_code}")
                print(f"Error: {response.text}")
                return None
        else:
            print(f"❌ Failed to get products: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error creating test sale: {e}")
        return None

def main():
    """Main diagnostic function"""
    print("=" * 70)
    print("🔍 SMARTSHOE DATABASE STRUCTURE DIAGNOSIS")
    print("=" * 70)
    print("This script will help identify why your analytics aren't working.")
    print()
    
    # Step 1: Login
    token = login_and_get_token()
    if not token:
        print("❌ Cannot continue without token")
        return
    
    # Step 2: Test debug endpoint
    debug_data = test_debug_endpoint(token)
    
    # Step 3: Test analytics
    analytics_data = test_product_analytics(token)
    
    # Step 4: Create test sale if needed
    if debug_data and debug_data.get('total_sale_items', 0) == 0:
        print("\n🔧 No sale_items found - creating a test sale...")
        test_sale = create_test_sale(token)
        
        if test_sale:
            print("\n🔄 Retesting after creating sale...")
            test_debug_endpoint(token)
            test_product_analytics(token)
    
    # Step 5: Final diagnosis
    print("\n" + "=" * 70)
    print("🎯 FINAL DIAGNOSIS & SOLUTION")
    print("=" * 70)
    
    if not debug_data:
        print("❌ CRITICAL: Debug endpoint not working")
        print("🔧 SOLUTION: Replace your routes/sales.py with the fixed version I provided")
        
    elif debug_data.get('total_sale_items', 0) == 0:
        print("❌ CRITICAL: No sale_items in database")
        print("🔧 SOLUTION:")
        print("   1. Your create_sale function isn't creating sale_items")
        print("   2. Replace your routes/sales.py with the fixed version")
        print("   3. Check your SaleItem model has the correct relationship")
        print("   4. Make sure db.session.add(sale_item) is called for each item")
        
    else:
        print("✅ SUCCESS: sale_items are being created correctly!")
        print("🎉 Your analytics should now show real data")
    
    print(f"\n📋 Next Steps:")
    print(f"1. Replace your backend routes/sales.py with the fixed version")
    print(f"2. Update frontend to remove fake customer names")
    print(f"3. Restart your Flask server")
    print(f"4. Run this script again to verify the fix")

if __name__ == "__main__":
    main()