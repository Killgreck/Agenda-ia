import unittest
from datetime import datetime
from Back.Integration.abacus_integration import BackendIntegration
from unittest.mock import MagicMock

class TestAbacusIntegration(unittest.TestCase):
    def setUp(self):
        self.integration = BackendIntegration()
        self.integration.evento_service = MagicMock()
        self.integration.calendario_service = MagicMock()

    def test_process_event(self):
        event_data = {
            'nombre': 'Reunión de equipo',
            'fecha': '2024-03-20',
            'hora_inicio': '10:00',
            'duracion_minutos': 60
        }
        mock_evento = MagicMock()
        mock_evento.id = 1
        mock_evento.titulo = 'Reunión de equipo'
        mock_evento.fecha = datetime(2024, 3, 20, 10, 0)
        self.integration.evento_service.crear_evento.return_value = mock_evento
        result = self.integration.process_event(event_data)
        self.assertEqual(result['id'], 1)
        self.assertEqual(result['titulo'], 'Reunión de equipo')
        self.assertEqual(result['fecha'], '2024-03-20 10:00')

if __name__ == '__main__':
    unittest.main()
