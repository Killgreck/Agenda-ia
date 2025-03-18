class Usuario:
    def __init__(self, nombre, correo, tipo_cuenta="estandar", nombre_calendario="Principal"):
        self.nombre = nombre
        self.correo = correo
        self.tipo_cuenta = tipo_cuenta
        self.agenda = Agenda()  # Usar la nueva clase Agenda

    def crear_evento(self, titulo, fecha, hora, descripcion="", ubicacion=""):
        """Crea y añade un nuevo evento a la agenda del usuario"""
        evento = Evento(titulo, fecha, hora, descripcion, ubicacion)
        self.agenda.agregar_evento(evento)
        return evento

    def ver_eventos(self):
        """Devuelve todos los eventos del usuario"""
        return self.agenda.obtener_eventos()

    # [Añadir más métodos relevantes]