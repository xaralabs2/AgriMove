import { useState, useEffect, useCallback } from 'react';
import { locationService, Location, UserLocation } from '@/utils/locationService';
import { useToast } from '@/hooks/use-toast';

interface UseLocationReturn {
  currentLocation: Location | null;
  address: string | null;
  isLoading: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<void>;
  setCustomAddress: (address: string) => Promise<void>;
  nearbyUsers: UserLocation[];
  findNearbyUsers: (users: UserLocation[], maxDistance?: number) => void;
}

export function useLocation(): UseLocationReturn {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<UserLocation[]>([]);
  const { toast } = useToast();

  const getCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);
      
      // Try to get address for the location
      try {
        const addressResult = await locationService.reverseGeocode(location);
        setAddress(addressResult);
      } catch (geocodeError) {
        console.warn('Failed to get address for location:', geocodeError);
        setAddress(location.address || 'Location detected');
      }

      // Only show success toast if we got a real location (not fallback)
      if (location.address && !location.address.includes('default location')) {
        toast({
          title: "Location detected",
          description: "Your current location has been found",
        });
      }
    } catch (err) {
      // Since getCurrentLocation now provides fallbacks, this shouldn't happen
      // But we'll handle it gracefully anyway
      console.warn('Location service error:', err);
      setError('Using default location');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const setCustomAddress = useCallback(async (address: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const location = await locationService.geocodeAddress(address);
      setCurrentLocation(location);
      setAddress(location.address || address);
      
      toast({
        title: "Address set",
        description: `Location set to: ${location.address || address}`,
      });
    } catch (err) {
      console.warn('Address geocoding error:', err);
      // Provide a fallback instead of showing error
      const fallbackLocation = {
        lat: 9.0765,
        lng: 7.3986,
        address: `${address} (approximate location)`
      };
      setCurrentLocation(fallbackLocation);
      setAddress(fallbackLocation.address);
      
      toast({
        title: "Address set",
        description: `Location set to: ${fallbackLocation.address}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const findNearbyUsers = useCallback((users: UserLocation[], maxDistance: number = 50) => {
    if (!currentLocation) {
      setNearbyUsers([]);
      return;
    }

    const nearby = locationService.findNearbyUsers(users, currentLocation, maxDistance);
    setNearbyUsers(nearby);
  }, [currentLocation]);

  // Auto-detect location on first mount
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  return {
    currentLocation,
    address,
    isLoading,
    error,
    getCurrentLocation,
    setCustomAddress,
    nearbyUsers,
    findNearbyUsers,
  };
}