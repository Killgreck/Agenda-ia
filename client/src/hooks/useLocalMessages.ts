import { useState, useEffect } from 'react';
import { ChatMessage } from '@/types/chat';

// Define adapter function to convert any message to the correct ChatMessage format
const adaptMessage = (message: any): ChatMessage => {
  return {
    id: message.id || Date.now(),
    content: message.content,
    timestamp: message.timestamp || new Date().toISOString(),
    sender: message.sender === 'user' ? 'user' : message.sender === 'ai' ? 'ai' : 'system'
  };
};

/**
 * Custom hook to manage message state for the AI Assistant
 * This allows us to manipulate messages directly when API is unavailable
 */
export function useLocalMessages(initialMessages: any[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Process initial messages when they change (from useAI)
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      const adaptedMessages = initialMessages.map(msg => adaptMessage(msg));
      setMessages(adaptedMessages);
    }
  }, [initialMessages]);

  /**
   * Add a user message to the chat
   */
  const addUserMessage = (content: string) => {
    const message: ChatMessage = {
      id: Date.now(),
      content,
      timestamp: new Date().toISOString(),
      sender: 'user'
    };
    
    setMessages(prev => [...prev, message]);
    return message;
  };

  /**
   * Add an AI response message to the chat
   */
  const addAIMessage = (content: string, delayMs: number = 0) => {
    return new Promise<ChatMessage>((resolve) => {
      const message: ChatMessage = {
        id: Date.now() + 1,
        content,
        timestamp: new Date().toISOString(),
        sender: 'ai'
      };
      
      if (delayMs > 0) {
        setTimeout(() => {
          setMessages(prev => [...prev, message]);
          resolve(message);
        }, delayMs);
      } else {
        setMessages(prev => [...prev, message]);
        resolve(message);
      }
    });
  };

  /**
   * Clear all messages
   */
  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    setMessages,
    addUserMessage,
    addAIMessage,
    clearMessages
  };
}