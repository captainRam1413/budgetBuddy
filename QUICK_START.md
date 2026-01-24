# Quick Start Commands

## Setup Appwrite Collections

Run these commands in your Appwrite Console or use the Web UI:

### 1. Create Database
```bash
Database ID: budgetbuddy_db
Name: BudgetBuddy Database
```

### 2. Create Collections via Console UI

Navigate to: https://cloud.appwrite.io/console/project-666d96a5002201b52dc4

#### Users Collection
```
Collection ID: users
Attributes:
- userId (string, 255, required)
- name (string, 255, required)
- email (string, 255, required)
- phone (string, 50, required)
- totalBudget (integer, required, default: 0)
- hasCompletedOnboarding (boolean, required, default: false)

Indexes:
- userId (key)
- email (key)

Permissions: Users (all operations)
```

#### Categories Collection
```
Collection ID: categories
Attributes:
- userId (string, 255, required)
- name (string, 255, required)
- icon (string, 255, required)
- color (string, 50, required)
- budget (integer, required, default: 0)

Indexes:
- userId (key)
- name (fulltext)

Permissions: Users (all operations)
```

#### Expenses Collection
```
Collection ID: expenses
Attributes:
- userId (string, 255, required)
- title (string, 255, required)
- amount (integer, required)
- category (string, 255, required)
- icon (string, 255, required)
- color (string, 50, required)
- date (string, 255, required)

Indexes:
- userId (key)
- category (key)
- date (key)

Permissions: Users (all operations)
```

## Run Your App

```bash
npm start
```

## Test Checklist

- [ ] Register new user
- [ ] Login with credentials
- [ ] Complete onboarding
- [ ] Create categories
- [ ] Add expenses
- [ ] View expenses by category
- [ ] Update budget
- [ ] Delete expenses
- [ ] Logout

## Migration Complete! 🎉

All your API calls now go directly to Appwrite. Your Flask backend is no longer needed.
