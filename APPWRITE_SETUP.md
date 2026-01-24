# Appwrite Backend Migration Guide

## 🚀 Setup Instructions

Your BudgetBuddy app has been migrated to use Appwrite as the backend. Follow these steps to complete the setup:

### 1. Appwrite Dashboard Configuration

**Project ID:** `666d96a5002201b52dc4`  
**Endpoint:** `https://fra.cloud.appwrite.io/v1`

### 2. Create Database

1. Go to your Appwrite Console: https://cloud.appwrite.io/console
2. Navigate to your project
3. Click on **Databases** in the left sidebar
4. Click **Create Database**
5. Enter Database ID: `budgetbuddy_db`
6. Click **Create**

### 3. Create Collections

You need to create **3 collections**:

---

#### Collection 1: Users
- **Collection ID:** `users`
- **Name:** Users

**Attributes:**
| Attribute Key | Type | Size | Required | Default | Array |
|--------------|------|------|----------|---------|-------|
| userId | String | 255 | Yes | - | No |
| name | String | 255 | Yes | - | No |
| email | String | 255 | Yes | - | No |
| phone | String | 50 | Yes | - | No |
| totalBudget | Integer | - | Yes | 0 | No |
| hasCompletedOnboarding | Boolean | - | Yes | false | No |

**Indexes:**
- Index 1: `userId` (Key, Ascending)
- Index 2: `email` (Key, Ascending)

**Permissions:**
- Document Security: **Enabled**
- Permissions: 
  - Create: `Users`
  - Read: `Users`
  - Update: `Users`
  - Delete: `Users`

---

#### Collection 2: Categories
- **Collection ID:** `categories`
- **Name:** Categories

**Attributes:**
| Attribute Key | Type | Size | Required | Default | Array |
|--------------|------|------|----------|---------|-------|
| userId | String | 255 | Yes | - | No |
| name | String | 255 | Yes | - | No |
| icon | String | 255 | Yes | - | No |
| color | String | 50 | Yes | - | No |
| budget | Integer | - | Yes | 0 | No |

**Indexes:**
- Index 1: `userId` (Key, Ascending)
- Index 2: `name` (Fulltext, Ascending)

**Permissions:**
- Document Security: **Enabled**
- Permissions:
  - Create: `Users`
  - Read: `Users`
  - Update: `Users`
  - Delete: `Users`

---

#### Collection 3: Expenses
- **Collection ID:** `expenses`
- **Name:** Expenses

**Attributes:**
| Attribute Key | Type | Size | Required | Default | Array |
|--------------|------|------|----------|---------|-------|
| userId | String | 255 | Yes | - | No |
| title | String | 255 | Yes | - | No |
| amount | Integer | - | Yes | - | No |
| category | String | 255 | Yes | - | No |
| icon | String | 255 | Yes | - | No |
| color | String | 50 | Yes | - | No |
| date | String | 255 | Yes | - | No |

**Indexes:**
- Index 1: `userId` (Key, Ascending)
- Index 2: `category` (Key, Ascending)
- Index 3: `date` (Key, Descending)

**Permissions:**
- Document Security: **Enabled**
- Permissions:
  - Create: `Users`
  - Read: `Users`
  - Update: `Users`
  - Delete: `Users`

---

### 4. Update Your App Code

Replace all imports from `api.js` to `appwriteAPI.js`:

**Before:**
```javascript
import { authAPI, userAPI, categoryAPI, expenseAPI } from './services/api';
```

**After:**
```javascript
import { authAPI, userAPI, categoryAPI, expenseAPI } from './services/appwriteAPI';
```

### 5. Update Files

You need to update imports in these files:
- `src/screens/Login.js`
- `src/screens/Register.js`
- `src/screens/Home.js`
- `src/screens/Profile.js`
- `src/screens/Category.js`
- `src/screens/Create.js`
- `src/screens/Insights.js`
- `src/screens/Onboarding.js`
- `src/context/ExpenseContext.js`

### 6. Key Differences from Old Backend

1. **Authentication:** 
   - Appwrite handles authentication natively with sessions
   - No need for JWT tokens anymore
   - Sessions are managed automatically

2. **User IDs:** 
   - Appwrite generates unique user IDs automatically
   - Document IDs use `$id` property

3. **Queries:** 
   - Use Appwrite Query helpers for filtering
   - Real-time subscriptions available (optional feature)

4. **No Backend Server:**
   - All API calls go directly to Appwrite
   - Backend folder can be deprecated

### 7. Testing

1. Start your app: `npm start`
2. Test registration with a new account
3. Test login
4. Create categories
5. Add expenses
6. Verify all CRUD operations work

### 8. Environment Variables (Optional)

For better security, you can move configuration to environment variables:

Create `.env` file:
```
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=666d96a5002201b52dc4
APPWRITE_DATABASE_ID=budgetbuddy_db
```

### 9. Additional Appwrite Features You Can Use

- **Real-time:** Subscribe to collection changes
- **Storage:** Store user profile pictures
- **Cloud Functions:** Server-side logic if needed
- **Teams:** Multi-user collaboration
- **Webhooks:** Integrate with other services

---

## 🔒 Security Notes

- All collections use Document Security
- Users can only access their own data
- Authentication is required for all operations
- Session management is automatic

## 📝 Migration Complete!

Your Flask backend is now replaced with Appwrite. The old `backend/` folder can be archived or removed once you've verified everything works correctly.

## Need Help?

- Appwrite Docs: https://appwrite.io/docs
- Discord Community: https://discord.com/invite/appwrite
- GitHub: https://github.com/appwrite/appwrite

---

**Happy Coding! 🎉**
