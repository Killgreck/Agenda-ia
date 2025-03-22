from ..repository.usuario_repository import UsuarioRepository

class UsuarioController:
    def __init__(self):
        self.repository = UsuarioRepository()
