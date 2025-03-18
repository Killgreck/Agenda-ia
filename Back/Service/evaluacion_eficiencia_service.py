from ..Models.agenda import Agenda

class EvaluacionEficienciaService:
    def __init__(self):
        self.pregunta = ""
        self.respuesta_usuario = ""
        self.puntuacion = 0
        self.historico_preguntas = []

    # [Implementación basada en evaluacion_eficiencia.py]