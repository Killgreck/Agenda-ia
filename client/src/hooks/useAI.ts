import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { InsertChatMessage, AiSuggestion } from "@shared/schema";
import { getTaskSuggestion } from "@/lib/ai";
import { useToast } from "@/hooks/use-toast";

// Define a client-side version of ChatMessage with timestamp as string
// This prevents type issues between server (Date) and client (string) representations
interface ChatMessage {
  id: number;
  content: string;
  timestamp: string;
  sender: string;
  userId?: number; // Making userId optional to fix TypeScript errors
}

export function useAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Check if authentication has been verified - fetch the auth status from localStorage
  const authStorageStr = localStorage.getItem('auth-storage');
  const authStorage = authStorageStr ? JSON.parse(authStorageStr) : { state: { isAuthenticated: false } };
  const isAuthenticated = authStorage?.state?.isAuthenticated;
  
  // Create a websocket connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Connecting to WebSocket at:', wsUrl);
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'NEW_CHAT_MESSAGE') {
            // Add the new message to the list
            const newMessage = data.message as ChatMessage;
            
            if (newMessage.sender === 'ai') {
              // Simulate AI typing before showing the message
              setIsTyping(true);
              setTimeout(() => {
                setIsTyping(false);
                setMessages(prev => [...prev, newMessage]);
              }, 1500);
            } else {
              setMessages(prev => [...prev, newMessage]);
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
    
    // Clean up the WebSocket connection when the component unmounts
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);
  
  // Initialize with welcome message since messages aren't persisted anymore
  useEffect(() => {
    // Get user ID for the welcome message
    const userId = authStorage?.state?.user?.id || 1; // Fallback to id 1 if not found
    
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: 0,
      content: "Hello! I'm your AI calendar assistant. I can help schedule tasks, set reminders, and optimize your day. What would you like to do today?",
      timestamp: new Date().toISOString(),
      sender: 'ai',
      userId // Adding userId for the welcome message
    };
    setMessages([welcomeMessage]);
  }, []);
  
  // Mutation to send message
  const { mutateAsync: sendMessageMutation } = useMutation({
    mutationFn: async (content: string) => {
      // Get user ID from auth storage
      const userId = authStorage?.state?.user?.id || 1; // Fallback to id 1 if not found
      
      const messageData: InsertChatMessage = {
        content,
        timestamp: new Date().toISOString(),
        sender: 'user',
        userId
      };
      
      await apiRequest('/api/chat-messages', {
        method: 'POST',
        body: JSON.stringify(messageData)
      });
      return content;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Query to get AI suggestions - only when authenticated
  const { data: suggestionsData = [] } = useQuery({
    queryKey: ['/api/ai-suggestions'],
    refetchOnWindowFocus: false,
    enabled: isAuthenticated // Only run query if authenticated
  });
  
  // Ensure we have a properly typed array of suggestions
  const suggestions = Array.isArray(suggestionsData) ? suggestionsData as AiSuggestion[] : [];
  
  // Function to send a message
  const sendMessage = useCallback(async (content: string) => {
    try {
      await sendMessageMutation(content);
      
      // After a short delay, check if the AI responded
      setTimeout(() => {
        const lastMessage = messages[messages.length - 1];
        
        // If the last message is from the user (not AI), it may indicate an API issue
        if (lastMessage && lastMessage.sender === 'user') {
          // Add a helpful fallback message
          const fallbackMessage: ChatMessage = {
            id: Date.now(), // Use timestamp as ID
            content: "I'm having trouble connecting to my knowledge base right now. I've recorded your message and will process it as soon as I'm back online. In the meantime, you can still use all calendar features.",
            timestamp: new Date().toISOString(),
            sender: 'ai'
          };
          
          setMessages(prev => [...prev, fallbackMessage]);
        }
      }, 8000); // Wait 8 seconds for response before showing error
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now(), // Use timestamp as ID
        content: "I'm having trouble processing your request right now. Please try again in a few moments.",
        timestamp: new Date().toISOString(),
        sender: 'ai'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [sendMessageMutation, messages]);
  
  // Function to ask AI for task suggestion
  const { mutateAsync: askAiForTaskSuggestion, isPending: isAskingAi } = useMutation({
    mutationFn: async (taskDetails: { title: string, description?: string }) => {
      try {
        // Get suggestion from our dedicated AI suggestion endpoint
        const suggestion = await getTaskSuggestion(taskDetails.title, taskDetails.description);
        
        // Check if the response contains an error indicator
        if (suggestion.includes("trouble connecting") || suggestion.includes("error")) {
          throw new Error("AI service error detected in response");
        }
        
        // Get user ID from auth storage for the AI suggestion
        const userId = authStorage?.state?.user?.id || 1; // Fallback to id 1 if not found
        
        // Create the AI suggestion in the database
        const suggestionData = {
          suggestion,
          timestamp: new Date().toISOString(),
          accepted: false,
          type: 'task',
          userId, // Add userId for the suggestion
          metadata: { 
            title: taskDetails.title,
            description: taskDetails.description
          }
        };
        
        await fetch('/api/ai-suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(suggestionData)
        });
        
        return suggestion;
      } catch (error) {
        console.error("Error in AI suggestion:", error);
        
        // Provide a graceful fallback message
        const fallbackSuggestion = "I can provide scheduling suggestions for this task once my connection is restored. In the meantime, consider adding this to your calendar with a buffer time before and after.";
        
        // Still attempt to save this fallback in the database
        try {
          const userId = authStorage?.state?.user?.id || 1;
          const fallbackData = {
            suggestion: fallbackSuggestion,
            timestamp: new Date().toISOString(),
            accepted: false,
            type: 'task',
            userId,
            metadata: { 
              title: taskDetails.title,
              description: taskDetails.description,
              fallback: true
            }
          };
          
          await fetch('/api/ai-suggestions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(fallbackData)
          });
        } catch (dbError) {
          console.error("Error saving fallback suggestion:", dbError);
        }
        
        return fallbackSuggestion;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-suggestions'] });
    },
    onError: (error) => {
      toast({
        title: "AI Connection Issue",
        description: "Unable to generate AI suggestions at the moment. Basic task functionality is still available.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation to update AI suggestion (accept/reject)
  const { mutateAsync: updateSuggestion, isPending: isUpdatingSuggestion } = useMutation({
    mutationFn: async ({ id, accepted }: { id: number, accepted: boolean }) => {
      await apiRequest(`/api/ai-suggestions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ accepted })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-suggestions'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update suggestion status. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Get the current most recent suggestion that hasn't been accepted/rejected
  const currentSuggestion = suggestions.find(suggestion => suggestion.accepted === false);
  
  return { 
    messages, 
    isTyping, 
    sendMessage,
    suggestions,
    currentSuggestion,
    acceptSuggestion: (id: number) => updateSuggestion({ id, accepted: true }),
    rejectSuggestion: (id: number) => updateSuggestion({ id, accepted: false }),
    isAcceptingSuggestion: isUpdatingSuggestion,
    askAiForTaskSuggestion: (title: string, description?: string) => 
      askAiForTaskSuggestion({ title, description }),
    isAskingAi
  };
}

export function useAiSuggestions() {
  const queryClient = useQueryClient();
  
  // Check if authentication has been verified - fetch the auth status from localStorage
  const authStorageStr = localStorage.getItem('auth-storage');
  const authStorage = authStorageStr ? JSON.parse(authStorageStr) : { state: { isAuthenticated: false } };
  const isAuthenticated = authStorage?.state?.isAuthenticated;
  
  // Query to get AI suggestions - only when authenticated
  const { data: suggestionsData = [] } = useQuery({
    queryKey: ['/api/ai-suggestions'],
    refetchOnWindowFocus: false,
    enabled: isAuthenticated // Only run query if authenticated
  });
  
  // Ensure we have a properly typed array of suggestions
  const suggestions = Array.isArray(suggestionsData) ? suggestionsData as AiSuggestion[] : [];
  
  // Mutation to update AI suggestion (accept/reject)
  const { mutateAsync: updateSuggestion, isPending: isAcceptingSuggestion } = useMutation({
    mutationFn: async ({ id, accepted }: { id: number, accepted: boolean }) => {
      await apiRequest(`/api/ai-suggestions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ accepted })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-suggestions'] });
    }
  });
  
  // Get the current most recent suggestion that hasn't been accepted/rejected
  const currentSuggestion = suggestions.find(suggestion => suggestion.accepted === false);
  
  return {
    suggestions,
    currentSuggestion,
    acceptSuggestion: (id: number) => updateSuggestion({ id, accepted: true }),
    rejectSuggestion: (id: number) => updateSuggestion({ id, accepted: false }),
    isAcceptingSuggestion
  };
}
