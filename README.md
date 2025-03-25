# Agenda ia
Este es el repositorio oficial del proyecto agenda ia 
 
# Directorio de la aplicación

- **Back/**: Backend de la aplicación
- **Models/**: Modelos de datos (Evento, Calendario, Usuario, Agenda)
- **Controllers/**: Controladores para manejar solicitudes HTTP
- **Service/**: Servicios para la lógica de negocio, incluyendo IA
- **Schemas/**: Esquemas de validación de datos
- **Repository/**: Acceso a datos
## Características

- Gestión completa de eventos y calendarios
- Detección de conflictos entre eventos
- Sugerencias inteligentes de horarios mediante IA
- Optimización automática de agenda
- Evaluación de eficiencia
- Sistema de notificaciones

Estructura de Directorios

back/

├── controllers/

│   ├── __init__.py

│   ├── evento_controller.py

│   ├── calendario_controller.py

│   └── usuario_controller.py

├── models/

│   ├── __init__.py

│   ├── evento.py

│   ├── calendario.py

│   └── usuario.py

├── repository/

│   ├── __init__.py

│   ├── evento_repository.py

│   ├── calendario_repository.py

│   └── usuario_repository.py

├── schemas/

│   ├── __init__.py

│   ├── evento_schema.py

│   ├── calendario_schema.py

│   └── usuario_schema.py

├── service/

│   ├── __init__.py

│   ├── evento_service.py

│   ├── calendario_service.py

│   └── usuario_service.py

└── __init__.py 
## Guía de Instalación

### Requisitos Previos

## Características
- Filtrado de eventos por año, mes y día de la semana
- Entrenamiento personalizado del modelo de IA

## Uso del Sistema de IA

### Filtrado de Eventos
El sistema permite filtrar eventos por:
- Año
- Mes
- Día de la semana

Ejemplo:
```python
# Filtrar eventos del año 2025
eventos_2025 = evento_controller.filtrar_eventos(eventos, año=2025)

# Filtrar eventos de marzo
eventos_marzo = evento_controller.filtrar_eventos(eventos, mes=3)

# Filtrar eventos de los lunes
eventos_lunes = evento_controller.filtrar_eventos(eventos, dia_semana=0)
```

### Entrenamiento del Modelo de IA
Para iniciar el entrenamiento del modelo de IA:

```python
from Back.Controllers.motor_ia_controller import MotorIAController

# Iniciar entrenamiento
motor_controller = MotorIAController()
resultado = motor_controller.iniciar_entrenamiento()
print(resultado["mensaje"])
```
- Python 3.8 o superior
- pip (gestor de paquetes de Python)

### Pasos de Instalación

1. Clonar el repositorio:
Crear un entorno virtual (opcional pero recomendado):
python -m venv venv
Activar el entorno virtual:
En Windows:
venv\Scripts\activate
En Linux/MacOS:
source venv/bin/activate
Instalar las dependencias:
pip install -r requirements.txt
