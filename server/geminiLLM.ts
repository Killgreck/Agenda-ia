import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { log } from './vite';
import { Event, User, ChatMessage } from './mongoModels';

// Initialize the Google Generative AI with the API key
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-1.5-pro';

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
    log('Error: Gemini API key is not configured', 'error');
    throw new Error('Gemini API key is not configured');
  }

  try {
    // Debug
    log('Gemini API call starting with message: ' + userMessage, 'gemini');
    log('Using API key length: ' + API_KEY.length, 'gemini'); // Safer than logging the actual key
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
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      log('Gemini model initialized successfully', 'gemini');
      
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
        const result = await model.generateContent({
          contents: [
            { role: 'user', parts: [{ text: combinedPrompt }] }
          ],
          safetySettings,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          }
        });
        
        if (!result || !result.response) {
          log('Gemini API returned empty response', 'error');
          throw new Error('Empty response from Gemini API');
        }
        
        log('Gemini API responded successfully', 'gemini');
        const response = result.response;
        return response.text();
      } catch (apiError) {
        log(`Error in Gemini API call: ${apiError}`, 'error');
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
    log('Error: Gemini API key is not configured for task suggestion', 'error');
    throw new Error('Gemini API key is not configured');
  }

  try {
    // Debug
    log(`Generating task suggestion for: "${title}"`, 'gemini');
    log('Using API key length: ' + API_KEY.length, 'gemini');
    log('Using Model: ' + MODEL_NAME, 'gemini');
    
    try {
      // Initialize the Gemini API
      log('Initializing Gemini API for task suggestion...', 'gemini');
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      log('Gemini model initialized successfully for task suggestion', 'gemini');
      
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
      
      try {
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
      } catch (apiError) {
        log(`Error in Gemini API task suggestion call: ${apiError}`, 'error');
        throw apiError;
      }
    } catch (initError) {
      log(`Error initializing Gemini model for task suggestion: ${initError}`, 'error');
      throw initError;
    }
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
    log('Error: Gemini API key is not configured for weekly report', 'error');
    throw new Error('Gemini API key is not configured');
  }

  try {
    // Debug
    log('Generating weekly report summary...', 'gemini');
    log('Using API key length: ' + API_KEY.length, 'gemini');
    log('Using Model: ' + MODEL_NAME, 'gemini');
    
    try {
      // Initialize the Gemini API
      log('Initializing Gemini API for weekly report...', 'gemini');
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      log('Gemini model initialized successfully for weekly report', 'gemini');
      
      // Check stats object to prevent undefined errors
      if (!stats || typeof stats !== 'object') {
        log('Invalid stats object provided for weekly report', 'error');
        return "I can't generate a report with the data provided. Please ensure your statistics are properly recorded.";
      }
      
      // Safe access to stats properties with fallbacks
      const startDate = stats.startDate || 'Unknown';
      const endDate = stats.endDate || 'Unknown';
      const productivityScore = stats.productivityScore || 0;
      const tasksCreated = stats.tasksCreated || 0;
      const tasksCompleted = stats.tasksCompleted || 0;
      const totalFocusTime = stats.totalFocusTime || 0;
      
      // Safe access to taskBreakdown
      const taskBreakdown = stats.taskBreakdown || {};
      const personal = taskBreakdown.personal || 0;
      const work = taskBreakdown.work || 0;
      const health = taskBreakdown.health || 0;
      const other = taskBreakdown.other || 0;
      
      const mostProductiveDay = stats.mostProductiveDay || 'Unknown';
      
      // Prepare the prompt for weekly report
      const prompt = `Generate a weekly productivity report based on the following statistics:
      
      Start Date: ${startDate}
      End Date: ${endDate}
      Productivity Score: ${productivityScore}
      Tasks Created: ${tasksCreated}
      Tasks Completed: ${tasksCompleted}
      Total Focus Time: ${totalFocusTime} minutes
      
      Task Breakdown:
      - Personal: ${personal}
      - Work: ${work}
      - Health: ${health}
      - Other: ${other}
      
      Most productive day: ${mostProductiveDay}
      
      Provide a friendly, encouraging summary of the week with 2-3 personalized suggestions for improvement.
      Keep your response under 200 words.`;
      
      log('Preparing to send weekly report request to Gemini...', 'gemini');
      
      try {
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
      } catch (apiError) {
        log(`Error in Gemini API weekly report call: ${apiError}`, 'error');
        throw apiError;
      }
    } catch (initError) {
      log(`Error initializing Gemini model for weekly report: ${initError}`, 'error');
      throw initError;
    }
  } catch (error) {
    log(`Error generating weekly report: ${error}`, 'error');
    return "I'll be able to provide detailed weekly reports when my connection is restored. From what I can see, you've made progress on your tasks this week. Keep up the good work!";
  }
}