from ..repository.evento_repository import EventoRepository

class EventoService:
    def __init__(self):
        self.repository = EventoRepository()

    def create_evento(self, evento):
        return self.repository.create(evento)

    def filtrar_eventos_por_año(self, eventos, año):
        return [evento for evento in eventos if evento.get_year() == año]

    def filtrar_eventos_por_mes(self, eventos, mes):
        return [evento for evento in eventos if evento.get_month() == mes]

    def filtrar_eventos_por_dia_semana(self, eventos, dia_semana):
        return [evento for evento in eventos if evento.get_weekday() == dia_semana]

    def filtrar_eventos(self, eventos, año=None, mes=None, dia_semana=None):
        resultado = eventos
        if año is not None:
            resultado = self.filtrar_eventos_por_año(resultado, año)
        if mes is not None:
            resultado = self.filtrar_eventos_por_mes(resultado, mes)
        if dia_semana is not None:
            resultado = self.filtrar_eventos_por_dia_semana(resultado, dia_semana)
        return resultado
