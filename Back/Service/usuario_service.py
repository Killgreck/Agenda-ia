from ..repository.usuario_repository import UsuarioRepository

class UsuarioService:
    def __init__(self):
        self.repository = UsuarioRepository()

    def create_usuario(self, usuario):
        return self.repository.create(usuario)
