from fastapi import APIRouter, Depends
from ..Service.evento_service import EventoService

router = APIRouter()
evento_service = EventoService()

@router.post("/eventos/")
async def create_evento(evento: EventoSchema):
    return evento_service.create_evento(evento)

# Add other CRUD endpoints
