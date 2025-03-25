from ..repository.evento_repository import EventoRepository

class EventoController:
    def __init__(self):
        self.repository = EventoRepository()

    def filtrar_eventos(self, eventos, año=None, mes=None, dia_semana=None):
        return self.service.filtrar_eventos(eventos, año, mes, dia_semana)