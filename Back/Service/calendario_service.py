from ..repository.calendario_repository import CalendarioRepository

class CalendarioService:
    def __init__(self):
        self.repository = CalendarioRepository()

    def create_calendario(self, calendario):
        return self.repository.create(calendario)
