import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/authContext';
import useWebSocket from '@/hooks/useWebSocket';
import { useToast } from '@/hooks/use-toast';
import { Bell } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function WebSocketNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Initialize WebSocket connection with user's token
  const { status, addMessageHandler } = useWebSocket(
    user ? user.id.toString() : null,
    {
      onOpen: () => {
        console.log('WebSocket connected');
      },
      onClose: () => {
        console.log('WebSocket disconnected');
      },
      onError: () => {
        console.error('WebSocket connection error');
      }
    }
  );

  // Register handlers for different notification types
  useEffect(() => {
    if (status === 'open') {
      // Handle order updates
      const removeOrderHandler = addMessageHandler('order_update', (data) => {
        const newNotification: Notification = {
          id: `order-${Date.now()}`,
          type: 'order_update',
          message: `Order #${data.orderId} status updated to ${data.status}`,
          timestamp: new Date().toISOString(),
          read: false
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(count => count + 1);
        
        toast({
          title: 'Order Update',
          description: newNotification.message,
        });
      });
      
      // Handle delivery updates
      const removeDeliveryHandler = addMessageHandler('delivery_update', (data) => {
        const newNotification: Notification = {
          id: `delivery-${Date.now()}`,
          type: 'delivery_update',
          message: `Delivery #${data.deliveryId} status: ${data.status}${data.location ? ` (Location: ${data.location})` : ''}`,
          timestamp: new Date().toISOString(),
          read: false
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(count => count + 1);
        
        toast({
          title: 'Delivery Update',
          description: newNotification.message,
        });
      });
      
      // Handle new message notifications
      const removeMessageHandler = addMessageHandler('new_message', (data) => {
        const newNotification: Notification = {
          id: `message-${Date.now()}`,
          type: 'new_message',
          message: `New message from ${data.sender}: "${data.preview}"`,
          timestamp: new Date().toISOString(),
          read: false
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(count => count + 1);
        
        toast({
          title: 'New Message',
          description: newNotification.message,
        });
      });
      
      return () => {
        removeOrderHandler();
        removeDeliveryHandler();
        removeMessageHandler();
      };
    }
  }, [status, addMessageHandler, toast]);
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs h-7"
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-3 border-b text-sm ${!notification.read ? 'bg-primary/5' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium">{notification.message}</span>
                  <span className="text-xs text-gray-500 ml-2">{formatTimestamp(notification.timestamp)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              No notifications yet
            </div>
          )}
        </div>
        
        {status !== 'open' && (
          <div className="p-3 text-xs text-center text-amber-600 bg-amber-50">
            {status === 'connecting' ? 'Connecting...' : 'Disconnected from notification service'}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}