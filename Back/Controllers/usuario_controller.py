from fastapi import APIRouter, Depends
from ..Service.usuario_service import UsuarioService

router = APIRouter()
usuario_service = UsuarioService()

@router.post("/usuarios/")
async def create_usuario(usuario: UsuarioSchema):
    return usuario_service.create_usuario(usuario)

# Add other CRUD endpoints
