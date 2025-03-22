from ..repository.evento_repository import EventoRepository

class EventoController:
    def __init__(self):
        self.repository = EventoRepository()