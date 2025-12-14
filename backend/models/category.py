from database import Database, CATEGORIES_COLLECTION
from bson.objectid import ObjectId
from datetime import datetime

class Category:
    @staticmethod
    def create(user_id, name, icon, color, budget=0):
        """Create a new category for a user"""
        categories = Database.get_collection(CATEGORIES_COLLECTION)
        
        # Check if category already exists for this user
        if categories.find_one({"userId": user_id, "name": name}):
            return {"success": False, "message": "Category with this name already exists"}
        
        category_data = {
            "userId": user_id,
            "name": name,
            "icon": icon,
            "color": color,
            "budget": budget,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = categories.insert_one(category_data)
        return {
            "success": True,
            "categoryId": str(result.inserted_id),
            "message": "Category created successfully"
        }
    
    @staticmethod
    def create_multiple(user_id, categories_list):
        """Create multiple categories at once"""
        categories = Database.get_collection(CATEGORIES_COLLECTION)
        
        # Prepare category documents
        category_docs = []
        for cat in categories_list:
            category_docs.append({
                "userId": user_id,
                "name": cat['name'],
                "icon": cat['icon'],
                "color": cat['color'],
                "budget": cat.get('budget', 0),
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            })
        
        if category_docs:
            result = categories.insert_many(category_docs)
            return {
                "success": True,
                "count": len(result.inserted_ids),
                "message": f"{len(result.inserted_ids)} categories created successfully"
            }
        
        return {"success": False, "message": "No categories to create"}
    
    @staticmethod
    def get_all_by_user(user_id):
        """Get all categories for a user"""
        categories = Database.get_collection(CATEGORIES_COLLECTION)
        category_list = list(categories.find({"userId": user_id}))
        
        # Convert ObjectId to string
        for cat in category_list:
            cat['_id'] = str(cat['_id'])
        
        return {"success": True, "categories": category_list}
    
    @staticmethod
    def update_budget(user_id, category_name, budget):
        """Update category budget"""
        categories = Database.get_collection(CATEGORIES_COLLECTION)
        
        result = categories.update_one(
            {"userId": user_id, "name": category_name},
            {
                "$set": {
                    "budget": budget,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count > 0:
            return {"success": True, "message": "Category budget updated"}
        return {"success": False, "message": "Category not found"}
    
    @staticmethod
    def update_multiple_budgets(user_id, budgets_dict):
        """Update multiple category budgets at once"""
        categories = Database.get_collection(CATEGORIES_COLLECTION)
        updated_count = 0
        
        for category_name, budget in budgets_dict.items():
            result = categories.update_one(
                {"userId": user_id, "name": category_name},
                {
                    "$set": {
                        "budget": budget,
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            if result.modified_count > 0:
                updated_count += 1
        
        return {
            "success": True,
            "count": updated_count,
            "message": f"{updated_count} category budgets updated"
        }
    
    @staticmethod
    def delete(user_id, category_name):
        """Delete a category"""
        categories = Database.get_collection(CATEGORIES_COLLECTION)
        
        result = categories.delete_one({"userId": user_id, "name": category_name})
        
        if result.deleted_count > 0:
            return {"success": True, "message": "Category deleted successfully"}
        return {"success": False, "message": "Category not found"}
