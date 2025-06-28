import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import OrderItem from '@/components/farmer/OrderItem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useWebSocket } from '@/hooks/useWebSocket';
import { format } from 'date-fns';
import { Package } from 'lucide-react';

export default function FarmerOrdersPage() {
  const [activeTab, setActiveTab] = useState("pending");
  
  // Set up WebSocket connection for real-time updates
  const { message } = useWebSocket({
    onOpen: () => console.log('WebSocket connected'),
  });
  
  // Fetch farmer orders
  const { 
    data: orders, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['/api/orders'],
  });
  
  // Handle real-time updates
  if (message && message.type === 'newOrder') {
    refetch();
  }
  
  // Filter orders based on active tab
  const pendingOrders = orders?.filter(o => o.status === 'pending') || [];
  const confirmedOrders = orders?.filter(o => 
    ['confirmed', 'in_transit'].includes(o.status)
  ) || [];
  const completedOrders = orders?.filter(o => 
    ['delivered', 'cancelled'].includes(o.status)
  ) || [];

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-100 pb-16">
      <AppHeader title="Orders" showBackButton={true} />
      
      <main className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="pending">
              Pending
              {pendingOrders.length > 0 && (
                <span className="ml-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingOrders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="mt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-3 border-b border-gray-100">
                      <div className="flex justify-between">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-4 w-32 mt-2" />
                      <Skeleton className="h-4 w-20 mt-1" />
                    </div>
                    <div className="p-2 bg-gray-50">
                      <div className="flex justify-between">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-800 p-4 rounded-md">
                Failed to load orders
              </div>
            ) : pendingOrders.length > 0 ? (
              <div className="space-y-3">
                {pendingOrders.map(order => (
                  <OrderItem key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No pending orders</h3>
                <p className="text-gray-500">
                  You don't have any pending orders at the moment
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="confirmed" className="mt-0">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-800 p-4 rounded-md">
                Failed to load orders
              </div>
            ) : confirmedOrders.length > 0 ? (
              <div className="space-y-3">
                {confirmedOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-lg shadow p-3">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">Order #{order.id}</h3>
                        <p className="text-sm text-gray-500">
                          {order.createdAt ? format(new Date(order.createdAt), 'MMM d, h:mm a') : 'Unknown date'}
                        </p>
                      </div>
                      <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {order.status === 'in_transit' ? 'In Transit' : 'Confirmed'}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="text-sm">
                          {item.quantity}x {item.name || `Product #${item.produceId}`}
                        </div>
                      ))}
                      
                      <div className="text-primary-600 font-medium mt-2">
                        Total: ₦{order.total.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No confirmed orders</h3>
                <p className="text-gray-500">
                  You don't have any confirmed orders at the moment
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-0">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-800 p-4 rounded-md">
                Failed to load orders
              </div>
            ) : completedOrders.length > 0 ? (
              <div className="space-y-3">
                {completedOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-lg shadow p-3">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">Order #{order.id}</h3>
                        <p className="text-sm text-gray-500">
                          {order.createdAt ? format(new Date(order.createdAt), 'MMM d, h:mm a') : 'Unknown date'}
                        </p>
                      </div>
                      <div className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'delivered' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {order.status === 'delivered' ? 'Delivered' : 'Cancelled'}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="text-sm">
                          {item.quantity}x {item.name || `Product #${item.produceId}`}
                        </div>
                      ))}
                      
                      <div className="text-primary-600 font-medium mt-2">
                        Total: ₦{order.total.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No completed orders</h3>
                <p className="text-gray-500">
                  You don't have any completed orders yet
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
