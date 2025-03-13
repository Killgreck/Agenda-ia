from fastapi import APIRouter, Depends
from ..Service.calendario_service import CalendarioService

router = APIRouter()
calendario_service = CalendarioService()

@router.post("/calendarios/")
async def create_calendario(calendario: CalendarioSchema):
    return calendario_service.create_calendario(calendario)

# Add other CRUD endpoints
