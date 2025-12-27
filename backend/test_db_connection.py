from database import Database
from config import Config

print("Testing database connection...")
print(f"MongoDB URI: {Config.MONGODB_URI}")
print(f"Database Name: {Config.DATABASE_NAME}")

success = Database.initialize()
print(f"\nConnection result: {success}")

if success:
    print("Database connection successful!")
    # Try to get a collection
    users = Database.get_collection('users')
    print(f"Users collection: {users}")
else:
    print("Database connection failed!")
