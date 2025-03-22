# Script para probar la conexión a MongoDB Atlas
import os
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

# Cargar variables de entorno desde el archivo .env
load_dotenv()

def test_direct_connection():
    """Prueba la conexión directa a MongoDB Atlas usando las credenciales del .env"""
    username = os.environ.get("MONGODB_USERNAME")
    password = os.environ.get("MONGODB_PASSWORD")

    if not username or not password:
        print("Error: Las credenciales de MongoDB no están configuradas en el archivo .env")
        return False

    uri = f"mongodb+srv://{username}:{password}@cluster0.72j4r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

    # Crear un nuevo cliente y conectar al servidor
    client = MongoClient(uri, server_api=ServerApi('1'))

    # Enviar un ping para confirmar una conexión exitosa
    try:
        client.admin.command('ping')
        print("¡Conexión exitosa a MongoDB Atlas!")
        return True
    except Exception as e:
        print(f"Error al conectar a MongoDB Atlas: {e}")
        return False
    finally:
        client.close()

if __name__ == "__main__":
    test_direct_connection()