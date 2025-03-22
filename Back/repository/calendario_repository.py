from .base_repository import BaseRepository

class CalendarioRepository(BaseRepository):
    def __init__(self):
        super().__init__('calendarios')
