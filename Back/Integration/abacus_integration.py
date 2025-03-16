from ..Service.evento_service import EventoService
from ..Service.calendario_service import CalendarioService
from ..Service.usuario_service import UsuarioService
from ..Schemas.evento_schema import EventoSchema
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('backend.abacus_integration')

class BackendIntegration:
    def __init__(self):
        self.evento_service = EventoService()
        self.calendario_service = CalendarioService()
        self.usuario_service = UsuarioService()

    def process_event(self, event_data):
        try:
            logger.info(f"Procesando evento: {event_data}")
            evento_data = {
                'titulo': event_data.get('nombre'),
                'descripcion': f"Duración: {event_data.get('duracion_minutos')} minutos",
                'fecha': datetime.strptime(f"{event_data.get('fecha')} {event_data.get('hora_inicio')}", '%Y-%m-%d %H:%M')
            }
            nuevo_evento = self.evento_service.crear_evento(evento_data)
            logger.info(f"Evento creado con ID: {nuevo_evento.id}")
            return {
                'id': nuevo_evento.id,
                'titulo': nuevo_evento.titulo,
                'fecha': nuevo_evento.fecha.strftime('%Y-%m-%d %H:%M')
            }
        except Exception as e:
            logger.error(f"Error al procesar evento: {str(e)}")
            raise EventoIntegrationError(f"Error al crear evento: {str(e)}")

    def get_daily_evaluation(self, date_str):
        try:
            logger.info(f"Obteniendo evaluación para: {date_str}")
            date_obj = datetime.strptime(date_str, '%d/%m/%Y').date()
            eventos = self.calendario_service.obtener_eventos_por_fecha(date_obj)
            if not eventos:
                return f"No hay eventos programados para {date_str}"
            resultado = f"Eventos para {date_str}:\n"
            for evento in eventos:
                resultado += f"- {evento.titulo} ({evento.fecha.strftime('%H:%M')})\n"
            return resultado
        except Exception as e:
            logger.error(f"Error al obtener evaluación diaria: {str(e)}")
            raise CalendarioIntegrationError(f"Error al obtener evaluación: {str(e)}")

    def get_weekly_stats(self, start_date_str, end_date_str):
        try:
            logger.info(f"Obteniendo estadísticas para: {start_date_str} - {end_date_str}")
            start_date = datetime.strptime(start_date_str, '%d/%m/%Y').date()
            end_date = datetime.strptime(end_date_str, '%d/%m/%Y').date()
            eventos = self.calendario_service.obtener_eventos_por_rango(start_date, end_date)
            total_eventos = len(eventos)
            horas_totales = sum([(e.fecha.hour * 60 + e.fecha.minute) for e in eventos]) / 60
            resultado = f"Estadísticas del {start_date_str} al {end_date_str}:\n"
            resultado += f"- Total de eventos: {total_eventos}\n"
            resultado += f"- Horas totales: {horas_totales:.1f}\n"
            return resultado
        except Exception as e:
            logger.error(f"Error al obtener estadísticas semanales: {str(e)}")
            raise CalendarioIntegrationError(f"Error al obtener estadísticas: {str(e)}")

class EventoIntegrationError(Exception):
    pass

class CalendarioIntegrationError(Exception):
    pass
