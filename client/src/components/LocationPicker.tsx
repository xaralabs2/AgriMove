import { useState } from 'react';
import { useLocation } from '@/hooks/useLocation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Loader2, Users } from 'lucide-react';
import { UserLocation } from '@/utils/locationService';

interface LocationPickerProps {
  nearbyUsers?: UserLocation[];
  onLocationUpdate?: (location: { lat: number; lng: number; address: string }) => void;
  maxDistance?: number;
  className?: string;
}

export default function LocationPicker({ 
  nearbyUsers = [], 
  onLocationUpdate,
  maxDistance = 50,
  className = ""
}: LocationPickerProps) {
  const { 
    currentLocation, 
    address, 
    isLoading, 
    error, 
    getCurrentLocation, 
    setCustomAddress,
    findNearbyUsers 
  } = useLocation();
  
  const [customAddressInput, setCustomAddressInput] = useState('');
  const [showAddressInput, setShowAddressInput] = useState(false);

  const handleDetectLocation = async () => {
    await getCurrentLocation();
    if (currentLocation && address && onLocationUpdate) {
      onLocationUpdate({
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        address: address
      });
    }
  };

  const handleSetCustomAddress = async () => {
    if (!customAddressInput.trim()) return;
    
    await setCustomAddress(customAddressInput);
    setShowAddressInput(false);
    setCustomAddressInput('');
    
    if (currentLocation && address && onLocationUpdate) {
      onLocationUpdate({
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        address: address
      });
    }
  };

  const handleFindNearby = () => {
    if (nearbyUsers.length > 0) {
      findNearbyUsers(nearbyUsers, maxDistance);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Location Display */}
        <div className="space-y-2">
          {currentLocation && address ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <Navigation className="h-4 w-4" />
                <span className="font-medium">Current Location</span>
              </div>
              <p className="text-sm text-green-700 mt-1">{address}</p>
              {/* Only show coordinates if address doesn't already contain them */}
              {!address.includes(currentLocation.lat.toFixed(4)) && !address.includes('Near') && (
                <p className="text-xs text-green-600 mt-1">
                  {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                </p>
              )}
            </div>
          ) : error ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-600 text-sm">No location detected</p>
            </div>
          )}
        </div>

        {/* Location Actions */}
        <div className="space-y-2">
          <Button 
            onClick={handleDetectLocation}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Detecting Location...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Detect My Location
              </>
            )}
          </Button>

          {!showAddressInput ? (
            <Button 
              onClick={() => setShowAddressInput(true)}
              variant="outline"
              className="w-full"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Set Custom Address
            </Button>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Enter your address..."
                value={customAddressInput}
                onChange={(e) => setCustomAddressInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSetCustomAddress()}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleSetCustomAddress}
                  disabled={!customAddressInput.trim() || isLoading}
                  className="flex-1"
                >
                  Set Address
                </Button>
                <Button 
                  onClick={() => {
                    setShowAddressInput(false);
                    setCustomAddressInput('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Nearby Users Section */}
        {nearbyUsers.length > 0 && currentLocation && (
          <div className="space-y-2">
            <Button 
              onClick={handleFindNearby}
              variant="outline"
              className="w-full"
            >
              <Users className="h-4 w-4 mr-2" />
              Find Nearby ({nearbyUsers.length} total)
            </Button>
          </div>
        )}

        {/* Location Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Your location helps connect you with nearby farmers, buyers, and drivers</p>
          <p>• Location data is used to optimize delivery routes and reduce costs</p>
          <p>• You can change your location anytime</p>
        </div>
      </CardContent>
    </Card>
  );
}