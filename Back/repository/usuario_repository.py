from .base_repository import BaseRepository

class UsuarioRepository(BaseRepository):
    def __init__(self):
        super().__init__('usuarios')
