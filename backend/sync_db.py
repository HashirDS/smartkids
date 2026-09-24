import os
from pymongo import MongoClient
from bson.objectid import ObjectId
from dotenv import load_dotenv

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    print("MONGO_URI is not set. Add it to the .env file.")
    exit(1)
try:
    client = MongoClient(MONGO_URI)
    db = client.smart_tutor
    print("✅ Connected to Database")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    exit()

def sync_users_to_progress():
    print("\n--- STARTING SYNC ---")
    
    # Get all users who are children
    users = list(db.users.find({"user_type": "child"}))
    print(f"🔍 Found {len(users)} children in 'users' collection.")

    for user in users:
        user_id = user["_id"]
        name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
        
        # Check if they have quiz history
        history_count = len(user.get('quiz_history', []))
        print(f"👤 Checking: {name} (ID: {user_id}) - Quiz History: {history_count} items")

        # Check if this ID exists in 'progress'
        progress_doc = db.progress.find_one({"_id": user_id})

        if not progress_doc:
            print(f"   ⚠️ Missing from Dashboard! Creating progress entry...")
            # Create the missing link
            new_progress = {
                "_id": user_id,
                "child_name": name,
                "completed_items": {
                    "abc": [], "numbers": [], "shapes": [],
                    "colors": [], "poems": [], "fruits": []
                },
                "total_score": 0,
                "last_activity": None
            }
            db.progress.insert_one(new_progress)
            print(f"   ✅ Fixed! Added to Dashboard.")
        else:
            print(f"   ✅ Already on Dashboard.")

    print("\n--- SYNC COMPLETE ---")
    print("👉 Please refresh your Dashboard webpage now.")

if __name__ == "__main__":
    sync_users_to_progress()