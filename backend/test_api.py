import requests
import json

BASE_URL = "http://localhost:5000"

def test_register():
    print("Testing user registration...")
    url = f"{BASE_URL}/api/auth/register"
    data = {
        "username": "admin",
        "password": "admin123",
        "email": "admin@shoe.com",
        "role": "admin"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_login():
    print("\nTesting user login...")
    url = f"{BASE_URL}/api/auth/login"
    data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    print("🧪 Starting API Authentication Tests...")
    print("="*50)
    
    # Test registration
    register_result = test_register()
    
    # Test login
    login_result = test_login()
    
    # Check results
    print("\n" + "="*50)
    if login_result and 'access_token' in login_result:
        print("✅ SUCCESS! Authentication working!")
        print(f"Access token received: {login_result['access_token'][:30]}...")
        print(f"User: {login_result['user']['username']} ({login_result['user']['role']})")
    else:
        print("❌ FAILED! Authentication not working")
    
    print("="*50)