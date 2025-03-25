from ..Service.motor_ia_service import MotorIAService

class MotorIAController:
    def __init__(self):
        self.service = MotorIAService()

    def iniciar_entrenamiento(self, datos_historicos=None):
        return self.service.iniciar_entrenamiento(datos_historicos)
