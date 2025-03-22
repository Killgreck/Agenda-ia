from os import getenv
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = f"mongodb+srv://admin:{getenv('MONGODB_PASSWORD')}@cluster0.mongodb.net/agenda_ia?retryWrites=true&w=majority"
