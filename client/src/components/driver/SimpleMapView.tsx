import { Navigation, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimpleMapViewProps {
  delivery: {
    id: number;
    pickupLocation: string;
    deliveryLocation: string;
    route?: any;
  };
  showNav?: boolean;
}

export default function SimpleMapView({ delivery, showNav = true }: SimpleMapViewProps) {
  const handleGetDirections = () => {
    const origin = encodeURIComponent(delivery.pickupLocation);
    const destination = encodeURIComponent(delivery.deliveryLocation);
    const googleMapsUrl = `https://www.google.com/maps/dir/${origin}/${destination}`;
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <div className="h-64 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border-2 border-dashed border-gray-300">
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Navigation className="h-8 w-8 text-green-600" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Delivery Route</h3>
        
        <div className="space-y-3 text-center w-full max-w-sm">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
            <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <div className="ml-2 text-left flex-1">
              <p className="text-xs text-gray-500">Pickup</p>
              <p className="text-sm font-medium">{delivery.pickupLocation}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="w-px h-6 bg-gray-300"></div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
            <MapPin className="h-4 w-4 text-green-500 flex-shrink-0" />
            <div className="ml-2 text-left flex-1">
              <p className="text-xs text-gray-500">Delivery</p>
              <p className="text-sm font-medium">{delivery.deliveryLocation}</p>
            </div>
          </div>
        </div>
        
        {showNav && (
          <div className="mt-4 space-y-2">
            <Button
              onClick={handleGetDirections}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Get Directions
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}