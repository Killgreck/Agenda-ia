from .base_repository import BaseRepository

class EventoRepository(BaseRepository):
    def __init__(self):
        super().__init__('eventos')
