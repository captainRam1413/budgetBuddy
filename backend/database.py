from pymongo import MongoClient
from config import Config

class Database:
    client = None
    db = None

    @classmethod
    def initialize(cls):
        """Initialize MongoDB connection"""
        try:
            cls.client = MongoClient(Config.MONGODB_URI)
            cls.db = cls.client[Config.DATABASE_NAME]
            # Test connection
            cls.client.admin.command('ping')
            print(f"✅ Connected to MongoDB database: {Config.DATABASE_NAME}")
            return True
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {str(e)}")
            return False

    @classmethod
    def get_collection(cls, collection_name):
        """Get a collection from the database"""
        if cls.db is None:
            cls.initialize()
        return cls.db[collection_name]

# Collection names
USERS_COLLECTION = 'users'
EXPENSES_COLLECTION = 'expenses'
CATEGORIES_COLLECTION = 'categories'
BUDGETS_COLLECTION = 'budgets'
