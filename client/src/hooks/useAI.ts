import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { InsertChatMessage, AiSuggestion } from "@shared/schema";
import { getTaskSuggestion } from "@/lib/ai";
import { useToast } from "@/hooks/use-toast";
import useWebsocket from "./useWebsocket";

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
  
  // Use the central WebSocket hook
  const { subscribe, isConnected } = useWebsocket();
  
  // Subscribe to relevant WebSocket messages
  useEffect(() => {
    if (!isConnected) return;
    
    // Get user ID for message filtering
    const userId = authStorage?.state?.user?.id;
    
    // Define message handler
    const handleMessage = (data: any) => {
      if (data.type === 'NEW_CHAT_MESSAGE') {
        // Add the new message to the list only if it belongs to this user
        const newMessage = data.message as ChatMessage;
        
        // Check if the message belongs to this user
        // If userId isn't in the message, it's likely a broadcast intended for everyone
        if (!newMessage.userId || newMessage.userId === userId) {
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
      }
    };
    
    // Subscribe to messages
    const unsubscribe = subscribe(handleMessage);
    
    // Clean up subscription when component unmounts
    return () => {
      unsubscribe();
    };
  }, [isConnected, subscribe, authStorage?.state?.user?.id]);
  
  // Initialize with welcome message since messages aren't persisted anymore
  useEffect(() => {
    // Get user ID for the welcome message
    const userId = authStorage?.state?.user?.id || 1; // Fallback to id 1 if not found
    
    // Add welcome message only if messages array is empty
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 0,
        content: "Hi there! I'm your calendar assistant and scheduling coach. I'd be happy to help you manage your schedule or provide productivity tips. What can I help you with today?",
        timestamp: new Date().toISOString(),
        sender: 'ai',
        userId // Adding userId for the welcome message
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length]);
  
  // Mutation to send message
  const { mutateAsync: sendMessageMutation } = useMutation({
    mutationFn: async (content: string) => {
      // Check if user is authenticated
      if (!isAuthenticated) {
        throw new Error("Must be logged in to use chat");
      }
      
      // Send the message to our new private chat endpoint
      const response = await apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: content })
      });
      
      // Nueva API devuelve directamente el objeto JSON, no necesitamos llamar a response.json()
      if (!response.success) {
        throw new Error(response.message || "Error sending message");
      }
      
      // If request succeeded, add the user message to the local state first
      const userMessage: ChatMessage = {
        id: Date.now(),
        content: content,
        timestamp: new Date().toISOString(),
        sender: 'user',
        userId: authStorage?.state?.user?.id
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Return the AI's response message to be handled
      return response.message;
    },
    onSuccess: (aiResponseContent) => {
      // AI response message
      const aiMessage: ChatMessage = {
        id: Date.now() + 1, // Ensure different ID from user message
        content: aiResponseContent,
        timestamp: new Date().toISOString(),
        sender: 'ai',
        userId: authStorage?.state?.user?.id
      };
      
      // Simulate typing effect before adding AI response
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, aiMessage]);
      }, 1000);
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
      // The sendMessageMutation now handles adding messages to the UI
      await sendMessageMutation(content);
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
  }, [sendMessageMutation]);
  
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
        
        await apiRequest('/api/ai-suggestions', {
          method: 'POST',
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
          
          await apiRequest('/api/ai-suggestions', {
            method: 'POST',
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
