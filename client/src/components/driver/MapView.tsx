// Initialize Google Maps with API key
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

import { useEffect, useRef, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { optimizeRoute } from '@/utils/mapUtils';
import { Button } from '@/components/ui/button';
import { Loader, Navigation } from 'lucide-react';

interface MapViewProps {
  delivery: {
    id: number;
    pickupLocation: string;
    deliveryLocation: string;
    route?: any;
  };
  showNav?: boolean;
}

export default function MapView({ delivery, showNav = true }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [directions, setDirections] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Google Maps API key is available
    if (!MAPS_API_KEY) {
      setError("Google Maps API key not configured");
      setIsLoading(false);
      return;
    }

    // Initialize map when component mounts
    if (!mapRef.current) return;

    const initMap = () => {
      try {
        if (!window.google || !window.google.maps) {
          setError("Google Maps API not available");
          setIsLoading(false);
          return;
        }

        const mapInstance = new (window as any).google.maps.Map(mapRef.current!, {
          center: { lat: 6.5244, lng: 3.3792 }, // Lagos, Nigeria
          zoom: 12,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        });

        setMap(mapInstance);
        setIsLoading(false);
      } catch (err) {
        console.error("Error initializing map:", err);
        setError("Maps temporarily unavailable");
        setIsLoading(false);
      }
    };

    // For quick development testing, we'll try to initialize immediately
    // but will handle the case where the API is not available
    try {
      initMap();
    } catch (err) {
      console.error("Error during map initialization:", err);

      // If we get here, Google Maps API likely isn't available or has an error
      // Set a timeout to check again in case the script is still loading
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleMaps);
          initMap();
        }
      }, 500);

      // Clear interval after 5 seconds if Google Maps still not loaded
      setTimeout(() => {
        clearInterval(checkGoogleMaps);
        if (!window.google || !window.google.maps) {
          setError("Maps service unavailable");
          setIsLoading(false);
        }
      }, 5000);
    }
  }, [mapRef]);

  useEffect(() => {
    // Load directions when map is ready and delivery data changes
    if (!map || !delivery.pickupLocation || !delivery.deliveryLocation) return;

    const fetchRoute = async () => {
      try {
        setIsLoading(true);

        // If we already have route data from the backend, use that
        if (delivery.route) {
          // Render the route on the map
          renderRoute(delivery.route);
          return;
        }

        // Otherwise, calculate a new route
        const pickupLocations = delivery.pickupLocation.split(';');

        // Use our utility function to optimize the route
        const optimizedRoute = await optimizeRoute(
          pickupLocations,
          delivery.deliveryLocation
        );

        if (optimizedRoute) {
          renderRoute(optimizedRoute);

          // Save the optimized route to the backend
          await apiRequest('PUT', `/api/deliveries/${delivery.id}`, {
            updates: { route: optimizedRoute }
          });
        }
      } catch (err) {
        console.error("Error fetching route:", err);
        setError("Failed to fetch route directions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoute();
  }, [map, delivery]);

  const renderRoute = (routeData: any) => {
    if (!map || !window.google?.maps) return;

    try {
      const directionsService = new (window as any).google.maps.DirectionsService();
      const directionsRenderer = new (window as any).google.maps.DirectionsRenderer({
        map,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#4CAF50',
          strokeWeight: 5,
        }
      });

      const waypoints = routeData.waypoints?.map((wp: any) => ({
        location: wp.location,
        stopover: true,
      })) || [];

      directionsService.route({
        origin: routeData.origins[0],
        destination: routeData.destination,
        waypoints,
        optimizeWaypoints: true,
        travelMode: (window as any).google.maps.TravelMode.DRIVING,
      }, (result: any, status: any) => {
        if (status === (window as any).google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
          setDirections(result);
      } else {
        setError("Failed to get directions");
      }
    });
  };

  const startNavigation = () => {
    if (!directions) return;

    const route = directions.routes[0];
    const legs = route.legs;

    // Get the first leg for starting navigation
    if (legs.length > 0) {
      const startLat = legs[0].start_location.lat();
      const startLng = legs[0].start_location.lng();
      const endLat = legs[legs.length - 1].end_location.lat();
      const endLng = legs[legs.length - 1].end_location.lng();

      // Open Google Maps for navigation
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${endLat},${endLng}&travelmode=driving`,
        '_blank'
      );
    }
  };

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className="h-40 rounded-lg"
        style={{ 
          background: isLoading ? '#E0E0E0' : undefined 
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-gray-600 text-center px-4">
              <div className="mb-2">{error}</div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </div>
        )}
      </div>

      {showNav && directions && (
        <div className="mt-2 text-center">
          <Button 
            onClick={startNavigation}
            className="bg-primary-500 hover:bg-primary-600"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Start Navigation
          </Button>
        </div>
      )}
    </div>
  );
}