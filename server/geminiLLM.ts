import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { log } from './vite';
import { Event } from './mongoModels';

// Initialize the Google Generative AI with the API key
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-1.5-pro';

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
    throw new Error('Gemini API key is not configured');
  }

  try {
    // Debug
    log('Gemini API call starting with message: ' + userMessage, 'gemini');
    
    // Get calendar events as text to provide context
    const calendarEvents = await getCalendarEventsAsText(userId);
    
    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
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
    
    Here are the user's current calendar events:
    ${calendarEvents}
    
    The user is currently accessing the AI assistant feature of the application. Be helpful, friendly, and proactive in suggesting improvements to their schedule. ALWAYS suggest specific available time slots based on the existing calendar.`;

    // Generate content
    const result = await model.generateContent({
      contents: [
        { role: 'system', parts: [{ text: systemMessage }] },
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      safetySettings,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    });
    
    const response = result.response;
    return response.text();
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
    if (isSpanish) {
      return "Lo siento, estoy teniendo problemas para conectarme en este momento. Puedo ayudarte con tu calendario cuando la conexión se restablezca. ¿Hay algo específico sobre tu agenda que te gustaría organizar?";
    } else {
      return "I'm sorry, I'm having trouble connecting right now. I can help you with your calendar once the connection is restored. Is there something specific about your schedule you'd like to organize?";
    }
  }
}

/**
 * Generate task suggestions using Gemini
 */
export async function generateTaskSuggestion(title: string, description?: string): Promise<string> {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  try {
    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
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

    // Generate content
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 250,
      }
    });
    
    const response = result.response;
    return response.text();
  } catch (error) {
    log(`Error generating task suggestion: ${error}`, 'error');
    return "I can provide scheduling suggestions for this task once my connection is restored. In the meantime, consider adding this to your calendar with a buffer time before and after.";
  }
}

/**
 * Generate a weekly report summary using Gemini
 */
export async function generateWeeklyReportSummary(stats: any): Promise<string> {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  try {
    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    // Prepare the prompt for weekly report
    const prompt = `Generate a weekly productivity report based on the following statistics:
    
    Start Date: ${stats.startDate}
    End Date: ${stats.endDate}
    Productivity Score: ${stats.productivityScore}
    Tasks Created: ${stats.tasksCreated}
    Tasks Completed: ${stats.tasksCompleted}
    Total Focus Time: ${stats.totalFocusTime} minutes
    
    Task Breakdown:
    - Personal: ${stats.taskBreakdown.personal}
    - Work: ${stats.taskBreakdown.work}
    - Health: ${stats.taskBreakdown.health}
    - Other: ${stats.taskBreakdown.other}
    
    Most productive day: ${stats.mostProductiveDay}
    
    Provide a friendly, encouraging summary of the week with 2-3 personalized suggestions for improvement.
    Keep your response under 200 words.`;

    // Generate content
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
      }
    });
    
    const response = result.response;
    return response.text();
  } catch (error) {
    log(`Error generating weekly report: ${error}`, 'error');
    return "I'll be able to provide detailed weekly reports when my connection is restored. From what I can see, you've made progress on your tasks this week. Keep up the good work!";
  }
}