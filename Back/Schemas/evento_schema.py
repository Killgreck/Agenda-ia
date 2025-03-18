from pydantic import BaseModel, Field
from datetime import date, time
from typing import Optional

class EventoBase(BaseModel):
    titulo: str = Field(..., min_length=3, max_length=100)
    fecha: date
    hora: time
    descripcion: Optional[str] = ""
    ubicacion: Optional[str] = ""

class EventoCreate(EventoBase):
    pass

class EventoResponse(EventoBase):
    id: str
    estado: str = "Activo"

    class Config:
        orm_mode = True