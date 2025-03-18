class NotificacionService:
    def __init__(self, mensaje="", metodo="email"):
        self.mensaje = mensaje
        self.metodo = metodo  # email, push, sms

    def enviar_notificacion(self, usuario):
        """Envía una notificación al usuario por el método especificado"""
        if self.metodo == "email":
            print(f"Enviando email a {usuario.correo}: {self.mensaje}")
        elif self.metodo == "push":
            print(f"Enviando notificación push a {usuario.nombre}: {self.mensaje}")
        elif self.metodo == "sms":
            print(f"Enviando SMS a {usuario.nombre}: {self.mensaje}")
        return True