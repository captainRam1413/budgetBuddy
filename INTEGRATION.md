# BudgetBuddy - Frontend & Backend Integration

## 🔗 Backend Connection

The React Native frontend is now fully integrated with the Flask backend API running on MongoDB Atlas.

### Backend Server
- **URL**: http://192.168.1.40:5000
- **Database**: MongoDB Atlas (budgetBuddy)
- **Authentication**: JWT tokens with 7-day expiration

## 📱 Integrated Features

### ✅ Authentication
- **Login** - Validates credentials with backend, stores JWT token
- **Register** - Creates user account, auto-logs in with token
- **Logout** - Clears stored token and navigates to login
- **Auto-authentication** - Checks token on app start

### ✅ Onboarding
- **Budget Setup** - Saves total budget to backend
- **Category Creation** - Creates multiple categories with budgets
- **Validation** - Ensures category budgets ≤ total budget
- **Onboarding Completion** - Marks user as onboarded in database

### ✅ Expense Management
- **Create Expense** - Saves to backend with budget validation
- **Budget Check** - Prevents expenses exceeding category budget
- **Local + Remote Sync** - Updates both backend and local context

### ✅ Profile Management
- **Logout** - Clears session and returns to login
- **Budget Updates** - Synced with backend (to be fully implemented)
- **Category Management** - Local operations (backend sync in progress)

## 🛠️ API Service Architecture

### File: `src/services/api.js`

Centralized API service with:
- **Axios instance** with base URL configuration
- **Request interceptor** - Adds JWT token to all requests
- **Response interceptor** - Handles 401 (unauthorized) errors
- **AsyncStorage integration** - Persists token locally

### API Modules

#### authAPI
- `register(name, email, phone, password)`
- `login(email, password)`
- `logout()`
- `isAuthenticated()`

#### userAPI
- `getProfile()`
- `updateProfile(name, phone)`
- `updateBudget(totalBudget)`
- `completeOnboarding()`

#### categoryAPI
- `getAll()`
- `create(name, icon, color, budget)`
- `createMultiple(categories)`
- `updateBudget(categoryName, budget)`
- `updateMultipleBudgets(budgets)`
- `delete(categoryName)`

#### expenseAPI
- `getAll()`
- `getByCategory(categoryName)`
- `getCategoryTotal(categoryName)`
- `getSummary()`
- `create(title, amount, category, icon, color)`
- `delete(expenseId)`

## 🚀 Running the Application

### 1. Start Backend Server
```bash
cd backend
python app.py
```
Server runs on http://localhost:5000

### 2. Update API URL (if needed)
Edit `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://YOUR_IP:5000/api';
```

### 3. Start Frontend
```bash
npm start
# or
npx expo start
```

## 🔐 Authentication Flow

1. **App Launch** → Checks for stored JWT token
2. **Token Found** → Navigate to Home (BottomTabs)
3. **No Token** → Navigate to Login screen
4. **Login/Register** → Receives token → Stores in AsyncStorage
5. **Logout** → Removes token → Navigate to Login

## 📊 Data Flow

### Registration → Onboarding → Main App
```
Register Screen
  ↓ (API: register)
  ↓ (Store token)
  ↓
Onboarding
  ↓ (API: updateBudget)
  ↓ (API: createMultiple categories)
  ↓ (API: completeOnboarding)
  ↓
Main App (BottomTabs)
```

### Create Expense Flow
```
Create Screen
  ↓ (Validate budget)
  ↓ (API: create expense)
  ↓ (Update local context)
  ↓ (Navigate back)
```

## 🔄 Sync Strategy

Currently using **Write-Through** strategy:
1. Save to backend (API call)
2. Update local context (immediate UI update)
3. Show success/error feedback

This ensures:
- ✅ Data persisted to database
- ✅ Immediate UI updates
- ✅ Offline detection (API errors handled)

## 🚧 Remaining Integrations

### To Be Implemented:
- [ ] Load user data from backend on app start
- [ ] Load categories from backend
- [ ] Load expenses from backend
- [ ] Sync category budget updates to backend (Profile screen)
- [ ] Delete expense via backend
- [ ] Pull-to-refresh data synchronization
- [ ] Offline mode with queue

## 🔍 Testing

### Test User Account
You can test with the account created during API testing:
- **Email**: test@example.com
- **Password**: password123

Or register a new account through the app.

### Backend Health Check
```bash
curl http://localhost:5000/health
```
Should return: `{"status": "healthy"}`

## 📝 Notes

- JWT tokens expire after 7 days
- All API errors are logged to console
- Loading states added to prevent duplicate submissions
- AsyncStorage used for token persistence
- Backend validates all inputs before database writes

## 🐛 Debugging

### Check Token
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// In component or console
AsyncStorage.getItem('authToken').then(token => console.log(token));
```

### Check API Calls
All API calls log errors to console. Check:
- Metro bundler console
- React Native debugger
- Backend terminal output

### Common Issues
1. **Connection Refused** → Backend not running
2. **401 Errors** → Token expired, logout and login again
3. **Network Error** → Check IP address in api.js matches backend
