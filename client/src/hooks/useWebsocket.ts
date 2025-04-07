import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

export default function useWebsocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { isAuthenticated: authStatus, user } = useAuth();
  const messageHandlers = useRef<Array<(message: any) => void>>([]);

  useEffect(() => {
    // Only establish WebSocket connection if authenticated AND we have a userId
    if (!authStatus || !user?.id) {
      // If we already have a socket but user is no longer authenticated, clean up
      if (socket) {
        console.log('User no longer authenticated, closing WebSocket');
        socket.close();
        setSocket(null);
        setIsConnected(false);
        setIsAuthenticated(false);
      }
      return;
    }

    try {
      // Create WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      console.log(`Attempting to establish WebSocket connection to ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Get user ID from auth state - should always be available at this point
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
          // Close connection if we somehow don't have userId
          ws.close();
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected with code:', event.code);
        setIsConnected(false);
        setIsAuthenticated(false);
        setSocket(null);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Don't set socket to null here, let the onclose handler do it
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

      // Clean up on unmount or when auth state changes
      return () => {
        console.log('Cleaning up WebSocket connection');
        if (ws && ws.readyState !== WebSocket.CLOSED) {
          ws.close();
        }
        setSocket(null);
      };
    } catch (error) {
      console.error('Error establishing WebSocket connection:', error);
    }
  }, [authStatus, user, socket]);

  // Send message through WebSocket with better error handling
  const sendMessage = useCallback((message: any) => {
    try {
      if (socket && isConnected && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
        return true;
      } else {
        console.warn('Cannot send message: WebSocket not connected or not in OPEN state', {
          socketExists: !!socket,
          isConnected,
          readyState: socket?.readyState
        });
        return false;
      }
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
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