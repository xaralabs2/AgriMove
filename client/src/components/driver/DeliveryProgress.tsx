import { Check, Truck, FlagTriangleRight, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  current: boolean;
  timestamp?: Date;
}

interface DeliveryProgressProps {
  delivery: {
    id: number;
    status: string;
    startTime?: string;
    endTime?: string;
    pickupLocation: string;
    deliveryLocation: string;
    createdAt: string;
    estimatedDeliveryTime?: string;
  };
  onUpdateStatus: (status: string) => void;
}

export default function DeliveryProgress({ delivery, onUpdateStatus }: DeliveryProgressProps) {
  // Create progress steps based on delivery status
  const isStarted = delivery.status === 'in_progress' || delivery.status === 'completed';
  const isCompleted = delivery.status === 'completed';
  
  // Parse timestamps
  const createdAt = new Date(delivery.createdAt);
  const startTime = delivery.startTime ? new Date(delivery.startTime) : null;
  const endTime = delivery.endTime ? new Date(delivery.endTime) : null;
  const estimatedDeliveryTime = delivery.estimatedDeliveryTime 
    ? new Date(delivery.estimatedDeliveryTime) 
    : new Date(createdAt.getTime() + 60 * 60 * 1000); // 1 hour from creation as fallback
  
  const steps: Step[] = [
    {
      id: 'pickup',
      title: 'Picked up from farm',
      description: startTime ? format(startTime, 'h:mm a') : 'Pending',
      icon: <Check className="h-4 w-4" />,
      completed: isStarted,
      current: delivery.status === 'in_progress' && !isCompleted,
      timestamp: startTime || undefined
    },
    {
      id: 'transit',
      title: 'In transit',
      description: isStarted ? 'Current' : 'Waiting',
      icon: <Truck className="h-4 w-4" />,
      completed: isCompleted,
      current: delivery.status === 'in_progress' && !isCompleted,
      timestamp: startTime || undefined
    },
    {
      id: 'delivery',
      title: 'Deliver to customer',
      description: endTime 
        ? format(endTime, 'h:mm a') 
        : `Estimated ${format(estimatedDeliveryTime, 'h:mm a')}`,
      icon: <FlagTriangleRight className="h-4 w-4" />,
      completed: isCompleted,
      current: isCompleted,
      timestamp: endTime || undefined
    }
  ];
  
  const handleUpdateStep = (step: string) => {
    // Map step to delivery status
    if (step === 'pickup' && delivery.status === 'pending') {
      onUpdateStatus('in_progress');
    } else if (step === 'delivery' && delivery.status === 'in_progress') {
      onUpdateStatus('completed');
    }
  };

  return (
    <div className="mt-3">
      {steps.map((step, index) => (
        <div key={step.id}>
          <div 
            className={cn(
              "flex items-center mb-2 cursor-pointer",
              step.current && !step.completed && "opacity-100", 
              !step.completed && !step.current && "opacity-60"
            )}
            onClick={() => handleUpdateStep(step.id)}
          >
            <div 
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                step.completed 
                  ? "bg-primary-500 text-white" 
                  : step.current 
                    ? "bg-primary-500 text-white" 
                    : "bg-gray-200 text-gray-500"
              )}
            >
              {step.icon}
            </div>
            <div className="ml-2 text-sm">
              <div className={cn(
                "font-medium",
                step.current && "text-primary-700"
              )}>
                {step.title}
              </div>
              <div className={cn(
                "text-xs",
                step.completed ? "text-green-600" : "text-gray-500"
              )}>
                {step.description}
              </div>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div className="w-0.5 h-4 bg-gray-300 ml-3"></div>
          )}
        </div>
      ))}
      
      <div className="mt-4 space-y-2">
        <div className="flex items-start">
          <MapPin className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
          <div>
            <div className="text-sm font-medium">Pickup Location</div>
            <div className="text-sm text-gray-600">{delivery.pickupLocation}</div>
          </div>
        </div>
        <div className="flex items-start">
          <MapPin className="h-5 w-5 mr-2 text-primary-500 mt-0.5" />
          <div>
            <div className="text-sm font-medium">Delivery Location</div>
            <div className="text-sm text-gray-600">{delivery.deliveryLocation}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
