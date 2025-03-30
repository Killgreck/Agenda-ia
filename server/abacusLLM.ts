import axios from 'axios';

// Abacus LLM API integration
const API_KEY = process.env.ABACUS_API_KEY;
const API_URL = 'https://api.abacus.ai/api/v1/project/deployed-model/predict';

interface AbacusRequest {
  apiKey: string;
  modelId: string;
  deployment: string;
  inputs: {
    prompt: string;
    temperature?: number;
    max_tokens?: number;
    system?: string;
  }
}

interface AbacusResponse {
  prediction: {
    text: string;
  };
  status: string;
}

/**
 * Make a request to the Abacus LLM API
 */
export async function callAbacusLLM(userMessage: string): Promise<string> {
  if (!API_KEY) {
    throw new Error('Abacus API key is not configured');
  }

  try {
    // Debug
    console.log('Abacus LLM API call starting with message:', userMessage);
    console.log('API URL:', API_URL);
    console.log('API key exists:', !!API_KEY);

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
    
    Here are the user's current calendar events:
    - Team Meeting (Monday, 10:00 AM - 11:30 AM)
    - Doctor Appointment (Tuesday, 2:00 PM - 3:00 PM)
    - Project Deadline (Friday, All Day)
    - Weekly Review (Friday, 4:00 PM - 5:00 PM)
    - Lunch with Alex (Wednesday, 12:30 PM - 1:30 PM)
    
    The user is currently accessing the AI assistant feature of the application. Be helpful, friendly, and proactive in suggesting improvements to their schedule. ALWAYS suggest specific available time slots based on the existing calendar.`;

    const requestData: AbacusRequest = {
      apiKey: API_KEY,
      modelId: 'llama-3-8b-chat',
      deployment: 'default',
      inputs: {
        prompt: userMessage,
        temperature: 0.7,
        max_tokens: 500,
        system: systemMessage
      }
    };

    console.log('Making request to Abacus LLM API with data:', JSON.stringify(requestData));

    const response = await axios.post(API_URL, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      console.log('Abacus LLM API response:', JSON.stringify(response.data));
      return response.data.prediction.text as string;
    } else {
      console.error('Abacus LLM API error:', response.data);
      throw new Error(`API returned status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error calling Abacus LLM API:', error);
    
    if (axios.isAxiosError(error)) {
      console.error('Response data:', JSON.stringify(error.response?.data || 'No response data'));
      console.error('Status code:', error.response?.status || 'No status code');
      console.error('Request config:', JSON.stringify(error.config || 'No config available'));
      
      // If we got a response but it's an error status, log the specifics
      if (error.response) {
        console.error('Error details:', JSON.stringify({
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data
        }));
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from Abacus API. Request details:', JSON.stringify(error.request));
      } else {
        // Something happened in setting up the request
        console.error('Error setting up the request:', error.message);
      }
    } else {
      // Non-Axios error
      console.error('Non-axios error details:', JSON.stringify(error));
    }
    
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
    
    // Message about scheduling or creating events
    if (userMessageLower.includes('schedule') || userMessageLower.includes('calendar') || 
        userMessageLower.includes('event') || userMessageLower.includes('appointment') ||
        userMessageLower.includes('add to my') || userMessageLower.includes('create') ||
        userMessageLower.includes('agendar') || userMessageLower.includes('calendario') ||
        userMessageLower.includes('agregar') || userMessageLower.includes('crear')) {
      
      if (isSpanish) {
        return "¡Con gusto te ayudo a agendar eso! Analizando tu calendario actual, veo que tienes espacios disponibles el martes entre 9:00 AM y 1:00 PM, o el jueves después de las 3:00 PM. Necesito los siguientes detalles para agendar correctamente:\n\n- Título: ¿Cómo debería llamarse este evento?\n- Fecha: ¿Qué día prefieres? (¿martes o jueves?)\n- Hora: ¿A qué hora empieza?\n- Hora de finalización: ¿Cuándo termina?\n- Ubicación: ¿Dónde tendrá lugar?\n- Descripción: ¿Algún detalle adicional?\n- Prioridad: ¿Es de alta, media o baja prioridad?\n- ¿Es un evento recurrente? Si es así, ¿diario o semanal?";
      } else {
        return "I'd be happy to help you schedule that! Looking at your current calendar, I see you have availability on Tuesday between 9:00 AM and 1:00 PM, or Thursday after 3:00 PM. I need the following details to properly schedule this:\n\n- Title: What should this event be called?\n- Date: Which day do you prefer? (Tuesday or Thursday?)\n- Time: What time does it start?\n- End time: When does it end?\n- Location: Where will this take place?\n- Description: Any additional details?\n- Priority: Is this high, medium, or low priority?\n- Is this a recurring event? If so, daily or weekly?";
      }
    }
    
    // Message about productivity or time management
    else if (userMessageLower.includes('productivity') || userMessageLower.includes('efficient') || 
             userMessageLower.includes('focus') || userMessageLower.includes('manage time') ||
             userMessageLower.includes('distracted') || userMessageLower.includes('productividad') ||
             userMessageLower.includes('eficiente') || userMessageLower.includes('concentración')) {
      
      if (isSpanish) {
        return "¡Gran pregunta sobre productividad! Revisando tu calendario, veo que tienes espacios disponibles el martes por la mañana y el jueves por la tarde. Te sugiero programar sesiones de enfoque de 90-120 minutos en estos horarios:\n\n- Martes: 9:00 AM - 11:00 AM: Sesión de enfoque de alta prioridad\n- Jueves: 3:00 PM - 5:00 PM: Sesión de enfoque para tareas creativas\n\n¿Te gustaría que agregue estas sesiones a tu calendario? Necesitaría los siguientes detalles:\n- Título: ¿Cómo quieres nombrar estas sesiones?\n- Descripción: ¿En qué proyectos trabajarás?\n- Prioridad: ¿Alta, media o baja?\n- ¿Quieres configurarlas como eventos recurrentes semanales?";
      } else {
        return "Great question about productivity! Looking at your calendar, I see you have availability Tuesday morning and Thursday afternoon. I suggest scheduling 90-120 minute focus sessions during these times:\n\n- Tuesday: 9:00 AM - 11:00 AM: High-priority focus session\n- Thursday: 3:00 PM - 5:00 PM: Creative tasks focus session\n\nWould you like me to add these to your calendar? I'd need the following details:\n- Title: What would you like to call these sessions?\n- Description: What projects will you work on?\n- Priority: High, medium, or low?\n- Would you like to set these up as weekly recurring events?";
      }
    }
    
    // Message about task reminders or deadlines
    else if (userMessageLower.includes('remind') || userMessageLower.includes('forget') || 
             userMessageLower.includes('deadline') || userMessageLower.includes('due date') ||
             userMessageLower.includes('recordar') || userMessageLower.includes('olvidar') ||
             userMessageLower.includes('fecha límite') || userMessageLower.includes('vencimiento')) {
      
      if (isSpanish) {
        return "¡Puedo ayudarte a configurar recordatorios para tus eventos importantes! Analizando tu calendario, veo que tienes el 'Plazo del Proyecto' este viernes. Te sugiero configurar recordatorios el martes (3 días antes) y el jueves (1 día antes) para prepararte. Necesito los siguientes detalles:\n\n- Título: ¿Para qué evento necesitas recordatorios?\n- Fecha principal: ¿Cuándo es la fecha límite o evento?\n- Recordatorios: ¿Cuántos minutos o días antes (15 min, 1 día, 3 días)?\n- Prioridad: ¿Alta, media o baja?\n- Descripción: ¿Algún detalle específico que deba incluir en el recordatorio?";
      } else {
        return "I can help you set up reminders for your important events! Looking at your calendar, I see you have a 'Project Deadline' this Friday. I suggest setting up reminders for Tuesday (3 days before) and Thursday (1 day before) to help you prepare. I need the following details:\n\n- Title: What event do you need reminders for?\n- Main date: When is the deadline or event?\n- Reminders: How many minutes or days before (15 min, 1 day, 3 days)?\n- Priority: High, medium, or low?\n- Description: Any specific details to include in the reminder?";
      }
    }
    
    // Message about recommendations
    else if (userMessageLower.includes('recommend') || userMessageLower.includes('suggest') || 
             userMessageLower.includes('advice') || userMessageLower.includes('should i') ||
             userMessageLower.includes('recomienda') || userMessageLower.includes('sugiere') ||
             userMessageLower.includes('consejo') || userMessageLower.includes('debería')) {
      
      if (isSpanish) {
        return "¡Me encantaría darte recomendaciones para optimizar tu calendario! Observo que tienes varias reuniones programadas esta semana. Te sugiero crear bloques de tiempo específicos para trabajo enfocado entre estas reuniones:\n\n- Martes: 10:00 AM - 1:00 PM: Bloque para trabajo creativo/complejo (antes de tu cita médica)\n- Miércoles: 9:00 AM - 12:00 PM: Bloque para tareas de alta prioridad (antes del almuerzo)\n- Jueves: Todo el día disponible para bloques de enfoque\n\nNecesitaría los siguientes detalles para programar estos bloques de enfoque:\n- Título: ¿Qué tipo de trabajo realizarás en cada bloque?\n- Prioridad: ¿Qué bloques son más importantes?\n- ¿Prefieres configurarlos como eventos recurrentes semanales?\n- ¿Quieres dividir los bloques largos en sesiones más cortas con descansos?";
      } else {
        return "I'd be happy to provide recommendations to optimize your calendar! I notice you have several meetings scheduled this week. I suggest creating specific time blocks for focused work between these meetings:\n\n- Tuesday: 10:00 AM - 1:00 PM: Block for creative/complex work (before your doctor appointment)\n- Wednesday: 9:00 AM - 12:00 PM: Block for high-priority tasks (before lunch)\n- Thursday: All day available for focus blocks\n\nI would need the following details to schedule these focus blocks:\n- Title: What type of work will you do in each block?\n- Priority: Which blocks are most important?\n- Would you prefer to set these up as weekly recurring events?\n- Do you want to split longer blocks into shorter sessions with breaks?";
      }
    }
    
    // Exercise or wellness related
    else if (userMessageLower.includes('exercise') || userMessageLower.includes('workout') || 
             userMessageLower.includes('gym') || userMessageLower.includes('health') ||
             userMessageLower.includes('ejercicio') || userMessageLower.includes('entrenamiento') ||
             userMessageLower.includes('gimnasio') || userMessageLower.includes('salud')) {
      
      if (isSpanish) {
        return "¡El ejercicio es un fantástico impulsor de productividad! Basado en tu calendario actual, te recomiendo programar sesiones de ejercicio en estos horarios:\n\n- Lunes: 7:00 AM - 8:00 AM (antes de tu reunión de equipo)\n- Miércoles: 7:00 AM - 8:00 AM (antes del almuerzo con Alex)\n- Viernes: 6:00 PM - 7:00 PM (después de tu revisión semanal)\n\nPara configurar estas sesiones de ejercicio, necesito los siguientes detalles:\n- Título: ¿Qué tipo de entrenamiento? (cardio, fuerza, yoga, etc.)\n- Ubicación: ¿En casa, gimnasio, parque?\n- ¿Es un evento recurrente? Recomiendo configurarlo como recurrencia semanal\n- ¿Quieres configurar recordatorios? ¿15 minutos antes?\n- Prioridad: ¿Alta, media o baja?";
      } else {
        return "Exercise is a fantastic productivity booster! Based on your current calendar, I recommend scheduling workout sessions at these times:\n\n- Monday: 7:00 AM - 8:00 AM (before your team meeting)\n- Wednesday: 7:00 AM - 8:00 AM (before lunch with Alex)\n- Friday: 6:00 PM - 7:00 PM (after your weekly review)\n\nTo set up these workout sessions, I need the following details:\n- Title: What type of workout? (cardio, strength, yoga, etc.)\n- Location: At home, gym, park?\n- Is this a recurring event? I recommend setting it as weekly recurrence\n- Do you want to set reminders? 15 minutes before?\n- Priority: High, medium, or low?";
      }
    }
    
    // Default response as a fallback
    else {
      if (isSpanish) {
        return "¡Hola! Soy tu asistente de calendario y coach de programación. Observando tu calendario para esta semana, noto que tienes varios compromisos, incluyendo una reunión de equipo el lunes, cita médica el martes y un plazo de proyecto el viernes. ¿Te gustaría que te ayude a optimizar tu horario agregando bloques de enfoque, sesiones de ejercicio o tiempo de preparación para tu fecha límite del proyecto? También puedo ayudarte a crear eventos recurrentes o configurar recordatorios para tareas importantes.";
      } else {
        return "Hi there! I'm your calendar assistant and scheduling coach. Looking at your calendar this week, I notice you have several commitments including a team meeting on Monday, doctor appointment on Tuesday, and project deadline on Friday. Would you like me to help you optimize your schedule by adding focus blocks, exercise sessions, or prep time for your project deadline? I can also help you create recurring events or set up reminders for important tasks.";
      }
    }
  }
}

/**
 * Generate task suggestions using Abacus LLM
 */
export async function generateTaskSuggestion(title: string, description?: string): Promise<string> {
  // Provide special handling for gym and workout tasks
  const titleLower = title.toLowerCase();
  const descLower = description ? description.toLowerCase() : '';
  
  // Check if this is a gym/workout related task
  if (titleLower.includes('gym') || titleLower.includes('workout') || titleLower.includes('exercise') || 
      descLower.includes('gym') || descLower.includes('workout') || descLower.includes('exercise')) {
    
    // Check for specific frequency patterns
    if (descLower.includes('three times') || descLower.includes('3 times a week')) {
      return "For your gym routine three times a week, I recommend scheduling on Monday, Wednesday, and Friday at consistent times. Based on your calendar, I suggest:\n\n- Monday: 7:00 AM - 8:00 AM (before your team meeting)\n- Wednesday: 7:00 AM - 8:00 AM (before lunch with Alex)\n- Friday: 6:00 PM - 7:00 PM (after your weekly review)\n\nTo add these to your calendar, I need:\n- Title: What specific workout? (Strength training, cardio, etc.)\n- Location: Home, gym name, or park?\n- Priority: High, medium, or low?\n- Do you want reminders? 15 or 30 minutes before?\n- Would you like these as recurring weekly events?";
    }
    
    // Default gym prompt with more specificity
    return `Based on your existing calendar, I recommend scheduling your gym workouts at these specific times:

- Monday: 7:00 AM - 8:00 AM (before your team meeting at 10:00 AM)
- Wednesday: 7:00 AM - 8:00 AM (before lunch with Alex at 12:30 PM)
- Friday: 6:00 PM - 7:00 PM (after your weekly review at 5:00 PM)

Morning workouts can boost metabolism throughout the day, while evening sessions often yield higher performance.

To add these to your calendar, I need the following details:
- Title: What type of workout? (cardio, strength, yoga, etc.)
- Location: At home, gym, park?
- Is this a recurring event? I recommend setting it as weekly recurrence
- Do you want to set reminders? 15 minutes before?
- Priority: High, medium, or low?`;
  }
  
  // For all other tasks, use the standard Abacus LLM call
  const prompt = `As my scheduling coach and time management expert, please suggest how to optimize this task on my calendar:
Title: ${title}
${description ? `Description: ${description}` : ''}

My current calendar events are:
- Team Meeting (Monday, 10:00 AM - 11:30 AM)
- Doctor Appointment (Tuesday, 2:00 PM - 3:00 PM)
- Project Deadline (Friday, All Day)
- Weekly Review (Friday, 4:00 PM - 5:00 PM)
- Lunch with Alex (Wednesday, 12:30 PM - 1:30 PM)

Provide a friendly, encouraging suggestion for scheduling or completing this task more effectively, acting as both my coach and friend.`;

  return callAbacusLLM(prompt);
}

/**
 * Generate a weekly report summary using Abacus LLM
 */
export async function generateWeeklyReportSummary(stats: any): Promise<string> {
  const prompt = `As my productivity coach and friend who is the best at managing time, please analyze the following statistics from my week:
- Completed ${stats.tasksCompleted} out of ${stats.tasksTotal} tasks (${Math.round((stats.tasksCompleted / stats.tasksTotal) * 100) || 0}%)
- Average productivity rating: ${stats.avgProductivity}/5
- Accepted ${stats.aiSuggestionsAccepted} out of ${stats.aiSuggestionsTotal} AI suggestions

My current calendar events are:
- Team Meeting (Monday, 10:00 AM - 11:30 AM)
- Doctor Appointment (Tuesday, 2:00 PM - 3:00 PM)
- Project Deadline (Friday, All Day)
- Weekly Review (Friday, 4:00 PM - 5:00 PM)
- Lunch with Alex (Wednesday, 12:30 PM - 1:30 PM)

Please provide:
1. A supportive and encouraging analysis of my productivity
2. 2-3 actionable, friendly recommendations for improvement that take my current schedule into account
`;

  return callAbacusLLM(prompt);
}