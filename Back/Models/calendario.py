class Calendario:
    def __init__(self, nombre):
        self.nombre = nombre
        self.eventos = []

    def agregar_evento(self, evento):
        # Verificar conflictos con eventos existentes
        for ev_existente in self.eventos:
            if evento.hay_conflicto(ev_existente):
                return False

        # Si no hay conflictos, agregar el evento
        self.eventos.append(evento)
        return True

    