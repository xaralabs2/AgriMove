import { useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { MapPin, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface OrderItemProps {
  order: {
    id: number;
    status: string;
    createdAt: string;
    total: number;
    deliveryFee: number;
    estimatedDeliveryTime?: string;
    pickupLocations?: Array<{
      id: number;
      name: string;
      address: string;
    }>;
    deliveryAddress: string;
    items: Array<{
      id: number;
      quantity: number;
      produceId: number;
      name?: string;
    }>;
  };
  inProgress?: boolean;
}

export default function OrderItem({ order, inProgress = false }: OrderItemProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isAccepting, setIsAccepting] = useState(false);
  
  // Calculate approximate distance and time (would be real in production)
  const distance = Math.floor(Math.random() * 15) + 5; // 5-20km
  const estimatedTime = Math.floor(distance * 3) + 15; // 15-75 mins
  
  const handleAcceptOrder = async () => {
    try {
      setIsAccepting(true);
      
      // Call the API to create a delivery
      const response = await apiRequest('POST', '/api/deliveries', {
        orderId: order.id,
        // Other details would be added in a real app
        distance
      });
      
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ['/api/available-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      toast({
        title: "Success",
        description: "Order accepted successfully",
      });
      
      // Navigate to delivery page
      navigate(`/driver/delivery/${data.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept order",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };
  
  const handleViewDelivery = () => {
    // Find the delivery ID for this order and navigate to it
    // In a real app, we would have this information from the API
    navigate(`/driver/delivery/${order.id}`);
  };
  
  const formattedDate = order.createdAt 
    ? format(new Date(order.createdAt), 'MMM d, h:mm a')
    : 'Unknown date';
  
  const getPickupText = () => {
    if (order.pickupLocations && order.pickupLocations.length > 0) {
      return order.pickupLocations.map(loc => loc.name).join(', ');
    }
    return "Multiple farms";
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-3 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">Order #{order.id}</h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <MapPin className="h-4 w-4 mr-1 text-primary-500" />
              <span>{getPickupText()}</span>
            </div>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <ArrowRight className="h-4 w-4 mr-1 text-accent-500" />
              <span>{order.deliveryAddress} ({distance}km)</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-primary-600 font-medium">
              ₦{(order.deliveryFee || 1200).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              Est. {estimatedTime} mins
            </div>
          </div>
        </div>
        <div className="mt-2 text-sm">
          <div>
            {order.items.reduce((acc, item) => acc + item.quantity, 0)} packages 
            (approx. {order.items.reduce((acc, item) => acc + item.quantity, 0) * 2}kg)
          </div>
          {order.estimatedDeliveryTime && (
            <div className="text-xs text-gray-500 mt-1">
              Delivery by: {format(new Date(order.estimatedDeliveryTime), 'h:mm a')}
            </div>
          )}
        </div>
      </div>
      <div className="flex p-2 bg-gray-50">
        {inProgress ? (
          <button 
            onClick={handleViewDelivery}
            className="flex-1 text-center py-1 bg-secondary-500 text-white rounded-md text-sm font-medium mx-1"
          >
            View Delivery
          </button>
        ) : (
          <>
            <button 
              onClick={handleAcceptOrder}
              disabled={isAccepting}
              className="flex-1 text-center py-1 bg-primary-500 text-white rounded-md text-sm font-medium mx-1"
            >
              {isAccepting ? "Processing..." : "Accept Order"}
            </button>
            <button className="flex-1 text-center py-1 text-gray-600 text-sm font-medium mx-1">
              View Details
            </button>
          </>
        )}
      </div>
    </div>
  );
}
