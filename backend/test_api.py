import requests
import json

# Base URL
BASE_URL = "http://localhost:5000"

def print_response(response):
    """Pretty print API response"""
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print("-" * 50)

# Test 1: Health Check
print("\n🏥 Testing Health Check...")
response = requests.get(f"{BASE_URL}/health")
print_response(response)

# Test 2: Register User
print("\n📝 Testing User Registration...")
register_data = {
    "name": "Test User",
    "email": "test@example.com",
    "phone": "1234567890",
    "password": "password123"
}
response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
print_response(response)

if response.status_code == 201:
    token = response.json()['token']
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 3: Get Profile
    print("\n👤 Testing Get Profile...")
    response = requests.get(f"{BASE_URL}/api/user/profile", headers=headers)
    print_response(response)
    
    # Test 4: Update Budget
    print("\n💰 Testing Update Budget...")
    budget_data = {"totalBudget": 50000}
    response = requests.put(f"{BASE_URL}/api/user/budget", json=budget_data, headers=headers)
    print_response(response)
    
    # Test 5: Create Categories (Bulk)
    print("\n📁 Testing Create Categories (Bulk)...")
    categories_data = {
        "categories": [
            {"name": "Food", "icon": "🍔", "color": "#FF6B6B", "budget": 10000},
            {"name": "Transport", "icon": "🚗", "color": "#4ECDC4", "budget": 5000},
            {"name": "Shopping", "icon": "🛍️", "color": "#FFB347", "budget": 8000}
        ]
    }
    response = requests.post(f"{BASE_URL}/api/categories/bulk", json=categories_data, headers=headers)
    print_response(response)
    
    # Test 6: Get All Categories
    print("\n📂 Testing Get All Categories...")
    response = requests.get(f"{BASE_URL}/api/categories/", headers=headers)
    print_response(response)
    
    # Test 7: Create Expense
    print("\n💸 Testing Create Expense...")
    expense_data = {
        "title": "Grocery Shopping",
        "amount": 1200,
        "category": "Food",
        "icon": "🍔",
        "color": "#FF6B6B"
    }
    response = requests.post(f"{BASE_URL}/api/expenses/", json=expense_data, headers=headers)
    print_response(response)
    
    # Test 8: Get All Expenses
    print("\n💵 Testing Get All Expenses...")
    response = requests.get(f"{BASE_URL}/api/expenses/", headers=headers)
    print_response(response)
    
    # Test 9: Get Spending Summary
    print("\n📊 Testing Get Spending Summary...")
    response = requests.get(f"{BASE_URL}/api/expenses/summary", headers=headers)
    print_response(response)
    
    # Test 10: Complete Onboarding
    print("\n✅ Testing Complete Onboarding...")
    response = requests.post(f"{BASE_URL}/api/user/onboarding/complete", headers=headers)
    print_response(response)

print("\n✨ All tests completed!")
