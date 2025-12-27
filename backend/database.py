from pymongo import MongoClient
from config import Config
import ssl
import certifi

class Database:
    client = None
    db = None

    @classmethod
    def initialize(cls):
        """Initialize MongoDB connection"""
        try:
            print("🔄 Attempting to connect to MongoDB...")
            print(f"MongoDB URI: {Config.MONGODB_URI[:50]}..." if Config.MONGODB_URI else "MongoDB URI is None!")
            
            if not Config.MONGODB_URI:
                print("❌ MongoDB URI is not set. Please check your .env file.")
                return False
            
            # MongoDB connection options
            # Simplified for Python 3.13 compatibility on Windows
            connection_options = {
                'serverSelectionTimeoutMS': 30000,
                'connectTimeoutMS': 30000,
                'socketTimeoutMS': 30000,
                'retryWrites': True,
            }
            
            cls.client = MongoClient(Config.MONGODB_URI, **connection_options)
            cls.db = cls.client[Config.DATABASE_NAME]
            # Test connection
            cls.client.admin.command('ping')
            print(f"✅ Connected to MongoDB database: {Config.DATABASE_NAME}")
            return True
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

    @classmethod
    def get_collection(cls, collection_name):
        """Get a collection from the database"""
        if cls.db is None:
            success = cls.initialize()
            if not success or cls.db is None:
                raise Exception("Database connection not established. Please check your MongoDB URI and connection.")
        return cls.db[collection_name]

# Collection names
USERS_COLLECTION = 'users'
EXPENSES_COLLECTION = 'expenses'
CATEGORIES_COLLECTION = 'categories'
BUDGETS_COLLECTION = 'budgets'
