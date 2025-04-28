# Agenda ia
Una plataforma de productividad inteligente que aprovecha tecnologías de inteligencia artificial avanzadas para transformar la gestión de tareas y la participación del usuario, con un enfoque en el diseño intuitivo y la experiencia de usuario adaptativa.
 ## 🌟 Características principales

- **Optimización de tareas impulsada por IA**: Programación y priorización inteligentes
- **Seguimiento de la productividad en tiempo real**: A información adaptable basada en sus patrones de trabajo
- **Sugerencias de tareas personalizadas**:  Recomendaciones generadas por IA para mejorar la productividad
- **Gestión dinámica de calendarios**: Programación flexible de eventos con compatibilidad con recurrencia
- **Análisis integral**: Realice un seguimiento y visualice sus tendencias de productividad
- **Interfaz fácil de usar**: Diseño intuitivo para una interacción fluida

## Características secundarias

- Gestión completa de eventos y calendarios
- Detección de conflictos entre eventos
- Sugerencias inteligentes de horarios mediante IA
- Optimización automática de agenda
- Evaluación de eficiencia
- Sistema de notificaciones
  
## 🔧 Technology Stack

- **Frontend**: React con TypeScript, Tailwind CSS, swift, componentes de interfaz de usuario shadcn
- **Backend**: Node.js con Express y Python
- **Database**: MongoDB para almacenamiento flexible de documentos
- **Comunicación en tiempo real**: WebSockets para actualizaciones instantáneas
- **Integración de IA**:  Sugerencias avanzadas impulsadas por IA y conocimientos de productividad
- **Manejo de formularios**: Formulario de gancho de React con validación de Zod
- **Gestión de estado**: Consulta de React para el estado del servidor, Zustand para el estado del cliente




## 🚀 Primeros pasos

### Requisitos Previos

- Node.js (v20 or higher)
- npm or yarn
- Python 3.8 o superior
- pip (gestor de paquetes de Python)
## Guía de Instalación
1. Clone the repository:
   ```bash
   git clone https://github.com/Killgreck/Agenda-ia.git
   cd Agenda-ia
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5000`
Estructura de Directorios
## 📊 Estructura del proyecto
back/
```
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
```
```
/
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   ├── pages/         # Application pages
│   │   ├── App.tsx        # Main application component
│   │   └── main.tsx       # Application entry point
├── server/                # Backend server
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── db.ts              # Database connection
│   ├── mongodb.ts         # MongoDB configuration
│   ├── mongoModels.ts     # MongoDB schema models
│   └── mongoStorage.ts    # MongoDB storage interface
├── shared/                # Shared code between frontend and backend
│   └── schema.ts          # Data models and validation schemas
└── public/                # Static assets
```
## 🛠️ Desarrollo

- **Ejecutando la aplicación**: `npm run dev`
- **Edificio para producción**: `npm run build`
- **Iniciando el servidor de producción**: `npm run start`
## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
## 📞 Contact

- Developers: [Killgreck](https://github.com/Killgreck), [Tiassssss](https://github.com/Tiassssss),[Soomri](https://github.com/Soomri), [MateoOrtizZ](https://github.com/MateoOrtizZ)
- Project Link: [https://github.com/Killgreck/Agenda-ia](https://github.com/Killgreck/Agenda-ia)
