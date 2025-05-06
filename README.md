# Agenda-IA: Intelligent Productivity Platform

Una plataforma inteligente de productividad que aprovecha tecnologías avanzadas de IA para transformar la gestión de tareas y la participación del usuario, con un enfoque en el diseño intuitivo y una experiencia de usuario adaptativa.

## 📚 Documentación

Para obtener información detallada sobre el proyecto, consulta:

- [Guía del Usuario](USER_GUIDE.md) - Manual completo para usuarios finales
- [Documentación Técnica](TECHNICAL_DOCUMENTATION.md) - Detalles para desarrolladores

## 🌟 Características Principales

- **Optimización de Tareas con IA**: Programación y priorización inteligente
- **Seguimiento de Productividad en Tiempo Real**: Información adaptativa basada en tus patrones de trabajo
- **Sugerencias de Tareas Personalizadas**: Recomendaciones generadas por IA para mejorar la productividad
- **Gestión Dinámica de Calendario**: Programación flexible de eventos con soporte de recurrencia
- **Análisis Completo**: Seguimiento y visualización de tus tendencias de productividad
- **Interfaz Amigable**: Diseño intuitivo para una interacción fluida
- **Asistente IA Conversacional**: Tu asistente personal potenciado por Gemini AI
- **Verificación de Correo y Recuperación de Contraseña**: Seguridad mejorada con SendGrid

## 🔧 Stack Tecnológico

- **Frontend**: React con TypeScript, Tailwind CSS, componentes shadcn UI
- **Backend**: Node.js con Express
- **Bases de datos**: 
  - PostgreSQL con Drizzle ORM para datos estructurados
  - MongoDB para almacenamiento flexible de documentos
- **Comunicación en tiempo real**: WebSockets para actualizaciones instantáneas
- **Integración de IA**: Gemini AI para conversación inteligente y generación de sugerencias
- **Servicio de correo**: SendGrid para verificación de email y restablecimiento de contraseñas
- **Gestión de formularios**: React Hook Form con validación Zod
- **Gestión de estado**: React Query para estado del servidor, Zustand para estado del cliente

## 🚀 Primeros Pasos

### Requisitos Previos

- Node.js (v20 o superior)
- npm o yarn
- PostgreSQL (opcional, se usa la versión en memoria por defecto)

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```
# Base de datos
DATABASE_URL=postgres://usuario:contraseña@localhost:5432/agenda_ia

# Autenticación
SESSION_SECRET=tu_secreto_seguro_para_sesiones

# SendGrid (para emails)
SENDGRID_API_KEY=tu_clave_api_de_sendgrid
SENDGRID_VERIFIED_SENDER=tu_email_verificado@ejemplo.com

# Gemini AI
GEMINI_API_KEY=tu_clave_api_de_gemini
```

### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/Killgreck/Agenda-ia.git
   cd Agenda-ia
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abre tu navegador y navega a `http://localhost:5000`

## 📊 Estructura del Proyecto

```
/
├── client/                # Aplicación frontend
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   │   └── ui/        # Componentes UI reutilizables
│   │   ├── hooks/         # Hooks personalizados
│   │   ├── lib/           # Funciones utilitarias
│   │   ├── pages/         # Páginas de la aplicación
│   │   ├── types/         # Definiciones de tipos
│   │   ├── utils/         # Funciones auxiliares
│   │   ├── App.tsx        # Componente principal
│   │   └── main.tsx       # Punto de entrada
│   └── index.html         # HTML principal
├── server/                # Servidor backend
│   ├── abacusLLM.ts       # Integración con API Abacus LLM
│   ├── db.ts              # Conexión PostgreSQL con Drizzle
│   ├── email.ts           # Funcionalidad de correos con SendGrid
│   ├── geminiLLM.ts       # Integración con API Gemini
│   ├── index.ts           # Punto de entrada del servidor
│   ├── mongoModels.ts     # Modelos para MongoDB
│   ├── mongoStorage.ts    # Implementación de almacenamiento MongoDB
│   ├── mongodb.ts         # Configuración y conexión MongoDB
│   ├── routes.ts          # Definición de rutas API
│   ├── storage.ts         # Interfaz de almacenamiento genérica
│   └── vite.ts            # Configuración Vite para desarrollo
├── shared/                # Código compartido
│   ├── mongoSchema.ts     # Esquemas MongoDB
│   └── schema.ts          # Esquemas PostgreSQL con Drizzle/Zod
├── scripts/               # Scripts de utilidad
└── docs/                  # Documentación adicional
```

## 🛠️ Desarrollo

- **Iniciar la aplicación**: `npm run dev`
- **Construir para producción**: `npm run build`
- **Iniciar servidor de producción**: `npm run start`
- **Actualizar esquema de base de datos**: `npm run db:push`

## 📚 Funcionalidades Principales

1. **Autenticación y Gestión de Usuarios**
   - Registro con verificación de correo electrónico
   - Inicio de sesión seguro
   - Restablecimiento de contraseña

2. **Gestión de Tareas y Calendario**
   - Creación y edición de tareas
   - Vista de calendario interactiva
   - Recordatorios y notificaciones

3. **Asistente IA**
   - Conversación natural
   - Sugerencias inteligentes
   - Análisis de productividad
   - Informes semanales generados por IA

4. **Panel de Estadísticas**
   - Seguimiento de productividad
   - Análisis de tiempo
   - Recomendaciones personalizadas

## 📝 Licencia

Este proyecto está licenciado bajo la Licencia MIT - consulta el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Contribuciones

¡Las contribuciones son bienvenidas! No dudes en enviar un Pull Request.

## 📞 Contacto

- Desarrollador: [Killgreck](https://github.com/Killgreck)
- Enlace del proyecto: [https://github.com/Killgreck/Agenda-ia](https://github.com/Killgreck/Agenda-ia)