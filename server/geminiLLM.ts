import { log } from './vite';
import { Event, User, ChatMessage } from './mongoModels';
import { callGeminiDirectly } from './directGeminiCall';
import { getMockResponse, getMockWeeklyReport, getMockTaskSuggestion } from './mockAssistantResponses';

// La API key ya está definida en directGeminiCall.ts
// Mantenemos estos valores para compatibilidad con el código existente
const API_KEY = 'AIzaSyAJqi6JeOP58Ze46PRCJstujUz-4qrDl6s'; // API key gratuita proporcionada por el usuario
const MODEL_NAME = 'gemini-1.5-flash'; // Cambiado a un modelo disponible en la versión gratuita

// Log API key status (without revealing the actual key)
if (API_KEY) {
  log(`Gemini API Key status: Configured and active (direct implementation)`, 'gemini');
} else {
  log(`Gemini API Key status: Not configured or invalid. Using fallback responses.`, 'error');
}

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
 * Make a request to the Gemini API with a simple prompt format for the free version
 * Using direct axios call instead of the library to avoid version issues
 */
export async function callGeminiLLM(userMessage: string, userId: number = 1): Promise<string> {
  if (!API_KEY) {
    log('Error: Gemini API key is not configured. Using fallback responses.', 'error');
    return getDefaultResponse(userMessage);
  }

  try {
    // Debug
    log('Gemini API call starting with message: ' + userMessage, 'gemini');
    
    // Get calendar events as text to provide context
    const calendarEvents = await getCalendarEventsAsText(userId);
    log('Calendar events fetched successfully', 'gemini');
    
    // Get user profile as text to provide personalization
    const userProfile = await getUserProfileAsText(userId);
    log('User profile fetched successfully', 'gemini');
    
    // Get previous conversation messages for context
    const previousMessages = await getPreviousMessagesAsText(userId, 5);
    log('Previous messages fetched successfully', 'gemini');
    
    try {
      // Crear un prompt simple para la versión gratuita de la API
      const prompt = `Eres un asistente inteligente para una aplicación de calendario y productividad llamada "AI Calendar Assistant".

Información del usuario:
${userProfile}

Información del calendario:
${calendarEvents}

Conversación previa:
${previousMessages}

Responde de manera útil y amigable. Si el usuario pregunta en español, responde en español.

Mensaje del usuario: ${userMessage}

Tu respuesta:`;

      log('Preparando para enviar mensaje directo a Gemini API v1...', 'gemini');
      
      // Usar la implementación directa con axios para evitar problemas de versión
      const respuesta = await callGeminiDirectly(prompt);
      
      log('Gemini API respondió exitosamente con llamada directa', 'gemini');
      return respuesta;
      
    } catch (error) {
      log(`Error en llamada directa a Gemini API: ${error}`, 'error');
      throw error;
    }
  } catch (error) {
    log(`Error generando respuesta: ${error}`, 'error');
    return getDefaultResponse(userMessage);
  }
}

/**
 * Get a default response when API is not available
 */
function getDefaultResponse(userMessage: string): string {
  // Detect language (simple detection for English vs Spanish)
  const userMessageLower = userMessage.toLowerCase();
  const isSpanish = userMessageLower.includes('quiero') || 
                userMessageLower.includes('agendar') || 
                userMessageLower.includes('calendario') ||
                userMessageLower.includes('lunes') ||
                userMessageLower.includes('martes') || 
                userMessageLower.includes('miércoles') || 
                userMessageLower.includes('jueves') || 
                userMessageLower.includes('viernes');
                
  if (userMessageLower.includes('ayuda') || userMessageLower.includes('help')) {
    return isSpanish ? 
      "Puedo ayudarte con la gestión de tu calendario, la programación de eventos, la optimización de tareas y proporcionar consejos de productividad. Solo pregúntame lo que necesites." : 
      "I can help you with calendar management, event scheduling, task optimization, and productivity tips. Just ask me what you need.";
  } else if (userMessageLower.includes('calendario') || userMessageLower.includes('calendar') || 
            userMessageLower.includes('eventos') || userMessageLower.includes('events')) {
    return isSpanish ? 
      "Puedo ayudarte a gestionar tu calendario y eventos. ¿Te gustaría ver tus próximos eventos, crear uno nuevo o encontrar un buen momento para programar algo?" : 
      "I can help you manage your calendar and events. Would you like to see your upcoming events, create a new one, or find a good time to schedule something?";
  } else if (userMessageLower.includes('tarea') || userMessageLower.includes('task') || 
            userMessageLower.includes('productividad') || userMessageLower.includes('productivity')) {
    return isSpanish ? 
      "Puedo ayudarte a gestionar tus tareas y mejorar tu productividad. ¿Quieres crear una nueva tarea, revisar las existentes o recibir consejos para optimizar tu tiempo?" : 
      "I can help you manage your tasks and improve your productivity. Would you like to create a new task, review existing ones, or get tips to optimize your time?";
  } else {
    return isSpanish ? 
      "Soy tu asistente de calendario y productividad. Puedo ayudarte a programar eventos, crear tareas, y optimizar tu tiempo. ¿En qué te gustaría que te ayude hoy?" : 
      "I'm your calendar and productivity assistant. I can help you schedule events, create tasks, and optimize your time. What would you like me to help you with today?";
  }
}

/**
 * Generate task suggestions using Gemini with simplified approach for free API
 */
export async function generateTaskSuggestion(title: string, description?: string): Promise<string> {
  log(`Generando sugerencia de tarea para: "${title}" usando Gemini API`, 'gemini');
  
  try {
    // Prepare the prompt for task suggestion
    const prompt = `Generate a helpful suggestion for optimizing this task:
    
    Task Title: ${title}
    ${description ? `Task Description: ${description}` : ''}
    
    Provide a specific suggestion that includes:
    1. The best time to schedule this based on typical productivity patterns
    2. How to break it down if it's complex
    3. A recommendation for setting reminders
    4. A tip for successful completion
    
    Keep your response under 150 words.`;
    
    log('Preparing to send task suggestion request to Gemini...', 'gemini');
    
    // Usar la implementación directa con axios para evitar problemas de versión
    // Indicar que es una sugerencia de tarea para el fallback adecuado
    const respuesta = await callGeminiDirectly(prompt, true);
    
    log('Gemini API responded successfully with task suggestion', 'gemini');
    return respuesta;
  } catch (error) {
    log(`Error generating task suggestion with Gemini: ${error}`, 'error');
    
    // Usar la función de respuestas simuladas para tareas
    return getMockTaskSuggestion(title, description);
  }
}

/**
 * Generate a weekly report summary using Gemini with simplified approach for free API
 */
export async function generateWeeklyReportSummary(stats: any): Promise<string> {
  log('Generating weekly report summary...', 'gemini');
  
  try {
    // Prepare the prompt for weekly report
    const prompt = `Generate a motivational and informative weekly productivity report based on these statistics:
    
    Tasks completed: ${stats.tasksCompleted || 0} out of ${stats.tasksTotal || 0} total tasks
    Average productivity score: ${stats.avgProductivity || 0} out of 10
    AI suggestions accepted: ${stats.aiSuggestionsAccepted || 0} out of ${stats.aiSuggestionsTotal || 0} suggested
    
    Structure the report as:
    1. A friendly greeting
    2. A summary of this week's performance
    3. 2-3 specific suggestions for improving productivity next week
    
    Keep the tone encouraging even if the stats are low. Limit to 150 words maximum.`;
    
    log('Preparing to send weekly report request to Gemini...', 'gemini');
    
    // Usar la implementación directa con axios para evitar problemas de versión
    // Pasar el flag de que es un informe semanal y las estadísticas para fallback
    const respuesta = await callGeminiDirectly(prompt, false, true, stats);
    
    log('Gemini API responded successfully with weekly report', 'gemini');
    return respuesta;
  } catch (error) {
    log(`Error generating weekly report with Gemini: ${error}`, 'error');
    
    // Usar la respuesta simulada en caso de error
    return getMockWeeklyReport(stats);
  }
}