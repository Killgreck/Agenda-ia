import { log } from './vite';
import { Event, User, ChatMessage } from './mongoModels';

// Sistema de asistente local sin dependencia de API externa (como solicitado por el usuario)
// Este sistema usa respuestas inteligentes predefinidas basadas en el contexto del usuario

log(`Modo asistente local activado: Usando respuestas predefinidas inteligentes`, 'gemini');

// Function to get user profile as text
export async function getUserProfileAsText(userId: number): Promise<string> {
  try {
    // Query user from the database
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      return "User profile information not available.";
    }
    
    // Format user profile as text
    let profileText = "User Profile:\n";
    
    if (user.name) {
      profileText += `Name: ${user.name}\n`;
    } else {
      profileText += `Username: ${user.username}\n`;
    }
    
    if (user.email) {
      profileText += `Email: ${user.email}\n`;
    }
    
    if (user.timezone) {
      profileText += `Timezone: ${user.timezone}\n`;
    }
    
    if (user.occupation) {
      profileText += `Occupation: ${user.occupation}\n`;
    }
    
    if (user.company) {
      profileText += `Company: ${user.company}\n`;
    }
    
    if (user.language) {
      profileText += `Preferred Language: ${user.language}\n`;
    }
    
    return profileText;
  } catch (error) {
    log(`Error getting user profile as text: ${error}`, 'error');
    return "User profile information not available.";
  }
}

// Function to get previous messages as text
export async function getPreviousMessagesAsText(userId: number, limit: number = 10): Promise<string> {
  try {
    // Query messages from the database
    const messages = await ChatMessage.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit);
    
    if (!messages || messages.length === 0) {
      return "No previous conversation history available.";
    }
    
    // Reverse the messages to get chronological order (oldest first)
    const chronologicalMessages = [...messages].reverse();
    
    // Format messages as text conversation
    let messagesText = "Previous Conversation:\n\n";
    
    chronologicalMessages.forEach((message) => {
      const sender = message.sender === 'user' ? 'User' : 'Assistant';
      messagesText += `${sender}: ${message.content}\n\n`;
    });
    
    return messagesText;
  } catch (error) {
    log(`Error getting previous messages as text: ${error}`, 'error');
    return "Previous conversation history not available.";
  }
}

// Function to get calendar events as text
export async function getCalendarEventsAsText(userId: number): Promise<string> {
  try {
    // Get current date
    const today = new Date();
    
    // Get next 7 days for the calendar view
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    // Query events from the database
    const events = await Event.find({ 
      userId,
      date: { $gte: today, $lte: nextWeek }
    }).sort({ date: 1 });
    
    if (!events || events.length === 0) {
      return "You don't have any upcoming events scheduled in your calendar for the next week.";
    }
    
    // Format events as text
    let eventsText = "Here are your upcoming events for the next 7 days:\n\n";
    
    events.forEach((event) => {
      const eventDate = new Date(event.date);
      const dayOfWeek = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
      const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      
      let timeInfo = '';
      if (event.isAllDay) {
        timeInfo = 'All Day';
      } else {
        const startTime = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        let endTime = 'Unspecified';
        
        if (event.endDate) {
          const endDate = new Date(event.endDate);
          endTime = endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        
        timeInfo = `${startTime} - ${endTime}`;
      }
      
      let location = event.location ? `Location: ${event.location}` : '';
      let priority = `Priority: ${event.priority || 'Normal'}`;
      
      eventsText += `- ${event.title} (${dayOfWeek}, ${formattedDate}, ${timeInfo})\n`;
      if (event.description) eventsText += `  Description: ${event.description}\n`;
      if (location) eventsText += `  ${location}\n`;
      eventsText += `  ${priority}\n`;
      eventsText += '\n';
    });
    
    return eventsText;
  } catch (error) {
    log(`Error getting calendar events as text: ${error}`, 'error');
    return "Sorry, there was an error retrieving your calendar events.";
  }
}

/**
 * Sistema local inteligente para interactuar con el usuario
 * Esta función proporciona respuestas inteligentes basadas en el contexto del usuario
 */
export async function callGeminiLLM(userMessage: string, userId: number = 1): Promise<string> {
  log('Procesando mensaje con sistema local: ' + userMessage, 'gemini');
  
  // Obtener información del usuario para personalizar respuestas
  let calendarInfo = "";
  let userInfo = "";
  
  try {
    calendarInfo = await getCalendarEventsAsText(userId);
    userInfo = await getUserProfileAsText(userId);
    log('Información de contexto obtenida correctamente', 'gemini');
  } catch (contextError) {
    log(`Error obteniendo contexto: ${contextError}`, 'error');
  }
  
  // Detectar idioma (detección simple para inglés vs español)
  const userMessageLower = userMessage.toLowerCase();
  const isSpanish = userMessageLower.includes('quiero') || 
                    userMessageLower.includes('agendar') || 
                    userMessageLower.includes('calendario') ||
                    userMessageLower.includes('lunes') ||
                    userMessageLower.includes('martes') || 
                    userMessageLower.includes('miércoles') || 
                    userMessageLower.includes('jueves') || 
                    userMessageLower.includes('viernes') ||
                    userMessageLower.includes('hola') ||
                    userMessageLower.includes('gracias');
  
  // Extraer nombre de usuario si está disponible
  const userName = userInfo && userInfo.includes('Name:') ? 
                   userInfo.split('Name:')[1].split('\n')[0].trim() : 
                   (userInfo && userInfo.includes('Username:') ? 
                   userInfo.split('Username:')[1].split('\n')[0].trim() : '');
  
  const greeting = userName ? 
    (isSpanish ? `¡Hola ${userName}!` : `Hello ${userName}!`) : 
    (isSpanish ? "¡Hola!" : "Hello!");
  
  // Sistema avanzado de reconocimiento de intenciones
  // 1. Consultas sobre calendario/eventos
  if (userMessageLower.includes('agenda') || userMessageLower.includes('schedule') || 
      userMessageLower.includes('calendar') || userMessageLower.includes('eventos') || 
      userMessageLower.includes('events') || userMessageLower.includes('citas') ||
      userMessageLower.includes('tengo') || userMessageLower.includes('hay algo')) {
    
    if (calendarInfo && calendarInfo !== "You don't have any upcoming events scheduled in your calendar for the next week.") {
      return isSpanish ? 
        `Aquí está tu agenda para los próximos días:\n\n${calendarInfo}\n\n¿Hay algo específico que te gustaría agregar a tu calendario?` : 
        `Here's your schedule for the upcoming days:\n\n${calendarInfo}\n\nIs there anything specific you'd like to add to your calendar?`;
    } else {
      return isSpanish ? 
        "Parece que no tienes eventos programados para la próxima semana. ¿Te gustaría que te ayude a crear un nuevo evento?" : 
        "It looks like you don't have any events scheduled for the next week. Would you like me to help you create a new event?";
    }
  } 
  
  // 2. Consultas sobre tareas/recordatorios
  else if (userMessageLower.includes('tarea') || userMessageLower.includes('task') || 
           userMessageLower.includes('recordatorio') || userMessageLower.includes('reminder') ||
           userMessageLower.includes('pendiente') || userMessageLower.includes('to-do')) {
    
    return isSpanish ? 
      "Puedo ayudarte a crear tareas y recordatorios. ¿Qué tarea necesitas agregar a tu lista? Por favor, proporciona un título, fecha límite y cualquier detalle importante." : 
      "I can help you create tasks and reminders. What task do you need to add to your list? Please provide a title, deadline, and any important details.";
  } 
  
  // 3. Saludos
  else if (userMessageLower.includes('hola') || userMessageLower.includes('hello') || 
           userMessageLower.includes('hi') || userMessageLower.includes('buenos días') ||
           userMessageLower.includes('buenas tardes') || userMessageLower.includes('buenas noches')) {
    
    return isSpanish ? 
      `${greeting} Soy tu asistente de calendario. Puedo ayudarte a administrar tu agenda, crear tareas y optimizar tu tiempo. ¿En qué puedo ayudarte hoy?` : 
      `${greeting} I'm your calendar assistant. I can help you manage your schedule, create tasks, and optimize your time. How can I assist you today?`;
  } 
  
  // 4. Agradecimientos
  else if (userMessageLower.includes('gracias') || userMessageLower.includes('thank')) {
    
    return isSpanish ? 
      "¡De nada! Estoy aquí para ayudarte con tu agenda y productividad. ¿Hay algo más en lo que pueda asistirte hoy?" : 
      "You're welcome! I'm here to help with your schedule and productivity. Is there anything else I can assist you with today?";
  }
  
  // 5. Preguntas sobre productividad
  else if (userMessageLower.includes('productividad') || userMessageLower.includes('productivity') ||
           userMessageLower.includes('eficiente') || userMessageLower.includes('efficient') ||
           userMessageLower.includes('organizar') || userMessageLower.includes('organize')) {
    
    return isSpanish ? 
      "Para mejorar tu productividad, te recomiendo dividir tus tareas grandes en pasos más pequeños y manejables. También es útil usar la técnica Pomodoro (25 minutos de trabajo, 5 de descanso) y reservar bloques específicos en tu calendario para tareas importantes. ¿Te gustaría que te ayude a programar algunos bloques de tiempo productivo?" : 
      "To improve your productivity, I recommend breaking down large tasks into smaller, manageable steps. It's also helpful to use the Pomodoro technique (25 minutes of work, 5 minutes break) and to reserve specific blocks in your calendar for important tasks. Would you like me to help you schedule some productivity time blocks?";
  }
  
  // 6. Preguntas sobre el asistente
  else if (userMessageLower.includes('puedes hacer') || userMessageLower.includes('can you do') ||
           userMessageLower.includes('funciones') || userMessageLower.includes('functions') ||
           userMessageLower.includes('capabilities') || userMessageLower.includes('capacidades')) {
    
    return isSpanish ? 
      "Como tu asistente de calendario y productividad, puedo:\n\n1. Mostrar y gestionar tu calendario\n2. Crear y recordar eventos\n3. Establecer recordatorios para tareas\n4. Sugerir horarios óptimos para reuniones\n5. Proporcionar consejos de productividad\n6. Ayudarte a priorizar tareas\n\n¿En cuál de estas áreas te gustaría que te ayude hoy?" : 
      "As your calendar and productivity assistant, I can:\n\n1. Display and manage your calendar\n2. Create and remind you of events\n3. Set reminders for tasks\n4. Suggest optimal times for meetings\n5. Provide productivity tips\n6. Help you prioritize tasks\n\nWhich of these areas would you like help with today?";
  }
  
  // 7. Preguntas sobre tiempo/fecha
  else if (userMessageLower.includes('hora') || userMessageLower.includes('time') ||
           userMessageLower.includes('fecha') || userMessageLower.includes('date') ||
           userMessageLower.includes('día') || userMessageLower.includes('day') ||
           userMessageLower.includes('mes') || userMessageLower.includes('month')) {
    
    const now = new Date();
    const formattedDate = now.toLocaleDateString(isSpanish ? 'es-ES' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString(isSpanish ? 'es-ES' : 'en-US');
    
    return isSpanish ? 
      `Hoy es ${formattedDate} y son las ${formattedTime}. ¿Necesitas programar algo para hoy?` : 
      `Today is ${formattedDate} and it's ${formattedTime}. Do you need to schedule anything for today?`;
  }
  
  // 8. Respuesta genérica para cualquier otra consulta
  else {
    return isSpanish ? 
      `${greeting} Soy tu asistente de calendario y productividad. Puedo ayudarte a ver tu agenda, crear eventos, establecer recordatorios y optimizar tu tiempo. ¿En qué te gustaría que te ayude hoy? Puedes preguntarme sobre tu calendario, tareas pendientes o consejos de productividad.` : 
      `${greeting} I'm your calendar and productivity assistant. I can help you view your schedule, create events, set reminders, and optimize your time. What would you like me to help you with today? You can ask me about your calendar, pending tasks, or productivity tips.`;
  }
}

/**
 * Generate task suggestions using local intelligence
 */
export async function generateTaskSuggestion(title: string, description?: string): Promise<string> {
  log(`Generando sugerencia de tarea para: "${title}"`, 'gemini');
  
  // Detect language (simple detection for Spanish keywords in title or description)
  const isSpanish = (title + (description || "")).toLowerCase().includes('reunión') || 
                    (title + (description || "")).toLowerCase().includes('cita') || 
                    (title + (description || "")).toLowerCase().includes('proyecto') ||
                    (title + (description || "")).toLowerCase().includes('tarea');
  
  if (isSpanish) {
    return `Para la tarea "${title}", te recomiendo:

1. Hora óptima: Programa esto para media mañana (10-11 AM), cuando la productividad suele ser mayor.
2. Desglose: Divide esta tarea en 3-4 subtareas más pequeñas para hacerla más manejable.
3. Recordatorios: Configura un recordatorio 30 minutos antes para prepararte adecuadamente.
4. Consejo: Reúne todos los materiales necesarios con anticipación y establece un límite de tiempo claro para mantener el enfoque.

¿Te gustaría que te ayude a programar esto en tu calendario?`;
  } else {
    return `For the task "${title}", I recommend:

1. Optimal timing: Schedule this for mid-morning (10-11 AM), when productivity tends to be higher.
2. Breakdown: Split this task into 3-4 smaller subtasks to make it more manageable.
3. Reminders: Set a reminder 30 minutes before to properly prepare.
4. Tip: Gather all necessary materials in advance and set a clear time limit to maintain focus.

Would you like me to help you schedule this in your calendar?`;
  }
}

/**
 * Generate a weekly report summary using local intelligence
 */
export async function generateWeeklyReportSummary(stats: any): Promise<string> {
  log('Generando resumen de reporte semanal con sistema local...', 'gemini');
  
  // If no tasks were completed, provide a motivational message
  if (!stats.tasksCompleted || stats.tasksCompleted === 0) {
    return `I'll be able to provide detailed weekly reports when my connection is restored. From what I can see, you've made progress on your tasks this week. Keep up the good work!`;
  }
  
  // Calculate completion rate
  const completionRate = stats.tasksTotal > 0 ? 
    Math.round((stats.tasksCompleted / stats.tasksTotal) * 100) : 0;
  
  return `Weekly Report Summary:

Tasks completed: ${stats.tasksCompleted} out of ${stats.tasksTotal} (${completionRate}% completion rate)
Average productivity: ${stats.avgProductivity || 0}/10
AI suggestions used: ${stats.aiSuggestionsAccepted || 0}/${stats.aiSuggestionsTotal || 0}

You're making good progress! Consider scheduling focused time blocks for next week to improve productivity further.`;
}