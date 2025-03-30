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
    
    // Provide fallback suggestions based on task type for better user experience
    // when the Abacus API is unavailable
    if (title.toLowerCase().includes('meeting') || title.toLowerCase().includes('call')) {
      return "I suggest allocating 15 minutes before this meeting for preparation and 10 minutes after for notes. Would you like me to update your schedule?";
    } else if (title.toLowerCase().includes('deadline') || title.toLowerCase().includes('project')) {
      return "This looks like an important project deadline. Would you like me to create focus time blocks in your calendar to work on this?";
    } else if (title.toLowerCase().includes('doctor') || title.toLowerCase().includes('appointment')) {
      return "For medical appointments, I recommend adding travel time. Would you like me to block 30 minutes before and after this appointment?";
    }
    
    // Default suggestion
    return "Based on your task details, I recommend setting a reminder the day before as well. Would you like me to add that?";
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
