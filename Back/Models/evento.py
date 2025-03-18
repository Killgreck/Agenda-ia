from datetime import date, time
import uuid

class Evento:
    def __init__(self, titulo="", fecha=None, hora=None, descripcion="", ubicacion=""):
        # Atributos
        self.id = str(uuid.uuid4())  # Generamos un ID único para cada evento
        self.titulo = titulo
        self.fecha = fecha  # tipo date
        self.hora = hora    # tipo time
        self.descripcion = descripcion
        self.ubicacion = ubicacion
        self.estado = "Activo"

    # [Resto de getters, setters y métodos de la versión mejorada]

    def modificar_evento(self, titulo=None, fecha=None, hora=None, descripcion=None, ubicacion=None):
        """Modifica los atributos del evento si se proporcionan nuevos valores"""
        if titulo is not None:
            self.titulo = titulo
        if fecha is not None:
            self.fecha = fecha
        if hora is not None:
            self.hora = hora
        if descripcion is not None:
            self.descripcion = descripcion
        if ubicacion is not None:
            self.ubicacion = ubicacion
        return True

    def cancelar_evento(self):
        """Marca el evento como cancelado"""
        self.estado = "Cancelado"
        return True

    def coincide_con_filtro(self, filtro):
        """Comprueba si el evento coincide con un filtro de búsqueda"""
        filtro = filtro.lower()
        if filtro in self.titulo.lower() or filtro in self.descripcion.lower() or filtro in self.ubicacion.lower():
            return True
        return False

    def hay_conflicto(self, otro_evento):
        """Verifica si hay conflicto con otro evento"""
        # Implementar lógica de conflicto basada en CRUD.py
        if self.fecha != otro_evento.fecha:
            return False

        # Convertir a datetime y verificar superposición
        # [Implementación similar a CRUD.py]
        return False