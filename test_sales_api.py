#!/usr/bin/env python3
"""
Test script to verify that the Sales API is working correctly
and returning the proper data structure for sale details.
"""

import requests
import json
import sys

BASE_URL = "http://localhost:5000"

def login_and_get_token():
    """Login and get access token"""
    print("🔐 Logging in to get access token...")
    
    url = f"{BASE_URL}/api/auth/login"
    data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            result = response.json()
            token = result.get('access_token')
            print(f"✅ Login successful! Token: {token[:30]}...")
            return token
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_sales_list(token):
    """Test getting list of sales"""
    print("\n📋 Testing sales list endpoint...")
    
    url = f"{BASE_URL}/api/sales/"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            sales = data.get('sales', [])
            print(f"✅ Sales list: Found {len(sales)} sales")
            
            if sales:
                print("📊 Sample sale:")
                sample_sale = sales[0]
                for key, value in sample_sale.items():
                    print(f"   {key}: {value}")
                return sample_sale['id']  # Return first sale ID for detail testing
            else:
                print("⚠️ No sales found - you need to create a sale first")
                return None
        else:
            print(f"❌ Sales list failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Sales list error: {e}")
        return None

def test_sale_details(token, sale_id):
    """Test getting detailed sale information"""
    print(f"\n🔍 Testing sale details for ID: {sale_id}")
    
    url = f"{BASE_URL}/api/sales/{sale_id}"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        print(f"📡 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Sale details retrieved successfully!")
            
            # Check data structure
            print(f"\n📊 Data structure analysis:")
            print(f"   Main keys: {list(data.keys())}")
            print(f"   Has 'items' key: {'items' in data}")
            print(f"   Items count: {len(data.get('items', []))}")
            
            if 'items' in data and data['items']:
                print(f"\n📦 Items details:")
                for i, item in enumerate(data['items'][:2]):  # Show first 2 items
                    print(f"   Item {i+1}:")
                    for key, value in item.items():
                        print(f"      {key}: {value}")
                
                print(f"\n🎯 Key checks:")
                sample_item = data['items'][0]
                required_fields = ['product_name', 'product_brand', 'quantity', 'unit_price', 'subtotal']
                for field in required_fields:
                    has_field = field in sample_item
                    value = sample_item.get(field, 'MISSING')
                    print(f"   ✅ {field}: {value}" if has_field else f"   ❌ {field}: MISSING")
            else:
                print("❌ No items found in sale details!")
            
            return data
        else:
            print(f"❌ Sale details failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Sale details error: {e}")
        return None

def test_debug_endpoint(token, sale_id):
    """Test the debug endpoint"""
    print(f"\n🐛 Testing debug endpoint for sale ID: {sale_id}")
    
    url = f"{BASE_URL}/api/sales/debug/{sale_id}"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            print("✅ Debug data retrieved:")
            print(json.dumps(data, indent=2))
            return data
        else:
            print(f"❌ Debug endpoint failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Debug endpoint error: {e}")
        return None

def test_analytics_endpoints(token):
    """Test the analytics endpoints"""
    print(f"\n📊 Testing analytics endpoints...")
    
    endpoints = [
        '/api/sales/analytics/overview',
        '/api/sales/analytics/product-performance'
    ]
    
    for endpoint in endpoints:
        print(f"\n🔍 Testing {endpoint}")
        url = f"{BASE_URL}{endpoint}"
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {endpoint}: Success")
                if 'overview' in data:
                    overview = data['overview']
                    print(f"   Total sales: KES {overview.get('total_sales', 0)}")
                    print(f"   Total transactions: {overview.get('total_transactions', 0)}")
                elif 'products' in data:
                    products = data['products']
                    print(f"   Products analyzed: {len(products)}")
            else:
                print(f"❌ {endpoint}: Failed - {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint}: Error - {e}")

def create_test_sale(token):
    """Create a test sale for testing"""
    print(f"\n🛍️ Creating a test sale...")
    
    # First, get available products
    url = f"{BASE_URL}/api/products/"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            products_data = response.json()
            products = products_data.get('products', [])
            
            if not products:
                print("❌ No products available - add some products first")
                return None
            
            # Create a sale with the first available product
            product = products[0]
            print(f"📦 Using product: {product['name']} (ID: {product['id']})")
            
            sale_data = {
                "items": [
                    {
                        "product_id": product['id'],
                        "quantity": 2,
                        "unit_price": product['retail_price']
                    }
                ],
                "sale_type": "retail",
                "payment_method": "cash"
            }
            
            # Create the sale
            url = f"{BASE_URL}/api/sales/"
            response = requests.post(url, headers=headers, json=sale_data)
            
            if response.status_code == 201:
                result = response.json()
                print(f"✅ Test sale created: {result['invoice_number']}")
                return result['sale_id']
            else:
                print(f"❌ Failed to create test sale: {response.status_code} - {response.text}")
                return None
        else:
            print(f"❌ Failed to get products: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error creating test sale: {e}")
        return None

def main():
    """Main test function"""
    print("=" * 60)
    print("🧪 SMARTSHOE SALES API TEST")
    print("=" * 60)
    
    # Step 1: Login
    token = login_and_get_token()
    if not token:
        print("❌ Cannot continue without valid token")
        sys.exit(1)
    
    # Step 2: Test sales list
    sale_id = test_sales_list(token)
    
    # Step 3: Create test sale if no sales exist
    if not sale_id:
        print("\n🔄 No existing sales found, creating a test sale...")
        sale_id = create_test_sale(token)
        
        if sale_id:
            # Refresh sales list
            print("\n🔄 Refreshing sales list after creating test sale...")
            sale_id = test_sales_list(token)
    
    if sale_id:
        # Step 4: Test sale details
        sale_details = test_sale_details(token, sale_id)
        
        # Step 5: Test debug endpoint
        debug_data = test_debug_endpoint(token, sale_id)
        
        # Step 6: Test analytics
        test_analytics_endpoints(token)
        
        # Final analysis
        print("\n" + "=" * 60)
        print("📋 FINAL ANALYSIS")
        print("=" * 60)
        
        if sale_details and sale_details.get('items'):
            print("✅ SUCCESS! Sale details endpoint is working correctly!")
            print(f"   - Sale ID: {sale_details.get('id')}")
            print(f"   - Invoice: {sale_details.get('invoice_number')}")
            print(f"   - Items: {len(sale_details.get('items', []))}")
            print(f"   - Total: KES {sale_details.get('total_amount', 0)}")
            print("\n🎯 Your frontend should now show REAL data instead of mock data!")
        else:
            print("❌ ISSUE: Sale details endpoint is not returning items properly")
            print("🔧 This means your sales don't have associated sale_items in the database")
    else:
        print("❌ Cannot test sale details without a valid sale ID")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()