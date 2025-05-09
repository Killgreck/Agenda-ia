import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { log } from './vite';
import { Event, User, ChatMessage } from './mongoModels';

// Initialize the Google Generative AI with the API key directly as requested by the user
const API_KEY = 'AIzaSyD2IlrOxYhMs6aP9DwuDQph1ra8HAAhB3s'; // API key gratuita proporcionada por el usuario
// Para la versión gratuita de Gemini se usa "gemini-pro" (no gemini-1.5-pro o flash)
const MODEL_NAME = 'gemini-pro';
const FALLBACK_MODEL = 'gemini-pro';

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
 * Make a request to the Gemini API
 */
export async function callGeminiLLM(userMessage: string, userId: number = 1): Promise<string> {
  if (!API_KEY) {
    log('Error: Gemini API key is not configured. Using fallback responses.', 'error');
    
    // Get information about the user's context
    let calendarInfo = "";
    let userInfo = "";
    
    try {
      calendarInfo = await getCalendarEventsAsText(userId);
      userInfo = await getUserProfileAsText(userId);
    } catch (contextError) {
      log(`Error getting context for fallback response: ${contextError}`, 'error');
    }
    
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
                      
    // Create a more intelligent fallback response based on the user's message
    if (userMessageLower.includes('agenda') || userMessageLower.includes('schedule') || 
        userMessageLower.includes('calendar') || userMessageLower.includes('eventos') || 
        userMessageLower.includes('events')) {
      
      if (calendarInfo && calendarInfo !== "You don't have any upcoming events scheduled in your calendar for the next week.") {
        return isSpanish ? 
          `Aquí está tu agenda para los próximos días:\n\n${calendarInfo}\n\n¿Hay algo específico que te gustaría agregar a tu calendario?` : 
          `Here's your schedule for the upcoming days:\n\n${calendarInfo}\n\nIs there anything specific you'd like to add to your calendar?`;
      } else {
        return isSpanish ? 
          "Parece que no tienes eventos programados para la próxima semana. ¿Te gustaría que te ayude a crear un nuevo evento?" : 
          "It looks like you don't have any events scheduled for the next week. Would you like me to help you create a new event?";
      }
    } else if (userMessageLower.includes('tarea') || userMessageLower.includes('task') || 
               userMessageLower.includes('recordatorio') || userMessageLower.includes('reminder')) {
      
      return isSpanish ? 
        "Puedo ayudarte a crear tareas y recordatorios. ¿Qué tarea necesitas agregar a tu lista? Por favor, proporciona un título, fecha límite y cualquier detalle importante." : 
        "I can help you create tasks and reminders. What task do you need to add to your list? Please provide a title, deadline, and any important details.";
    } else if (userMessageLower.includes('hola') || userMessageLower.includes('hello') || 
               userMessageLower.includes('hi') || userMessageLower.includes('buenos días') ||
               userMessageLower.includes('buenas tardes') || userMessageLower.includes('buenas noches')) {
      
      const userName = userInfo && userInfo.includes('Name:') ? 
                       userInfo.split('Name:')[1].split('\n')[0].trim() : 
                       (userInfo && userInfo.includes('Username:') ? 
                       userInfo.split('Username:')[1].split('\n')[0].trim() : '');
      
      const greeting = userName ? 
        (isSpanish ? `¡Hola ${userName}!` : `Hello ${userName}!`) : 
        (isSpanish ? "¡Hola!" : "Hello!");
      
      return isSpanish ? 
        `${greeting} Soy tu asistente de calendario. Puedo ayudarte a administrar tu agenda, crear tareas y optimizar tu tiempo. ¿En qué puedo ayudarte hoy?` : 
        `${greeting} I'm your calendar assistant. I can help you manage your schedule, create tasks, and optimize your time. How can I assist you today?`;
    } else if (userMessageLower.includes('gracias') || userMessageLower.includes('thank')) {
      
      return isSpanish ? 
        "¡De nada! Estoy aquí para ayudarte con tu agenda y productividad. ¿Hay algo más en lo que pueda asistirte hoy?" : 
        "You're welcome! I'm here to help with your schedule and productivity. Is there anything else I can assist you with today?";
    } else {
      // Generic response
      return isSpanish ? 
        "Soy tu asistente de calendario y productividad. Puedo ayudarte a programar eventos, crear tareas, y optimizar tu tiempo. ¿En qué te gustaría que te ayude hoy?" : 
        "I'm your calendar and productivity assistant. I can help you schedule events, create tasks, and optimize your time. What would you like me to help you with today?";
    }
  }

  try {
    // Debug
    log('Gemini API call starting with message: ' + userMessage, 'gemini');
    log('Using Model: ' + MODEL_NAME, 'gemini');
    
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
      // Initialize the Gemini API
      log('Initializing Gemini API...', 'gemini');
      const genAI = new GoogleGenerativeAI(API_KEY);
      log('Getting generative model...', 'gemini');
      
      // Try to use the main model, but have a fallback ready
      let currentModel = MODEL_NAME;
      let model = genAI.getGenerativeModel({ model: currentModel });
      log(`Gemini model initialized successfully: ${currentModel}`, 'gemini');
      
      // Set safety settings
      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ];
      
      // System message to provide context to the LLM
      const systemMessage = `You are an intelligent AI assistant for a calendar and task management application called 'AI Calendar Assistant'.
      
      Your primary roles are:
      1. Act as a COACH and FRIEND to the user, providing encouragement and guidance
      2. You are GREAT at SCHEDULING APPOINTMENTS because you're the BEST at MANAGING TIME
      3. ALWAYS PROACTIVELY SUGGEST SPECIFIC SCHEDULES based on the user's calendar and the task requirements
      4. ALWAYS CHECK FOR DETAILS and specifically ask for missing information when scheduling
      5. ALWAYS ANALYZE CALENDAR EVENTS to find optimal time slots for new events
      
      IMPORTANT - You MUST DECIDE on suggesting specific schedules based on the calendar events. 
      Do not wait for the user to ask - be proactive and recommend times.
      
      When discussing scheduling, ALWAYS ASK FOR THESE SPECIFIC DETAILS (matching the form fields):
      - Title: What should the event be called?
      - Date: What day is this scheduled for?
      - Time: What time does it start? (skip if all-day event)
      - End time: When does it end? (skip if all-day event)
      - Is this an all-day event?
      - Location: Where will this take place?
      - Description: Any additional details?
      - Priority: Is this high, medium, or low priority?
      - Is this a recurring event? If so:
        - Recurrence type: Daily or weekly?
        - Which days of the week? (for weekly recurrence)
        - Should we skip holidays?
      - Reminder: How many minutes before should you be reminded?
      
      // User Profile Information
      ${userProfile}
      
      // Previous Conversation History
      ${previousMessages}
      
      // Calendar Information
      ${calendarEvents}
      
      The user is currently accessing the AI assistant feature of the application. Be helpful, friendly, and proactive in suggesting improvements to their schedule. 
      
      IMPORTANT GUIDELINES:
      1. Address the user by their name if available
      2. Refer to previous conversations when relevant
      3. ALWAYS suggest specific available time slots based on the existing calendar
      4. Be aware of the user's timezone and language preferences if provided
      5. Be concise but helpful - don't be overly verbose`;

      // Generate content
      // Gemini doesn't support 'system' role, so we combine system message with user message
      const combinedPrompt = `${systemMessage}\n\nUser: ${userMessage}`;
      log('Preparing to send message to Gemini...', 'gemini');
      
      try {
        let result;
        try {
          // First attempt with primary model
          result = await model.generateContent({
            contents: [
              { role: 'user', parts: [{ text: combinedPrompt }] }
            ],
            safetySettings,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800,
            }
          });
        } catch (primaryModelError) {
          // If primary model fails, try fallback model
          log(`Primary model ${currentModel} failed: ${primaryModelError}. Trying fallback model ${FALLBACK_MODEL}...`, 'error');
          currentModel = FALLBACK_MODEL;
          model = genAI.getGenerativeModel({ model: currentModel });
          
          // Try again with fallback model
          result = await model.generateContent({
            contents: [
              { role: 'user', parts: [{ text: combinedPrompt }] }
            ],
            safetySettings,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800,
            }
          });
          log(`Fallback model ${FALLBACK_MODEL} succeeded`, 'gemini');
        }
        
        if (!result || !result.response) {
          log('Gemini API returned empty response', 'error');
          throw new Error('Empty response from Gemini API');
        }
        
        log(`Gemini API (${currentModel}) responded successfully`, 'gemini');
        const response = result.response;
        return response.text();
      } catch (apiError) {
        log(`Error in Gemini API call with both models: ${apiError}`, 'error');
        throw apiError; // Re-throw to be caught by the outer catch block
      }
    } catch (initError) {
      log(`Error initializing Gemini model: ${initError}`, 'error');
      throw initError; // Re-throw to be caught by the outer catch block
    }
  } catch (error) {
    log(`Error calling Gemini API: ${error}`, 'error');
    
    // Create a more contextual response based on the user's message
    const userMessageLower = userMessage.toLowerCase();
    
    // Detect language (simple detection for English vs Spanish)
    const isSpanish = userMessageLower.includes('quiero') || 
                      userMessageLower.includes('agendar') || 
                      userMessageLower.includes('calendario') ||
                      userMessageLower.includes('lunes') ||
                      userMessageLower.includes('martes') || 
                      userMessageLower.includes('miércoles') || 
                      userMessageLower.includes('jueves') || 
                      userMessageLower.includes('viernes');
    
    // Provide a helpful fallback response
    return isSpanish ? 
      "Lo siento, estoy teniendo problemas para conectarme a mi base de conocimiento en este momento. ¿Hay algo específico sobre tu calendario o tareas que pueda ayudarte con mientras tanto?" : 
      "I'm sorry, I'm having trouble connecting to my knowledge base at the moment. Is there something specific about your calendar or tasks I can help you with in the meantime?";
  }
}

/**
 * Generate task suggestions using Gemini
 */
export async function generateTaskSuggestion(title: string, description?: string): Promise<string> {
  log(`Generando sugerencia de tarea para: "${title}" usando Gemini API`, 'gemini');
  log('Using Model: ' + MODEL_NAME, 'gemini');
  
  try {
    // Initialize the Gemini API
    log('Initializing Gemini API for task suggestion...', 'gemini');
    const genAI = new GoogleGenerativeAI(API_KEY);
    log('Getting generative model...', 'gemini');
    
    // Use the model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    log(`Gemini model initialized successfully: ${MODEL_NAME}`, 'gemini');
    
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
    
    // Generate content
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 250,
      }
    });
    
    if (!result || !result.response) {
      log('Gemini API returned empty response for task suggestion', 'error');
      throw new Error('Empty response from Gemini API');
    }
    
    log('Gemini API responded successfully with task suggestion', 'gemini');
    const response = result.response;
    return response.text();
  } catch (error) {
    log(`Error generating task suggestion with Gemini: ${error}`, 'error');
    
    // Detect language (simple detection for Spanish keywords in title or description)
    const isSpanish = (title + (description || "")).toLowerCase().includes('reunión') || 
                      (title + (description || "")).toLowerCase().includes('cita') || 
                      (title + (description || "")).toLowerCase().includes('proyecto');
    
    if (isSpanish) {
      return `Para optimizar esta tarea, te recomiendo:

1. Programarla en la mañana cuando tu energía es probablemente mayor
2. Dividirla en pasos más pequeños si es compleja
3. Configurar un recordatorio una hora antes para prepararte
4. Establecer un límite de tiempo específico para mantener el enfoque

¿Te gustaría que agregue esto a tu calendario?`;
    } else {
      return `To optimize this task, I recommend:

1. Schedule it in the morning when your energy is likely higher
2. Break it down into smaller steps if it's complex
3. Set a reminder one hour before to prepare
4. Establish a specific time limit to maintain focus

Would you like me to add this to your calendar?`;
    }
  }
}

/**
 * Generate a weekly report summary using Gemini
 */
export async function generateWeeklyReportSummary(stats: any): Promise<string> {
  log('Generating weekly report summary...', 'gemini');
  log('Using Model: ' + MODEL_NAME, 'gemini');
  
  try {
    // Initialize the Gemini API
    log('Initializing Gemini API for weekly report...', 'gemini');
    const genAI = new GoogleGenerativeAI(API_KEY);
    log('Getting generative model...', 'gemini');
    
    // Use the model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    log(`Gemini model initialized successfully: ${MODEL_NAME}`, 'gemini');
    
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
    
    // Generate content
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
      }
    });
    
    if (!result || !result.response) {
      log('Gemini API returned empty response for weekly report', 'error');
      throw new Error('Empty response from Gemini API');
    }
    
    log('Gemini API responded successfully with weekly report', 'gemini');
    const response = result.response;
    return response.text();
  } catch (error) {
    log(`Error generating weekly report with Gemini: ${error}`, 'error');
    
    return `Weekly Report Summary:

Tasks completed: ${stats.tasksCompleted || 0} out of ${stats.tasksTotal || 0}
Average productivity: ${stats.avgProductivity || 0}/10
AI suggestions used: ${stats.aiSuggestionsAccepted || 0}/${stats.aiSuggestionsTotal || 0}

Remember to schedule focused time blocks next week to improve overall productivity.`;
  }
}