import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useWebSocket } from '@/hooks/useWebSocket';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Navigation
} from 'lucide-react';

export default function BuyerOrdersPage() {
  const [activeTab, setActiveTab] = useState("active");
  
  // Set up WebSocket connection for real-time updates
  const { message } = useWebSocket({
    onOpen: () => console.log('WebSocket connected'),
  });
  
  // Fetch user orders
  const { 
    data: orders, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['/api/orders'],
  });
  
  // Handle real-time updates
  if (message && (message.type === 'orderUpdate' || message.type === 'deliveryUpdate')) {
    refetch();
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_transit':
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    return format(new Date(dateString), 'MMM d, h:mm a');
  };
  
  // Filter orders based on active tab
  const activeOrders = orders?.filter(o => 
    ['pending', 'confirmed', 'in_transit'].includes(o.status)
  ) || [];
  
  const completedOrders = orders?.filter(o => 
    ['delivered', 'cancelled'].includes(o.status)
  ) || [];
  
  const renderOrderCard = (order) => {
    return (
      <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden mb-3">
        <div className="p-3 border-b border-gray-100">
          <div className="flex justify-between">
            <div>
              <h3 className="font-medium">Order #{order.id}</h3>
              <p className="text-sm text-gray-500">
                {formatDate(order.createdAt)}
              </p>
            </div>
            <div className={cn(
              "flex items-center text-sm font-medium rounded-full px-2 py-1",
              order.status === 'pending' ? "bg-yellow-100 text-yellow-800" :
              order.status === 'confirmed' ? "bg-green-100 text-green-800" :
              order.status === 'in_transit' ? "bg-blue-100 text-blue-800" :
              order.status === 'delivered' ? "bg-accent-100 text-accent-800" :
              "bg-red-100 text-red-800"
            )}>
              {getStatusIcon(order.status)}
              <span className="ml-1 capitalize">{order.status.replace('_', ' ')}</span>
            </div>
          </div>
          
          <div className="mt-3 space-y-1">
            {order.items?.map((item, idx) => (
              <div key={idx} className="text-sm">
                {item.quantity}x {item.name || `Product #${item.produceId}`}
              </div>
            ))}
            
            <div className="text-primary-600 font-medium mt-2">
              Total: ₦{order.total.toLocaleString()}
            </div>
            
            {order.deliveryAddress && (
              <div className="flex items-start text-sm text-gray-600 mt-2">
                <MapPin className="h-4 w-4 mr-1 mt-0.5" />
                <span>{order.deliveryAddress}</span>
              </div>
            )}
          </div>
          
          {order.status === 'in_transit' && order.delivery && (
            <div className="mt-3 bg-gray-50 p-2 rounded">
              <div className="text-sm font-medium mb-1">Delivery in progress</div>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  {order.estimatedDeliveryTime ? (
                    <span>Estimated arrival: {formatDate(order.estimatedDeliveryTime)}</span>
                  ) : (
                    <span>Driver is on the way</span>
                  )}
                </div>
                <Button size="sm" variant="outline" className="text-accent-500 border-accent-500">
                  <Navigation className="h-3 w-3 mr-1" />
                  Track
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {order.status === 'delivered' && (
          <div className="p-2 bg-gray-50 flex justify-center">
            <Button variant="outline" size="sm">
              Reorder
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-100 pb-16">
      <AppHeader title="My Orders" showBackButton={true} />
      
      <main className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="active">Active Orders</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex justify-between mb-3">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-800 p-4 rounded-md">
                Failed to load orders
              </div>
            ) : activeOrders.length > 0 ? (
              <div>
                {activeOrders.map(order => renderOrderCard(order))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No active orders</h3>
                <p className="text-gray-500 mb-4">
                  You don't have any active orders at the moment
                </p>
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="bg-primary-500 hover:bg-primary-600"
                >
                  Shop Now
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex justify-between mb-3">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-800 p-4 rounded-md">
                Failed to load orders
              </div>
            ) : completedOrders.length > 0 ? (
              <div>
                {completedOrders.map(order => renderOrderCard(order))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No completed orders</h3>
                <p className="text-gray-500 mb-4">
                  You don't have any completed orders yet
                </p>
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="bg-primary-500 hover:bg-primary-600"
                >
                  Shop Now
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
