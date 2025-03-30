import { apiRequest } from "./queryClient";
import { InsertChatMessage, InsertAiSuggestion } from "@shared/schema";

/**
 * Send a message to the AI assistant
 */
export async function sendChatMessage(message: string): Promise<void> {
  const messageData: InsertChatMessage = {
    content: message,
    timestamp: new Date().toISOString(),
    sender: 'user',
    userId: 1 // Default to user 1 if not authenticated
  };
  
  await apiRequest('/api/chat-messages', {
    method: 'POST',
    body: JSON.stringify(messageData)
  });
}

/**
 * Get the most recent chat messages
 */
export async function getChatMessages(limit?: number): Promise<any> {
  const url = `/api/chat-messages${limit ? `?limit=${limit}` : ''}`;
  const response = await apiRequest(url);
  return response;
}

/**
 * Create a new AI suggestion
 */
export async function createAiSuggestion(suggestion: string, type: string, metadata?: any): Promise<any> {
  const suggestionData: InsertAiSuggestion = {
    suggestion,
    timestamp: new Date().toISOString(),
    accepted: false,
    type,
    metadata,
    userId: 1 // Default to user 1 if not authenticated
  };
  
  const response = await apiRequest('/api/ai-suggestions', {
    method: 'POST',
    body: JSON.stringify(suggestionData)
  });
  return response;
}

/**
 * Get a list of AI suggestions
 */
export async function getAiSuggestions(limit?: number): Promise<any> {
  const url = `/api/ai-suggestions${limit ? `?limit=${limit}` : ''}`;
  const response = await apiRequest(url);
  return response;
}

/**
 * Mark an AI suggestion as accepted or rejected
 */
export async function updateAiSuggestion(id: number, accepted: boolean): Promise<any> {
  const response = await apiRequest(`/api/ai-suggestions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ accepted })
  });
  return response;
}

/**
 * Generate a suggestion for a task based on its title and description
 */
export async function getTaskSuggestion(title: string, description?: string): Promise<string> {
  try {
    // Use our dedicated API endpoint for task suggestions
    const response = await apiRequest('/api/ai-suggestions/generate', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description: description || ''
      })
    });
    
    return response.suggestion;
  } catch (error) {
    console.error('Error calling task suggestion API:', error);
    
    // Provide smart fallback suggestions based on task type and description
    // Analyze the input to generate a context-specific response
    const taskLower = title.toLowerCase();
    const descLower = description ? description.toLowerCase() : '';
    
    // Workout/Gym routine suggestions
    if (taskLower.includes('gym') || taskLower.includes('workout') || taskLower.includes('exercise') || 
        descLower.includes('gym') || descLower.includes('workout') || descLower.includes('exercise')) {
      // If frequency is mentioned
      if (descLower.includes('three times') || descLower.includes('3 times')) {
        return "For your gym routine three times a week, I recommend scheduling on Monday, Wednesday, and Friday at consistent times, ideally morning (6-8 AM) or evening (5-7 PM) when energy levels are optimal. Would you like me to add these recurring sessions to your calendar?";
      } else if (descLower.includes('twice') || descLower.includes('two times') || descLower.includes('2 times')) {
        return "For your workout routine twice a week, I suggest scheduling on Tuesday and Friday with at least 48 hours between sessions for muscle recovery. Would you like me to add these as recurring events?";
      } else if (descLower.includes('daily') || descLower.includes('every day')) {
        return "For daily workouts, I recommend alternating between strength training and cardio to prevent overtraining. Would you like me to create a balanced weekly routine in your calendar?";
      } else {
        return "For your gym sessions, I recommend scheduling them at the same time on consistent days to build a habit. Morning workouts (6-8 AM) can boost metabolism all day, while evening sessions (5-7 PM) often yield higher performance. Which would you prefer?";
      }
    }
    
    // Meeting/call suggestions
    else if (taskLower.includes('meeting') || taskLower.includes('call')) {
      return "I suggest allocating 15 minutes before this meeting for preparation and 10 minutes after for notes. This buffer time helps you prepare mentally and document key takeaways while they're fresh. Would you like me to update your schedule with these buffers?";
    } 
    
    // Project/deadline suggestions
    else if (taskLower.includes('deadline') || taskLower.includes('project')) {
      return "This looks like an important project deadline. I recommend scheduling 3-4 focused work blocks (90-120 minutes each) in the days leading up to it, with the most intensive work at least 2 days before the deadline to allow for contingencies. Would you like me to create these focus blocks in your calendar?";
    } 
    
    // Appointment suggestions
    else if (taskLower.includes('doctor') || taskLower.includes('appointment')) {
      return "For appointments, I recommend adding travel time and potential waiting time. Would you like me to block 30 minutes before for travel and 15 minutes after to account for any follow-up actions or delays?";
    }
    
    // Default suggestion - more detailed and helpful
    return "Looking at your task details, I recommend scheduling this at a time when you typically have high focus and energy. I also suggest adding a reminder 24 hours before and setting a specific duration to help with time management. When would be the ideal time to schedule this task in your week?";
  }
}

/**
 * Connect to the WebSocket server
 */
export function connectWebSocket(): WebSocket | null {
  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`; // Use the specific path we set on the server
    
    console.log('Connecting to WebSocket at:', wsUrl);
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
    };
    
    ws.onclose = (event) => {
      console.log('WebSocket connection closed', event.code, event.reason);
      
      // Try to reconnect after 3 seconds if not a normal closure
      if (event.code !== 1000) {
        console.log('Attempting to reconnect in 3 seconds...');
        setTimeout(() => connectWebSocket(), 3000);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return ws;
  } catch (error) {
    console.error('Failed to connect to WebSocket:', error);
    return null;
  }
}
