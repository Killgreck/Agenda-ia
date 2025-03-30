import axios from 'axios';

// Abacus LLM API integration
const API_KEY = process.env.ABACUS_API_KEY;
const API_URL = 'https://api.abacus.ai/v0/inference';

interface AbacusRequest {
  model: string;
  prompt: string;
  temperature?: number;
  max_tokens?: number;
  system_message?: string;
}

interface AbacusResponse {
  response: string;
  status: string;
  id: string;
}

/**
 * Make a request to the Abacus LLM API
 */
export async function callAbacusLLM(userMessage: string): Promise<string> {
  if (!API_KEY) {
    throw new Error('Abacus API key is not configured');
  }

  try {
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
      model: 'meta-llama-3-8b-instruct',
      prompt: userMessage,
      temperature: 0.7,
      max_tokens: 500,
      system_message: systemMessage
    };

    const response = await axios.post(API_URL, requestData, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 && response.data.status === 'success') {
      return response.data.response as string;
    } else {
      console.error('Abacus LLM API error:', response.data);
      throw new Error(`API returned status: ${response.data.status}`);
    }
  } catch (error) {
    console.error('Error calling Abacus LLM API:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Status code:', error.response?.status);
    }
    // Provide a fallback response rather than exposing the error to users
    return "I'm having trouble connecting to my knowledge base at the moment. Please try again in a moment.";
  }
}

/**
 * Generate task suggestions using Abacus LLM
 */
export async function generateTaskSuggestion(title: string, description?: string): Promise<string> {
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