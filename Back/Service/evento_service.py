from ..repository.evento_repository import EventoRepository

class EventoService:
    def __init__(self):
        self.repository = EventoRepository()

    def create_evento(self, evento):
        return self.repository.create(evento)
