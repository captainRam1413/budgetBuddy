# BudgetBuddy Backend API

Flask REST API with MongoDB for BudgetBuddy expense tracking application.

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Edit `.env` file with your MongoDB credentials (already configured).

### 3. Run the Server

```bash
python app.py
```

Server will start on `http://localhost:5000`

## API Endpoints

### Authentication

#### Register User
```
POST /api/auth/register
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "password123"
}
Response: { "success": true, "token": "...", "userId": "..." }
```

#### Login
```
POST /api/auth/login
Body: {
  "email": "john@example.com",
  "password": "password123"
}
Response: { "success": true, "token": "...", "user": {...} }
```

### User Profile

#### Get Profile
```
GET /api/user/profile
Headers: { "Authorization": "Bearer <token>" }
Response: { "success": true, "user": {...} }
```

#### Update Profile
```
PUT /api/user/profile
Headers: { "Authorization": "Bearer <token>" }
Body: { "name": "New Name", "phone": "9876543210" }
```

#### Update Budget
```
PUT /api/user/budget
Headers: { "Authorization": "Bearer <token>" }
Body: { "totalBudget": 50000 }
```

#### Complete Onboarding
```
POST /api/user/onboarding/complete
Headers: { "Authorization": "Bearer <token>" }
```

### Categories

#### Get All Categories
```
GET /api/categories/
Headers: { "Authorization": "Bearer <token>" }
Response: { "success": true, "categories": [...] }
```

#### Create Category
```
POST /api/categories/
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "name": "Food",
  "icon": "🍔",
  "color": "#FF6B6B",
  "budget": 5000
}
```

#### Create Multiple Categories (Bulk)
```
POST /api/categories/bulk
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "categories": [
    { "name": "Food", "icon": "🍔", "color": "#FF6B6B", "budget": 5000 },
    { "name": "Transport", "icon": "🚗", "color": "#4ECDC4", "budget": 3000 }
  ]
}
```

#### Update Category Budget
```
PUT /api/categories/<category_name>/budget
Headers: { "Authorization": "Bearer <token>" }
Body: { "budget": 6000 }
```

#### Update Multiple Budgets (Bulk)
```
PUT /api/categories/budgets/bulk
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "budgets": {
    "Food": 6000,
    "Transport": 4000
  }
}
```

#### Delete Category
```
DELETE /api/categories/<category_name>
Headers: { "Authorization": "Bearer <token>" }
```

### Expenses

#### Get All Expenses
```
GET /api/expenses/
Headers: { "Authorization": "Bearer <token>" }
Response: { "success": true, "expenses": [...] }
```

#### Get Expenses by Category
```
GET /api/expenses/category/<category_name>
Headers: { "Authorization": "Bearer <token>" }
```

#### Get Category Total Spending
```
GET /api/expenses/category/<category_name>/total
Headers: { "Authorization": "Bearer <token>" }
Response: { "success": true, "total": 2500 }
```

#### Get Spending Summary
```
GET /api/expenses/summary
Headers: { "Authorization": "Bearer <token>" }
Response: { "success": true, "summary": [...] }
```

#### Create Expense
```
POST /api/expenses/
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "title": "Grocery Shopping",
  "amount": 1200,
  "category": "Food",
  "icon": "🍔",
  "color": "#FF6B6B"
}
```

#### Delete Expense
```
DELETE /api/expenses/<expense_id>
Headers: { "Authorization": "Bearer <token>" }
```

## Database Collections

### users
- name, email, phone, password (hashed)
- totalBudget, hasCompletedOnboarding
- createdAt, updatedAt

### categories
- userId, name, icon, color, budget
- createdAt, updatedAt

### expenses
- userId, title, amount, category, icon, color
- date, createdAt

## Authentication

All protected routes require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

Token is returned on successful registration/login and expires in 7 days.
