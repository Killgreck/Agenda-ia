from pymongo import MongoClient
from ..config.mongodb_config import MONGODB_URI

class MongoDBConnection:
    _instance = None
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = MongoClient(MONGODB_URI)
        return cls._instance.agenda_ia
