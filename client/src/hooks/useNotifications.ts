import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import useWebsocket from './useWebsocket';
import { useAuth } from './useAuth';
import { Notification } from '@shared/schema';

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const { subscribe } = useWebsocket();

  // Fetch notifications
  const { 
    data: notifications = [], 
    isLoading, 
    isError, 
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: isAuthenticated,
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch unread count
  const { 
    data: countData,
    refetch: refetchCount
  } = useQuery({
    queryKey: ['/api/notifications/count'],
    enabled: isAuthenticated,
    refetchInterval: 60000, // Refetch every minute
  });

  // Update unread count when countData changes
  useEffect(() => {
    if (countData) {
      setUnreadCount(countData.count);
    }
  }, [countData]);

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    }
  });

  // Dismiss notification
  const dismissMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/notifications/${id}/dismiss`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    }
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest('/api/notifications/read-all', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
      setUnreadCount(0);
    }
  });

  // Create notification
  const createNotificationMutation = useMutation({
    mutationFn: (notification: any) => apiRequest('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(notification)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    }
  });

  // Handle websocket notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNotificationMessage = (message: any) => {
      if (message.type === 'NEW_NOTIFICATION') {
        refetch();
        refetchCount();
      } else if (message.type === 'UPDATE_NOTIFICATION') {
        refetch();
        refetchCount();
      } else if (message.type === 'NOTIFICATIONS_READ_ALL') {
        refetch();
        refetchCount();
      }
    };

    const unsubscribe = subscribe(handleNotificationMessage);
    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, refetch, refetchCount, subscribe]);

  const markAsRead = useCallback((id: number) => {
    markAsReadMutation.mutate(id);
  }, [markAsReadMutation]);

  const dismiss = useCallback((id: number) => {
    dismissMutation.mutate(id);
  }, [dismissMutation]);

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const createNotification = useCallback((notification: any) => {
    createNotificationMutation.mutate(notification);
  }, [createNotificationMutation]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isError,
    error,
    markAsRead,
    dismiss,
    markAllAsRead,
    createNotification
  };
}