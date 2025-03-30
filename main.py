from datetime import date, time, datetime, timedelta
import sys
import os

# Agregamos clases necesarias para la prueba
from Back.Models.evento import Evento
from Back.Models.agenda import Agenda
from Back.Service.motor_ia_service import MotorIAService
from Back.Service.evaluacion_eficiencia_service import EvaluacionEficienciaService
from Back.Service.notificacion_service import NotificacionService
from datetime import date, time
from Back.Controllers.evento_controller import EventoController
from Back.Models.evento import Evento
# Clase Usuario con integración de Agenda
def probar_filtrado_eventos():
    print("=== Prueba de filtrado de eventos por año, mes y día de la semana ===")

    # Inicializar el controlador
    controller = EventoController()

    # Crear algunos eventos de ejemplo
    eventos = [
        Evento(
            titulo="Reunión de trabajo",
            fecha=date(2025, 1, 15),  # Miércoles (2)
            hora=time(10, 0),
            descripcion="Reunión con el equipo de desarrollo",
            ubicacion="Sala de conferencias"
        ),
        Evento(
            titulo="Almuerzo con cliente",
            fecha=date(2025, 2, 20),  # Jueves (3)
            hora=time(13, 0),
            descripcion="Almuerzo con cliente potencial",
            ubicacion="Restaurante céntrico"
        ),
        Evento(
            titulo="Conferencia anual",
            fecha=date(2024, 5, 10),  # Viernes (4)
            hora=time(9, 0),
            descripcion="Conferencia anual de tecnología",
            ubicacion="Centro de convenciones"
        ),
        Evento(
            titulo="Reunión de planificación",
            fecha=date(2025, 5, 5),  # Lunes (0)
            hora=time(14, 30),
            descripcion="Planificación del próximo trimestre",
            ubicacion="Oficina principal"
        ),
        Evento(
            titulo="Taller de innovación",
            fecha=date(2025, 5, 12),  # Lunes (0)
            hora=time(15, 0),
            descripcion="Taller para fomentar la innovación",
            ubicacion="Sala de capacitación"
        )
    ]

    # Guardar los eventos en la base de datos
    for evento in eventos:
        controller.repository.create(evento.__dict__)

    print("\n1. Filtrar eventos por año (2025):")
    eventos_2025 = controller.obtener_eventos_por_filtro(año=2025)
    for evento in eventos_2025:
        print(f"- {evento.titulo} ({evento.fecha})")

    print("\n2. Filtrar eventos por mes (Mayo):")
    eventos_mayo = controller.obtener_eventos_por_filtro(mes=5)
    for evento in eventos_mayo:
        print(f"- {evento.titulo} ({evento.fecha})")

    print("\n3. Filtrar eventos por día de la semana (Lunes):")
    eventos_lunes = controller.obtener_eventos_por_filtro(dia_semana=0)  # 0 = Lunes
    for evento in eventos_lunes:
        print(f"- {evento.titulo} ({evento.fecha})")

    print("\n4. Filtrar eventos por año y mes (2025, Mayo):")
    eventos_2025_mayo = controller.obtener_eventos_por_filtro(año=2025, mes=5)
    for evento in eventos_2025_mayo:
        print(f"- {evento.titulo} ({evento.fecha})")

    print("\n5. Filtrar eventos por todos los criterios (2025, Mayo, Lunes):")
    eventos_completo = controller.obtener_eventos_por_filtro(año=2025, mes=5, dia_semana=0)
    for evento in eventos_completo:
        print(f"- {evento.titulo} ({evento.fecha})")

    # Limpiar los eventos de prueba
    for evento in eventos:
        controller.repository.collection.delete_one({"id": evento.id})

    print("\nPrueba completada.")

class Usuario:
    def __init__(self, nombre, correo, tipo_cuenta="estandar"):
        self.nombre = nombre
        self.correo = correo
        self.tipo_cuenta = tipo_cuenta
        self.agenda = Agenda()  # Cada usuario tiene su propia agenda

    def crear_evento(self, titulo, fecha, hora, descripcion="", ubicacion=""):
        """Crea y añade un nuevo evento a la agenda del usuario"""
        evento = Evento(titulo, fecha, hora, descripcion, ubicacion)
        self.agenda.agregar_evento(evento)
        return evento

    def ver_eventos(self):
        """Devuelve todos los eventos del usuario"""
        return self.agenda.obtener_eventos()

    def buscar_evento(self, filtro):
        """Busca eventos por texto en título, descripción o ubicación"""
        return self.agenda.buscar_eventos(filtro)

    def eliminar_evento(self, evento_id):
        """Elimina un evento de la agenda por su ID"""
        return self.agenda.eliminar_evento(evento_id)

def main():
    print("\n=== SISTEMA DE AGENDA IA - PRUEBA DE INTEGRACIÓN ===\n")

    # 1. Crear un usuario
    print("Creando usuario...")
    usuario = Usuario("María López", "maria@example.com", "premium")
    print(f"Usuario creado: {usuario.nombre} ({usuario.correo})")

    # 2. Crear eventos para el usuario
    print("\n--- Creación de eventos ---")
    hoy = date.today()

    evento1 = usuario.crear_evento(
        "Reunión de proyecto",
        hoy,
        time(10, 0),
        "Revisión de avances con el equipo",
        "Sala de juntas"
    )
    print(f"Evento creado: {evento1}")

    evento2 = usuario.crear_evento(
        "Almuerzo con cliente",
        hoy,
        time(13, 0),
        "Presentación de propuesta",
        "Restaurante Italiano"
    )
    print(f"Evento creado: {evento2}")

    evento3 = usuario.crear_evento(
        "Cita médica",
        hoy + timedelta(days=1),
        time(9, 30),
        "Chequeo rutinario",
        "Centro Médico"
    )
    print(f"Evento creado: {evento3}")

    evento4 = usuario.crear_evento(
        "Conferencia IA",
        hoy + timedelta(days=2),
        time(14, 0),
        "Tendencias de IA en 2025",
        "Centro de Convenciones"
    )
    print(f"Evento creado: {evento4}")

    # 3. Ver todos los eventos
    print("\n--- Lista de eventos ---")
    eventos = usuario.ver_eventos()
    for i, evento in enumerate(eventos, 1):
        print(f"{i}. {evento}")

    # 4. Modificar un evento
    print("\n--- Modificación de evento ---")
    print(f"Evento original: {evento2}")
    evento2.modificar_evento(
        hora=time(14, 0),
        ubicacion="Restaurante Mediterráneo"
    )
    print(f"Evento modificado: {evento2}")

    # 5. Buscar eventos
    print("\n--- Búsqueda de eventos ---")
    resultados = usuario.buscar_evento("reunión")
    print(f"Resultados de búsqueda 'reunión': {len(resultados)} encontrados")
    for evento in resultados:
        print(f"- {evento}")

    # 6. Filtrar eventos por fecha
    print("\n--- Filtrado por fecha ---")
    eventos_hoy = usuario.agenda.obtener_eventos_por_fecha(hoy)
    print(f"Eventos para hoy ({hoy}): {len(eventos_hoy)}")
    for evento in eventos_hoy:
        print(f"- {evento}")

    # 7. Enviar notificación
    print("\n--- Envío de notificaciones ---")
    notificacion = NotificacionService(
        f"Tienes {len(eventos_hoy)} eventos programados para hoy",
        "email"
    )
    notificacion.enviar_notificacion(usuario)
    
    if __name__ == "__main__":
        probar_filtrado_eventos()
    # 8. Usar el motor IA para sugerir horarios
    print("\n--- Sugerencias de horarios con IA ---")
    motor = MotorIAService()
    sugerencias = motor.sugerir_horario(usuario.agenda, "Reunión de seguimiento", 60)
    print("Sugerencias para 'Reunión de seguimiento':")
    for i, sugerencia in enumerate(sugerencias, 1):
        print(f"{i}. Fecha: {sugerencia['fecha']}, Hora: {sugerencia['hora']}, Prioridad: {sugerencia['prioridad']}")

    # 9. Optimizar agenda
    print("\n--- Optimización de agenda ---")
    sugerencias_optimizacion = motor.optimizar_agenda(usuario.agenda)
    if sugerencias_optimizacion:
        print("Sugerencias para optimizar tu agenda:")
        for sugerencia in sugerencias_optimizacion:
            print(f"- {sugerencia}")
    else:
        print("Tu agenda ya está bien optimizada.")

    # 10. Evaluar eficiencia
    print("\n--- Evaluación de eficiencia ---")
    evaluador = EvaluacionEficienciaService()
    preguntas = evaluador.analizar_eficiencia(usuario.agenda)
    if preguntas:
        print("Preguntas de evaluación generadas:")
        for pregunta in preguntas:
            print(f"- {pregunta}")
        evaluador.enviar_pregunta(usuario, preguntas[0])

    # 11. Registrar respuesta a evaluación
    if preguntas:
        print("\nSimulando respuesta del usuario...")
        evaluador.registrar_respuesta("Sí, me siento cómodo con la agenda", 8)
        stats = evaluador.generar_estadisticas()
        print("Estadísticas de evaluación:")
        for key, value in stats.items():
            print(f"- {key}: {value}")

    # 12. Cancelar evento
    print("\n--- Cancelación de evento ---")
    print(f"Cancelando evento: {evento4}")
    evento4.cancelar_evento()
    print("Evento cancelado")

    # 13. Eliminar evento
    print("\n--- Eliminación de evento ---")
    print(f"Eliminando evento: {evento3.titulo}")
    resultado = usuario.agenda.eliminar_evento(evento3.id)
    print(f"Resultado de eliminación: {'Exitoso' if resultado else 'Fallido'}")

    # 14. Verificar eventos finales
    print("\n--- Lista final de eventos ---")
    eventos_finales = usuario.ver_eventos()
    print(f"Total de eventos: {len(eventos_finales)}")
    for i, evento in enumerate(eventos_finales, 1):
        estado = "Activo"
        if hasattr(evento, 'estado') and evento.estado == "Cancelado":
            estado = "Cancelado"
        print(f"{i}. {evento} - Estado: {estado}")

    # 15. Mostrar estadísticas de la agenda
    print("\n--- Estadísticas de la agenda ---")
    stats = usuario.agenda.estadisticas()
    print("Estadísticas:")
    for key, value in stats.items():
        print(f"- {key}: {value}")

    print("\n=== FIN DE PRUEBA DEL SISTEMA DE AGENDA ===")

if __name__ == "__main__":
    main()
