from database import Database, USERS_COLLECTION
from bson.objectid import ObjectId
import bcrypt
from datetime import datetime

class User:
    @staticmethod
    def create(name, email, phone, password):
        """Create a new user"""
        users = Database.get_collection(USERS_COLLECTION)
        
        # Check if user already exists
        if users.find_one({"email": email}):
            return {"success": False, "message": "User with this email already exists"}
        
        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        user_data = {
            "name": name,
            "email": email,
            "phone": phone,
            "password": hashed_password,
            "totalBudget": 0,
            "hasCompletedOnboarding": False,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = users.insert_one(user_data)
        return {
            "success": True,
            "userId": str(result.inserted_id),
            "message": "User created successfully"
        }
    
    @staticmethod
    def authenticate(email, password):
        """Authenticate user with email and password"""
        users = Database.get_collection(USERS_COLLECTION)
        user = users.find_one({"email": email})
        
        if not user:
            return {"success": False, "message": "Invalid email or password"}
        
        # Verify password
        if bcrypt.checkpw(password.encode('utf-8'), user['password']):
            return {
                "success": True,
                "user": {
                    "id": str(user['_id']),
                    "name": user['name'],
                    "email": user['email'],
                    "phone": user['phone'],
                    "totalBudget": user.get('totalBudget', 0),
                    "hasCompletedOnboarding": user.get('hasCompletedOnboarding', False)
                }
            }
        
        return {"success": False, "message": "Invalid email or password"}
    
    @staticmethod
    def get_by_id(user_id):
        """Get user by ID"""
        users = Database.get_collection(USERS_COLLECTION)
        try:
            user = users.find_one({"_id": ObjectId(user_id)})
            if user:
                return {
                    "success": True,
                    "user": {
                        "id": str(user['_id']),
                        "name": user['name'],
                        "email": user['email'],
                        "phone": user['phone'],
                        "totalBudget": user.get('totalBudget', 0),
                        "hasCompletedOnboarding": user.get('hasCompletedOnboarding', False)
                    }
                }
            return {"success": False, "message": "User not found"}
        except:
            return {"success": False, "message": "Invalid user ID"}
    
    @staticmethod
    def update_budget(user_id, total_budget):
        """Update user's total budget"""
        users = Database.get_collection(USERS_COLLECTION)
        try:
            result = users.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "totalBudget": total_budget,
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            if result.modified_count > 0:
                return {"success": True, "message": "Budget updated successfully"}
            return {"success": False, "message": "User not found"}
        except:
            return {"success": False, "message": "Invalid user ID"}
    
    @staticmethod
    def complete_onboarding(user_id):
        """Mark user's onboarding as complete"""
        users = Database.get_collection(USERS_COLLECTION)
        try:
            result = users.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "hasCompletedOnboarding": True,
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            if result.modified_count > 0:
                return {"success": True, "message": "Onboarding completed"}
            return {"success": False, "message": "User not found"}
        except:
            return {"success": False, "message": "Invalid user ID"}
    
    @staticmethod
    def update_profile(user_id, name=None, phone=None):
        """Update user profile"""
        users = Database.get_collection(USERS_COLLECTION)
        update_data = {"updatedAt": datetime.utcnow()}
        
        if name:
            update_data["name"] = name
        if phone:
            update_data["phone"] = phone
        
        try:
            result = users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            if result.modified_count > 0:
                return {"success": True, "message": "Profile updated successfully"}
            return {"success": False, "message": "User not found"}
        except:
            return {"success": False, "message": "Invalid user ID"}
