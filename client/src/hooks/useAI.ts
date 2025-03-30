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
}

export function useAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Create a websocket connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      
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
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: 0,
      content: "Hello! I'm your AI calendar assistant. I can help schedule tasks, set reminders, and optimize your day. What would you like to do today?",
      timestamp: new Date().toISOString(),
      sender: 'ai'
    };
    setMessages([welcomeMessage]);
  }, []);
  
  // Mutation to send message
  const { mutateAsync: sendMessageMutation } = useMutation({
    mutationFn: async (content: string) => {
      const messageData: InsertChatMessage = {
        content,
        timestamp: new Date().toISOString(),
        sender: 'user'
      };
      
      await apiRequest('POST', '/api/chat-messages', messageData);
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
  
  // Query to get AI suggestions
  const { data: suggestionsData = [] } = useQuery({
    queryKey: ['/api/ai-suggestions'],
    refetchOnWindowFocus: false,
  });
  
  // Ensure we have a properly typed array of suggestions
  const suggestions = Array.isArray(suggestionsData) ? suggestionsData as AiSuggestion[] : [];
  
  // Function to send a message
  const sendMessage = useCallback(async (content: string) => {
    try {
      await sendMessageMutation(content);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [sendMessageMutation]);
  
  // Function to ask AI for task suggestion
  const { mutateAsync: askAiForTaskSuggestion, isPending: isAskingAi } = useMutation({
    mutationFn: async (taskDetails: { title: string, description?: string }) => {
      // In a real app, this would call the actual AI API
      const suggestion = await getTaskSuggestion(taskDetails.title, taskDetails.description);
      
      // Create the AI suggestion in the database
      const suggestionData = {
        suggestion,
        timestamp: new Date().toISOString(),
        accepted: false,
        type: 'task',
        metadata: { 
          title: taskDetails.title,
          description: taskDetails.description
        }
      };
      
      await apiRequest('POST', '/api/ai-suggestions', suggestionData);
      return suggestion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-suggestions'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to get AI suggestions. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation to update AI suggestion (accept/reject)
  const { mutateAsync: updateSuggestion, isPending: isUpdatingSuggestion } = useMutation({
    mutationFn: async ({ id, accepted }: { id: number, accepted: boolean }) => {
      await apiRequest('PATCH', `/api/ai-suggestions/${id}`, { accepted });
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
  
  // Query to get AI suggestions
  const { data: suggestionsData = [] } = useQuery({
    queryKey: ['/api/ai-suggestions'],
    refetchOnWindowFocus: false,
  });
  
  // Ensure we have a properly typed array of suggestions
  const suggestions = Array.isArray(suggestionsData) ? suggestionsData as AiSuggestion[] : [];
  
  // Mutation to update AI suggestion (accept/reject)
  const { mutateAsync: updateSuggestion, isPending: isAcceptingSuggestion } = useMutation({
    mutationFn: async ({ id, accepted }: { id: number, accepted: boolean }) => {
      await apiRequest('PATCH', `/api/ai-suggestions/${id}`, { accepted });
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
