from database import Database, EXPENSES_COLLECTION
from bson.objectid import ObjectId
from datetime import datetime

class Expense:
    @staticmethod
    def create(user_id, title, amount, category, icon, color):
        """Create a new expense"""
        expenses = Database.get_collection(EXPENSES_COLLECTION)
        
        expense_data = {
            "userId": user_id,
            "title": title,
            "amount": amount,
            "category": category,
            "icon": icon,
            "color": color,
            "date": datetime.utcnow(),
            "createdAt": datetime.utcnow()
        }
        
        result = expenses.insert_one(expense_data)
        return {
            "success": True,
            "expenseId": str(result.inserted_id),
            "message": "Expense created successfully"
        }
    
    @staticmethod
    def get_all_by_user(user_id):
        """Get all expenses for a user"""
        expenses = Database.get_collection(EXPENSES_COLLECTION)
        expense_list = list(expenses.find({"userId": user_id}).sort("date", -1))
        
        # Convert ObjectId to string and format dates
        for exp in expense_list:
            exp['_id'] = str(exp['_id'])
            exp['id'] = exp['_id']
            exp['date'] = exp['date'].isoformat()
        
        return {"success": True, "expenses": expense_list}
    
    @staticmethod
    def get_by_category(user_id, category_name):
        """Get all expenses for a specific category"""
        expenses = Database.get_collection(EXPENSES_COLLECTION)
        expense_list = list(expenses.find({
            "userId": user_id,
            "category": category_name
        }).sort("date", -1))
        
        # Convert ObjectId to string and format dates
        for exp in expense_list:
            exp['_id'] = str(exp['_id'])
            exp['id'] = exp['_id']
            exp['date'] = exp['date'].isoformat()
        
        return {"success": True, "expenses": expense_list}
    
    @staticmethod
    def get_category_total(user_id, category_name):
        """Get total spending for a category"""
        expenses = Database.get_collection(EXPENSES_COLLECTION)
        
        pipeline = [
            {"$match": {"userId": user_id, "category": category_name}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        
        result = list(expenses.aggregate(pipeline))
        total = result[0]['total'] if result else 0
        
        return {"success": True, "total": total}
    
    @staticmethod
    def delete(user_id, expense_id):
        """Delete an expense"""
        expenses = Database.get_collection(EXPENSES_COLLECTION)
        
        try:
            result = expenses.delete_one({
                "_id": ObjectId(expense_id),
                "userId": user_id
            })
            
            if result.deleted_count > 0:
                return {"success": True, "message": "Expense deleted successfully"}
            return {"success": False, "message": "Expense not found"}
        except:
            return {"success": False, "message": "Invalid expense ID"}
    
    @staticmethod
    def get_spending_summary(user_id):
        """Get spending summary grouped by category"""
        expenses = Database.get_collection(EXPENSES_COLLECTION)
        
        pipeline = [
            {"$match": {"userId": user_id}},
            {"$group": {
                "_id": "$category",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1},
                "icon": {"$first": "$icon"},
                "color": {"$first": "$color"}
            }},
            {"$sort": {"total": -1}}
        ]
        
        result = list(expenses.aggregate(pipeline))
        
        summary = []
        for item in result:
            summary.append({
                "category": item['_id'],
                "total": item['total'],
                "count": item['count'],
                "icon": item['icon'],
                "color": item['color']
            })
        
        return {"success": True, "summary": summary}
