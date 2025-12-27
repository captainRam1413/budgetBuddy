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
            # MongoDB connection options with proper SSL/TLS settings
            # Using ssl_cert_reqs=CERT_NONE to bypass SSL certificate verification
            # This is safer than tlsAllowInvalidCertificates and more compatible
            connection_options = {
                'tls': True,
                'tlsAllowInvalidCertificates': True,  # Allow invalid certificates for Windows compatibility
                'tlsCAFile': certifi.where(),
                'serverSelectionTimeoutMS': 30000,  # Increased timeout
                'connectTimeoutMS': 30000,
                'socketTimeoutMS': 30000,
                'retryWrites': True,
                'w': 'majority',
                'ssl_cert_reqs': ssl.CERT_NONE,  # Bypass certificate verification
            }
            
            cls.client = MongoClient(Config.MONGODB_URI, **connection_options)
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
