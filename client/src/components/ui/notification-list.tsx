import React from 'react';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { X, Bell, Calendar, Check, AlertTriangle, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Notification } from '@shared/schema';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface NotificationListProps {
  notifications: Notification[];
}

export default function NotificationList({ notifications }: NotificationListProps) {
  const { markAsRead, dismiss } = useNotifications();
  const [, navigate] = useLocation();

  if (notifications.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        No notifications
      </div>
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_reminder':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'task_due':
        return <Calendar className="h-5 w-5 text-orange-500" />;
      case 'task_overdue':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'task_completed':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'ai_suggestion':
        return <Bell className="h-5 w-5 text-purple-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Navigate to the related content if there's a link
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="max-h-[400px] overflow-auto">
      {notifications.map((notification, index) => (
        <div key={notification.id}>
          <div
            className={cn(
              "flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer",
              notification.status === 'unread' && "bg-blue-50"
            )}
          >
            <div className="mt-1">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1" onClick={() => handleClick(notification)}>
              <p className="text-sm font-medium">{notification.title}</p>
              <p className="text-xs text-muted-foreground">{notification.message}</p>
              <p className="mt-1 text-xs text-gray-400">
                {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                dismiss(notification.id);
              }}
            >
              <X className="h-3.5 w-3.5" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
          {index < notifications.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  );
}