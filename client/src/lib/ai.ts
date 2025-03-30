import { apiRequest } from "./queryClient";
import { InsertChatMessage, InsertAiSuggestion } from "@shared/schema";

/**
 * Send a message to the AI assistant
 */
export async function sendChatMessage(message: string): Promise<void> {
  const messageData: InsertChatMessage = {
    content: message,
    timestamp: new Date().toISOString(),
    sender: 'user'
  };
  
  await apiRequest('POST', '/api/chat-messages', messageData);
}

/**
 * Get the most recent chat messages
 */
export async function getChatMessages(limit?: number): Promise<any> {
  const url = `/api/chat-messages${limit ? `?limit=${limit}` : ''}`;
  const response = await apiRequest('GET', url);
  return response.json();
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
    metadata
  };
  
  const response = await apiRequest('POST', '/api/ai-suggestions', suggestionData);
  return response.json();
}

/**
 * Get a list of AI suggestions
 */
export async function getAiSuggestions(limit?: number): Promise<any> {
  const url = `/api/ai-suggestions${limit ? `?limit=${limit}` : ''}`;
  const response = await apiRequest('GET', url);
  return response.json();
}

/**
 * Mark an AI suggestion as accepted or rejected
 */
export async function updateAiSuggestion(id: number, accepted: boolean): Promise<any> {
  const response = await apiRequest('PATCH', `/api/ai-suggestions/${id}`, { accepted });
  return response.json();
}

/**
 * Generate a suggestion for a task based on its title and description
 */
export async function getTaskSuggestion(title: string, description?: string): Promise<string> {
  try {
    // Use our new dedicated API endpoint for task suggestions
    const response = await fetch('/api/ai-suggestions/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        description: description || ''
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Error generating task suggestion:', errorData || response.statusText);
      throw new Error(errorData?.message || 'Failed to generate task suggestion');
    }
    
    const data = await response.json();
    return data.suggestion;
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
