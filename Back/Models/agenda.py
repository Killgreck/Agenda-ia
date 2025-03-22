from typing import List, Dict
from datetime import date, timedelta

class Agenda:
    def __init__(self):
        # Atributos
        self.eventos = []  # Lista de eventos

    def agregar_evento(self, evento):
        """Agrega un nuevo evento a la agenda"""
        self.eventos.append(evento)
        return evento

    def obtener_eventos(self):
        """Devuelve todos los eventos de la agenda"""
        return self.eventos

    def buscar_eventos(self, filtro):
        """Busca eventos que contengan el texto filtro en título, descripción o ubicación"""
        resultados = []
        filtro = filtro.lower()
        for evento in self.eventos:
            if (filtro in evento.titulo.lower() or
                filtro in evento.descripcion.lower() or
                filtro in evento.ubicacion.lower()):
                resultados.append(evento)
        return resultados

    def eliminar_evento(self, evento_id):
        """Elimina un evento por su ID"""
        for i, evento in enumerate(self.eventos):
            if evento.id == evento_id:
                self.eventos.pop(i)
                return True
        return False

    def obtener_eventos_por_fecha(self, fecha):
        """Filtra eventos por fecha específica"""
        return [evento for evento in self.eventos if evento.fecha == fecha]

    def estadisticas(self):
        """Genera estadísticas sobre los eventos en la agenda"""
        total_eventos = len(self.eventos)
        eventos_por_fecha = {}

        for evento in self.eventos:
            fecha_str = evento.fecha.strftime("%Y-%m-%d")
            if fecha_str in eventos_por_fecha:
                eventos_por_fecha[fecha_str] += 1
            else:
                eventos_por_fecha[fecha_str] = 1

        dia_mas_ocupado = max(eventos_por_fecha.items(), key=lambda x: x[1]) if eventos_por_fecha else ("N/A", 0)

        return {
            "total_eventos": total_eventos,
            "eventos_por_fecha": eventos_por_fecha,
            "dia_mas_ocupado": dia_mas_ocupado[0],
            "eventos_en_dia_mas_ocupado": dia_mas_ocupado[1]
        }