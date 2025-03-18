from pydantic import BaseModel
from typing import List
from .evento_schema import EventoResponse

class AgendaResponse(BaseModel):
    eventos: List[EventoResponse] = []

    class Config:
        orm_mode = True