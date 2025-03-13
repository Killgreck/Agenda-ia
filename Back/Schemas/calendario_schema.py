from pydantic import BaseModel

class CalendarioSchema(BaseModel):
    nombre: str
    descripcion: str
