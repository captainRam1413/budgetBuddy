# Appwrite Database Update - Budget Period Feature

## Overview
This guide helps you add the new budget period feature fields to your Appwrite database.

## Required Changes

### 1. Update Users Collection

Go to your Appwrite Console → Database → Users Collection and add these two new attributes:

#### Attribute 1: budgetPeriod
- **Type**: String
- **Key**: `budgetPeriod`
- **Size**: 50
- **Required**: No (leave unchecked)
- **Default**: `monthly`
- **Array**: No

#### Attribute 2: periodStartDate
- **Type**: String (we store ISO date strings)
- **Key**: `periodStartDate`
- **Size**: 50
- **Required**: No (leave unchecked)
- **Default**: (leave empty - app will use current date)
- **Array**: No

## Steps to Add Attributes

1. Open Appwrite Console in your browser
2. Navigate to your project
3. Go to Databases → Select your database
4. Click on the "users" collection
5. Go to the "Attributes" tab
6. Click "Add Attribute" button
7. Select "String" type
8. Add each attribute with the specifications above
9. Wait for indexing to complete

## Existing Data

For existing users in your database:
- The app will automatically use `'monthly'` as the default budget period if not set
- The app will use the current date as the period start date if not set
- No manual data migration is needed

## Verification

After adding the attributes:
1. Run the app
2. Log in with an existing account
3. Go to Profile screen
4. Change the budget period to "Weekly"
5. Check the Appwrite console - the user document should now have `budgetPeriod: "weekly"` and a `periodStartDate` value

## What This Fixes

✅ Budget period persists across app restarts
✅ Budget period is synced across devices for the same user
✅ Logout now properly clears budget period state
✅ No logout errors related to budget period
