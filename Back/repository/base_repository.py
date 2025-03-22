from ..database.mongodb_connection import MongoDBConnection

class BaseRepository:
    def __init__(self, collection_name):
        self.db = MongoDBConnection.get_instance()
        self.collection = self.db[collection_name]
