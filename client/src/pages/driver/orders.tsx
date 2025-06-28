import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import DriverDashboard from '@/components/driver/Dashboard';
import DriverOrderItem from '@/components/driver/OrderItem';
import MapView from '@/components/driver/MapView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Car, PackageCheck } from 'lucide-react';

export default function DriverOrdersPage() {
  const [activeTab, setActiveTab] = useState("available");
  
  // Set up WebSocket connection for real-time updates
  const { message } = useWebSocket({
    onOpen: () => console.log('WebSocket connected'),
  });
  
  // Fetch available orders
  const { 
    data: availableOrders, 
    isLoading: isLoadingAvailable, 
    error: availableError,
    refetch: refetchAvailable
  } = useQuery({
    queryKey: ['/api/available-orders'],
  });
  
  // Fetch active deliveries
  const { 
    data: activeDeliveries, 
    isLoading: isLoadingActive,
    error: activeError,
    refetch: refetchActive
  } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      // In a real app, fetch orders assigned to the driver
      const allOrders = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      }).then(res => res.json());
      
      // Filter by in_transit status
      return allOrders?.filter(order => order.status === 'in_transit') || [];
    },
  });
  
  // Handle real-time updates
  if (message) {
    if (message.type === 'availableOrder') {
      refetchAvailable();
    } else if (message.type === 'orderUpdate' || message.type === 'deliveryUpdate') {
      refetchActive();
    }
  }
  
  const hasActiveDelivery = activeDeliveries && activeDeliveries.length > 0;

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-100 pb-16">
      <AppHeader title="Driver Orders" showBackButton={true} />
      
      <main className="flex-1 p-4">
        <DriverDashboard />
        
        {/* Map Preview */}
        {hasActiveDelivery && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <h2 className="text-lg font-semibold mb-2">Current Delivery</h2>
            <MapView 
              delivery={{
                id: activeDeliveries[0].id,
                pickupLocation: "Multiple pickup locations", // Simplified for demo
                deliveryLocation: activeDeliveries[0].deliveryAddress || "",
              }}
            />
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="available">
              Available
              {availableOrders?.length > 0 && (
                <span className="ml-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {availableOrders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">
              My Deliveries
              {activeDeliveries?.length > 0 && (
                <span className="ml-1 bg-secondary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeDeliveries.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="available" className="mt-0">
            {isLoadingAvailable ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-3 border-b border-gray-100">
                      <div className="flex justify-between">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-4 w-48 mt-2" />
                      <Skeleton className="h-4 w-40 mt-1" />
                      <Skeleton className="h-4 w-36 mt-2" />
                    </div>
                    <div className="h-10 bg-gray-50" />
                  </div>
                ))}
              </div>
            ) : availableError ? (
              <div className="bg-red-50 text-red-800 p-4 rounded-md">
                Failed to load available orders
              </div>
            ) : availableOrders?.length > 0 ? (
              <div className="space-y-3">
                {availableOrders.map(order => (
                  <DriverOrderItem key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No available orders</h3>
                <p className="text-gray-500">
                  There are no orders available for delivery at the moment
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="active" className="mt-0">
            {isLoadingActive ? (
              <div className="space-y-3">
                <Skeleton className="h-40 w-full rounded-lg" />
                <Skeleton className="h-40 w-full rounded-lg" />
              </div>
            ) : activeError ? (
              <div className="bg-red-50 text-red-800 p-4 rounded-md">
                Failed to load your deliveries
              </div>
            ) : activeDeliveries?.length > 0 ? (
              <div className="space-y-3">
                {activeDeliveries.map(delivery => (
                  <DriverOrderItem 
                    key={delivery.id} 
                    order={delivery} 
                    inProgress={true} 
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <PackageCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No active deliveries</h3>
                <p className="text-gray-500">
                  You don't have any active deliveries at the moment
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
