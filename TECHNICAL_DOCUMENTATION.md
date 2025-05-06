# Documentación Técnica de Agenda-IA

## Descripción General

Agenda-IA es una plataforma inteligente de productividad que aprovecha tecnologías avanzadas de IA para transformar la gestión de tareas a través de estrategias innovadoras de participación del usuario. La aplicación está construida con una arquitectura moderna de aplicación web, utilizando TypeScript, Node.js, MongoDB y PostgreSQL para proporcionar una experiencia de usuario fluida y enriquecida con capacidades de IA.

## Arquitectura

La aplicación sigue una arquitectura cliente-servidor:

- **Frontend**: Aplicación React con TypeScript, utilizando bibliotecas modernas como TanStack Query, Wouter y Shadcn UI
- **Backend**: Servidor Express.js con TypeScript
- **Bases de datos**:
  - PostgreSQL con Drizzle ORM para datos estructurados
  - MongoDB para datos no estructurales como mensajes de chat y preferencias de IA
- **Comunicación en tiempo real**: WebSockets para notificaciones y actualizaciones en tiempo real
- **Integración de IA**: API Gemini de Google para capacidades conversacionales

## Estructura del Proyecto

```
├── client/                  # Código del frontend
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── hooks/           # Hooks personalizados
│   │   ├── lib/             # Funciones utilitarias
│   │   ├── pages/           # Páginas/rutas
│   │   ├── types/           # Definiciones de tipos
│   │   └── utils/           # Funciones auxiliares
│   └── index.html           # HTML principal
├── server/                  # Código del backend
│   ├── abacusLLM.ts         # Integración con API de Abacus LLM (alternativa)
│   ├── db.ts                # Conexión a PostgreSQL con Drizzle
│   ├── email.ts             # Funcionalidad de envío de correos con SendGrid
│   ├── geminiLLM.ts         # Integración con API de Gemini de Google
│   ├── index.ts             # Punto de entrada del servidor
│   ├── mongoModels.ts       # Modelos para MongoDB
│   ├── mongoStorage.ts      # Implementación de almacenamiento con MongoDB
│   ├── mongodb.ts           # Configuración y conexión a MongoDB
│   ├── routes.ts            # Definición de rutas API
│   ├── storage.ts           # Interfaz de almacenamiento genérica
│   └── vite.ts              # Configuración de Vite para desarrollo
├── shared/                  # Código compartido entre cliente y servidor
│   ├── mongoSchema.ts       # Esquemas para MongoDB
│   └── schema.ts            # Esquemas para PostgreSQL con Drizzle/Zod
└── scripts/                 # Scripts de utilidad
```

## Modelos de Datos

### PostgreSQL (Drizzle ORM)

Los modelos principales incluyen:

- `User`: Información del usuario
- `Task`: Tareas y eventos
- `CheckIn`: Registros de actividad
- `Notification`: Notificaciones de sistema

### MongoDB

Los modelos principales incluyen:

- `User`: Información extendida del usuario
- `UserSettings`: Preferencias de usuario
- `AiPreferences`: Configuración de AI
- `Event`: Eventos de calendario
- `ChatMessage`: Mensajes del asistente de IA
- `Analytics`: Datos de análisis de productividad

## APIs

### Autenticación

- `POST /api/auth/signup`: Registro de nuevo usuario
- `POST /api/auth/login`: Inicio de sesión
- `POST /api/auth/logout`: Cierre de sesión
- `GET /api/auth/verify-email/:token`: Verificación de email
- `POST /api/auth/forgot-password`: Solicitud de restablecimiento de contraseña
- `POST /api/auth/reset-password`: Restablecimiento de contraseña
- `GET /api/auth/status`: Estado de autenticación actual

### Perfil de Usuario

- `PATCH /api/user/profile`: Actualización de perfil

### Tareas y Eventos

- `POST /api/tasks`: Crear tarea/evento
- `GET /api/tasks`: Obtener tareas/eventos
- `GET /api/tasks/:id`: Obtener tarea/evento específico
- `PATCH /api/tasks/:id`: Actualizar tarea/evento
- `DELETE /api/tasks/:id`: Eliminar tarea/evento

### Asistente IA

- `POST /api/chat-messages`: Enviar mensaje al asistente
- `GET /api/chat-messages`: Obtener historial de mensajes
- `POST /api/ai-suggestions/generate`: Generar sugerencias de IA
- `PATCH /api/ai-suggestions/:id`: Actualizar estado de sugerencia

### Estadísticas y Análisis

- `GET /api/statistics`: Obtener estadísticas generales
- `GET /api/statistics/week`: Obtener estadísticas semanales
- `POST /api/generate-weekly-report`: Generar informe semanal basado en IA

### Notificaciones

- `GET /api/notifications`: Obtener notificaciones
- `GET /api/notifications/count`: Obtener número de notificaciones no leídas
- `PATCH /api/notifications/:id/read`: Marcar notificación como leída
- `PATCH /api/notifications/:id/dismiss`: Descartar notificación
- `POST /api/notifications/read-all`: Marcar todas las notificaciones como leídas

## Integración de IA

### Gemini API

La integración con la API de Gemini (Google) permite:

1. **Asistente Conversacional**: Procesa mensajes de usuario y genera respuestas contextuales
2. **Análisis de Productividad**: Genera informes semanales basados en datos de uso
3. **Sugerencias de Tareas**: Propone tareas basadas en actividad y preferencias

#### Implementación en `geminiLLM.ts`

```typescript
// Funciones principales:
getUserProfileAsText() - Convierte perfil de usuario a contexto textual
getPreviousMessagesAsText() - Recupera historial de conversación
getCalendarEventsAsText() - Obtiene información de calendario
callGeminiLLM() - Realiza solicitud a la API de Gemini
generateTaskSuggestion() - Genera sugerencias de tareas
generateWeeklyReportSummary() - Crea resúmenes de actividad semanal
```

## Envío de Correos Electrónicos

La funcionalidad de correo electrónico utiliza SendGrid para:

1. Verificación de correo electrónico para nuevos usuarios
2. Restablecimiento de contraseña
3. Notificaciones de sistema

### Implementación en `email.ts`

```typescript
// Funciones principales:
sendEmail() - Envía emails a través de SendGrid API
generateSecureToken() - Crea tokens seguros para verificación/restablecimiento
getVerificationEmailTemplate() - Plantilla HTML para emails de verificación
getPasswordResetEmailTemplate() - Plantilla HTML para emails de restablecimiento
```

## Configuración de Base de Datos

### PostgreSQL con Drizzle ORM

Configurado en `db.ts` para almacenar datos estructurados como usuarios y tareas.

### MongoDB (en memoria o remoto)

Configurado en `mongodb.ts` para almacenar datos no estructurados como mensajes de chat e información de contexto para IA.

Características:
- Mecanismo de reconexión automática
- Reintentos configurables
- Manejo de errores robusto

## Seguridad

- **Autenticación**: Sistema de sesiones con Express
- **Contraseñas**: Almacenamiento con hash seguro usando scrypt
- **Verificación de Email**: Proceso de doble opt-in para nuevos registros
- **Protección de Rutas**: Middleware de autenticación para rutas protegidas
- **Restablecimiento de Contraseña**: Flujo seguro con tokens de tiempo limitado

## WebSockets

Implementación para comunicación en tiempo real:
- Notificaciones push
- Actualizaciones del estado de tareas
- Mensajería instantánea con el asistente de IA

## Manejo de Errores

- Logging detallado para depuración
- Respuestas de error estructuradas para el cliente
- Reintentos para operaciones de red críticas
- Alternativas de fallback para servicios externos

## Variables de Entorno Requeridas

- `DATABASE_URL`: URL de conexión a PostgreSQL
- `MONGODB_URI` (opcional): URL de conexión a MongoDB remoto
- `SESSION_SECRET`: Secreto para firmar cookies de sesión
- `SENDGRID_API_KEY`: Clave API de SendGrid para envío de emails
- `SENDGRID_VERIFIED_SENDER`: Email verificado como remitente en SendGrid
- `GEMINI_API_KEY`: Clave API de Gemini para funcionalidad de IA

## Flujos de Desarrollo

### Instalación

```bash
# Instalar dependencias
npm install

# Configurar base de datos
npm run db:push
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev
```

### Migración de Base de Datos

```bash
# Actualizar esquema de base de datos
npm run db:push
```