from Back.database.mongodb_connection import MongoDBConnection

def test_connection():
    try:
        db = MongoDBConnection.get_instance()
        print("MongoDB connection successful")
        return True
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        return False

if __name__ == "__main__":
    test_connection()
