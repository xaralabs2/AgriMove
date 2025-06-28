import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import MapView from '@/components/driver/MapView';
import DeliveryProgress from '@/components/driver/DeliveryProgress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { Phone, MessagesSquare } from 'lucide-react';

interface DeliveryPageProps {
  id: string;
}

export default function DriverDeliveryPage({ id }: DeliveryPageProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Set up WebSocket connection for real-time updates
  const { sendMessage } = useWebSocket({
    onOpen: () => console.log('WebSocket connected'),
  });
  
  // Fetch delivery details
  const { 
    data: delivery, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: [`/api/deliveries/${id}`],
    queryFn: async () => {
      try {
        // First try to get by delivery ID
        const res = await fetch(`/api/deliveries/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!res.ok) {
          throw new Error('Delivery not found');
        }
        return res.json();
      } catch (error) {
        // If delivery not found, try to get by order ID
        // This is just for demo purposes
        // In a real app, we would have a proper relationship
        const orders = await fetch('/api/orders', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.json());
        
        const order = orders.find(o => o.id === parseInt(id));
        if (!order) {
          throw new Error('Delivery not found');
        }
        
        return {
          id: parseInt(id),
          orderId: order.id,
          status: order.status,
          pickupLocation: 'Multiple pickup locations',
          deliveryLocation: order.deliveryAddress,
          createdAt: order.createdAt
        };
      }
    },
  });
  
  // Get order details
  const { data: order } = useQuery({
    queryKey: [`/api/orders/${delivery?.orderId}`],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${delivery.orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return res.json();
    },
    enabled: !!delivery?.orderId,
  });
  
  const handleUpdateStatus = async (status: string) => {
    if (!delivery) return;
    
    try {
      setUpdatingStatus(true);
      
      await apiRequest('PUT', `/api/deliveries/${delivery.id}`, {
        updates: { status }
      });
      
      // Update order status if delivery is completed
      if (status === 'completed' && delivery.orderId) {
        await apiRequest('PUT', `/api/orders/${delivery.orderId}`, {
          updates: { status: 'delivered' }
        });
      }
      
      // Send real-time update via WebSocket
      sendMessage({
        type: 'deliveryUpdate',
        deliveryId: delivery.id,
        status,
      });
      
      // Refetch data
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      toast({
        title: "Status updated",
        description: `Delivery status updated to ${status}`,
      });
      
      // If completed, redirect to orders page after a delay
      if (status === 'completed') {
        setTimeout(() => {
          navigate('/driver/orders');
        }, 2000);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  // Fake buyer contact details for demo
  const buyerName = order?.buyerName || "Customer";
  const buyerPhone = order?.buyerPhone || "+234801234567";
  
  const isCompleted = delivery?.status === 'completed';

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-100 pb-16">
      <AppHeader title="Delivery Details" showBackButton={true} />
      
      <main className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-800 p-4 rounded-md">
            Failed to load delivery details
          </div>
        ) : delivery ? (
          <>
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <h2 className="text-lg font-semibold mb-2">Delivery Map</h2>
              <MapView delivery={delivery} />
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-semibold">Delivery Status</h2>
                <div className={`px-2 py-1 text-xs rounded-full ${
                  delivery.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  delivery.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  delivery.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {delivery.status.replace('_', ' ').charAt(0).toUpperCase() + 
                   delivery.status.replace('_', ' ').slice(1)}
                </div>
              </div>
              
              <DeliveryProgress 
                delivery={delivery} 
                onUpdateStatus={handleUpdateStatus} 
              />
            </div>
            
            {order?.items && (
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <h2 className="text-lg font-semibold mb-2">Order Details</h2>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Order ID:</span>
                    <span className="font-medium">#{delivery.orderId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Items:</span>
                    <span className="font-medium">
                      {order.items.reduce((acc, item) => acc + item.quantity, 0)} items
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Payment:</span>
                    <span className="font-medium text-green-600">
                      {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <h2 className="text-lg font-semibold mb-2">Customer Contact</h2>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{buyerName}</div>
                  <div className="text-sm text-gray-600">{buyerPhone}</div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-accent-500 text-accent-500"
                    onClick={() => window.open(`tel:${buyerPhone}`, '_blank')}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-primary-500 text-primary-500"
                    onClick={() => window.open(`sms:${buyerPhone}`, '_blank')}
                  >
                    <MessagesSquare className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                </div>
              </div>
            </div>
            
            {!isCompleted && (
              <Button 
                className="w-full bg-primary-500 hover:bg-primary-600"
                disabled={updatingStatus}
                onClick={() => handleUpdateStatus(
                  delivery.status === 'pending' ? 'in_progress' : 'completed'
                )}
              >
                {updatingStatus ? "Updating..." : 
                 delivery.status === 'pending' ? "Start Delivery" :
                 delivery.status === 'in_progress' ? "Complete Delivery" : ""}
              </Button>
            )}
          </>
        ) : null}
      </main>
      
      <BottomNavigation />
    </div>
  );
}
