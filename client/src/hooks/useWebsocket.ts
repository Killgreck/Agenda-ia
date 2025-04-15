import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

export default function useWebsocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { isAuthenticated: authStatus, user } = useAuth();
  const messageHandlers = useRef<Array<(message: any) => void>>([]);

  useEffect(() => {
    if (!authStatus) return;

    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Get user ID from auth state
      const userId = user?.id;
      
      if (userId) {
        // Send authentication message to associate this connection with the user
        const authMessage = {
          type: 'AUTH',
          userId: userId
        };
        ws.send(JSON.stringify(authMessage));
        console.log(`Sent WebSocket authentication with user ID: ${userId}`);
      } else {
        console.warn('WebSocket connected but no user ID available for authentication');
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setIsAuthenticated(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle authentication confirmation
        if (data.type === 'AUTH_CONFIRMED') {
          console.log('WebSocket authentication confirmed:', data.message);
          setIsAuthenticated(true);
        }
        
        // Notify all message handlers
        messageHandlers.current.forEach(handler => handler(data));
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    setSocket(ws);

    // Clean up on unmount
    return () => {
      ws.close();
    };
  }, [authStatus, user]);

  // Send message through WebSocket
  const sendMessage = useCallback((message: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }, [socket, isConnected]);

  // Subscribe to WebSocket messages
  const subscribe = useCallback((handler: (message: any) => void) => {
    messageHandlers.current.push(handler);

    // Return unsubscribe function
    return () => {
      const index = messageHandlers.current.indexOf(handler);
      if (index !== -1) {
        messageHandlers.current.splice(index, 1);
      }
    };
  }, []);

  return {
    isConnected,
    sendMessage,
    subscribe
  };
}