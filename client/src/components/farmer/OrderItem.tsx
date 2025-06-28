import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface OrderItemProps {
  order: {
    id: number;
    status: string;
    createdAt: string;
    items: Array<{
      id: number;
      produceId: number;
      name?: string;
      quantity: number;
      unitPrice: number;
      status: string;
    }>;
    total: number;
  };
}

export default function OrderItem({ order }: OrderItemProps) {
  const { toast } = useToast();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  
  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      
      // Update all items in the order to confirmed
      for (const item of order.items) {
        await apiRequest('PUT', `/api/order-items/${item.id}`, {
          updates: { status: 'confirmed' }
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      toast({
        title: "Success",
        description: "Order accepted successfully",
      });
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
  
  const handleDecline = async () => {
    try {
      setIsDeclining(true);
      
      // Update all items in the order to rejected
      for (const item of order.items) {
        await apiRequest('PUT', `/api/order-items/${item.id}`, {
          updates: { status: 'rejected' }
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      toast({
        title: "Order declined",
        description: "The order has been declined",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to decline order",
        variant: "destructive",
      });
    } finally {
      setIsDeclining(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    return (
      <span
        className={cn(
          "text-xs px-2 py-0.5 rounded-full flex items-center",
          status === "pending" ? "bg-yellow-100 text-yellow-800" :
          status === "confirmed" ? "bg-green-100 text-green-800" :
          status === "in_transit" ? "bg-blue-100 text-blue-800" :
          status === "delivered" ? "bg-accent-100 text-accent-800" :
          status === "cancelled" ? "bg-red-100 text-red-800" :
          "bg-gray-100 text-gray-800"
        )}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  // Format the date
  const formattedDate = order.createdAt 
    ? format(new Date(order.createdAt), 'MMM d, h:mm a')
    : 'Unknown date';
  
  // Check if all order items are pending
  const isPending = order.items.every(item => item.status === 'pending');
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-3 border-b border-gray-100">
        <div className="flex justify-between">
          <div>
            <h3 className="font-medium">Order #{order.id}</h3>
            <p className="text-sm text-gray-500">{formattedDate}</p>
          </div>
          {getStatusBadge(order.status)}
        </div>
        <div className="mt-2">
          {order.items.map((item, index) => (
            <div key={index} className="text-sm mt-1">
              {item.quantity}x {item.name || `Product ID: ${item.produceId}`} (₦{item.unitPrice.toLocaleString()} each)
            </div>
          ))}
          <div className="text-primary-600 font-medium mt-2">
            Total: ₦{order.total.toLocaleString()}
          </div>
        </div>
      </div>
      
      {isPending && (
        <div className="flex p-2 bg-gray-50">
          <button
            onClick={handleAccept}
            disabled={isAccepting || isDeclining}
            className="flex-1 text-center py-1 text-green-600 text-sm font-medium"
          >
            {isAccepting ? "Accepting..." : "Accept"}
          </button>
          <div className="border-r border-gray-300"></div>
          <button
            onClick={handleDecline}
            disabled={isAccepting || isDeclining}
            className="flex-1 text-center py-1 text-red-600 text-sm font-medium"
          >
            {isDeclining ? "Declining..." : "Decline"}
          </button>
        </div>
      )}
    </div>
  );
}
