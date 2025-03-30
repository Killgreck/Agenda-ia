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
    
    // For now, use a simpler non-LLM response for better reliability
    return "Hi there! I'm your calendar assistant and scheduling coach. I'd be happy to help you manage your schedule or provide productivity tips. What can I help you with today?";
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