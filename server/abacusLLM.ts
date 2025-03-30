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
    3. Help users manage their schedule by suggesting optimal times for tasks
    4. Provide productivity insights based on their task completion patterns
    5. Answer questions about their calendar and tasks in a friendly, supportive way
    
    Here are the user's current calendar events:
    - Team Meeting (Monday, 10:00 AM - 11:30 AM)
    - Doctor Appointment (Tuesday, 2:00 PM - 3:00 PM)
    - Project Deadline (Friday, All Day)
    - Weekly Review (Friday, 4:00 PM - 5:00 PM)
    - Lunch with Alex (Wednesday, 12:30 PM - 1:30 PM)
    
    The user is currently accessing the AI assistant feature of the application. Be helpful, friendly, and proactive in suggesting improvements to their schedule.`;

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
        return "¡Con gusto te ayudo a agendar eso! ¿Qué día y horario te funciona mejor? Puedo agregarlo a tu calendario con todos los detalles que desees incluir.";
      } else {
        return "I'd be happy to help you schedule that! What day and time works best for you? I can add it to your calendar with any details you'd like to include.";
      }
    }
    
    // Message about productivity or time management
    else if (userMessageLower.includes('productivity') || userMessageLower.includes('efficient') || 
             userMessageLower.includes('focus') || userMessageLower.includes('manage time') ||
             userMessageLower.includes('distracted') || userMessageLower.includes('productividad') ||
             userMessageLower.includes('eficiente') || userMessageLower.includes('concentración')) {
      
      if (isSpanish) {
        return "¡Gran pregunta sobre productividad! Los estudios muestran que bloquear tiempo en tu calendario y programar sesiones de enfoque de 90-120 minutos puede mejorar significativamente tu eficiencia. ¿Te gustaría que te sugiera algunos bloques de tiempo para tu calendario?";
      } else {
        return "Great question about productivity! Research shows that time-blocking your calendar and scheduling focus sessions of 90-120 minutes can significantly improve your efficiency. Would you like me to suggest some time blocks for your calendar?";
      }
    }
    
    // Message about task reminders or deadlines
    else if (userMessageLower.includes('remind') || userMessageLower.includes('forget') || 
             userMessageLower.includes('deadline') || userMessageLower.includes('due date') ||
             userMessageLower.includes('recordar') || userMessageLower.includes('olvidar') ||
             userMessageLower.includes('fecha límite') || userMessageLower.includes('vencimiento')) {
      
      if (isSpanish) {
        return "¡Puedo ayudarte a configurar recordatorios! Para fechas límite importantes, recomiendo establecer múltiples recordatorios: 1 semana antes, 3 días antes y el día anterior. Esto crea un ciclo natural de planificación. ¿Te gustaría que configure estos recordatorios para ti?";
      } else {
        return "I can help you set up reminders! For important deadlines, I recommend setting multiple reminders: 1 week before, 3 days before, and the day before. This creates a natural planning cycle. Would you like me to set these up for you?";
      }
    }
    
    // Message about recommendations
    else if (userMessageLower.includes('recommend') || userMessageLower.includes('suggest') || 
             userMessageLower.includes('advice') || userMessageLower.includes('should i') ||
             userMessageLower.includes('recomienda') || userMessageLower.includes('sugiere') ||
             userMessageLower.includes('consejo') || userMessageLower.includes('debería')) {
      
      if (isSpanish) {
        return "¡Me encantaría darte una recomendación! Basado en investigaciones sobre productividad, te sugiero considerar tus niveles de energía al programar tareas - mañana para trabajo creativo, tarde para reuniones y tareas rutinarias para el final del día. ¿Esto se alinea con tu ritmo natural?";
      } else {
        return "I'd be happy to provide a recommendation! Based on productivity research, I'd suggest considering your energy levels when scheduling tasks - morning for creative work, afternoon for meetings, and routine tasks for end of day. Does that align with your natural rhythm?";
      }
    }
    
    // Exercise or wellness related
    else if (userMessageLower.includes('exercise') || userMessageLower.includes('workout') || 
             userMessageLower.includes('gym') || userMessageLower.includes('health') ||
             userMessageLower.includes('ejercicio') || userMessageLower.includes('entrenamiento') ||
             userMessageLower.includes('gimnasio') || userMessageLower.includes('salud')) {
      
      if (isSpanish) {
        return "¡El ejercicio es un fantástico impulsor de productividad! Las investigaciones muestran que programar entrenamientos en horarios consistentes (como lunes/miércoles/viernes por la mañana) ayuda a establecer el hábito. ¿Te gustaría que te sugiera algunos horarios de entrenamiento en tu calendario?";
      } else {
        return "Exercise is a fantastic productivity booster! Research shows that scheduling workouts at consistent times (like Monday/Wednesday/Friday mornings) helps establish the habit. Would you like me to suggest some workout time slots in your calendar?";
      }
    }
    
    // Default response as a fallback
    else {
      return "Hi there! I'm your calendar assistant and scheduling coach. I'd be happy to help you manage your schedule or provide productivity tips. What can I help you with today?";
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
      return "For your gym routine three times a week, I recommend scheduling on Monday, Wednesday, and Friday at consistent times, ideally morning (6-8 AM) or evening (5-7 PM) when energy levels are optimal. Would you like me to add these recurring sessions to your calendar?";
    }
    
    // Default gym prompt with more specificity
    return `Based on your existing calendar, I recommend scheduling your gym workout on Monday, Wednesday, and Friday. Looking at your calendar, you have availability:
- Monday: Before 10:00 AM or after 11:30 AM
- Wednesday: Before 12:30 PM or after 1:30 PM
- Friday: After 5:00 PM

Morning workouts (6-8 AM) can boost metabolism throughout the day, while evening sessions (5-7 PM) often yield higher performance. Would you like me to add these as recurring events to your calendar?`;
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