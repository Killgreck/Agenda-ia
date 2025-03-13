from pydantic import BaseModel
from datetime import datetime

class EventoSchema(BaseModel):
    titulo: str
    descripcion: str
    fecha: datetime
