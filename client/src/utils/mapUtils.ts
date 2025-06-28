import { apiRequest } from '@/lib/queryClient';

interface Coordinates {
  lat: number;
  lng: number;
}

interface RoutePoint {
  location: string;
  coordinates?: Coordinates;
}

interface RouteDetails {
  origins: string[];
  destination: string;
  waypoints: Array<{
    location: string;
    stopOrder: number;
  }>;
  eta: Date;
  distance: number;
  duration: number;
  coordinates?: {
    origin: Coordinates;
    destination: Coordinates;
    waypoints: Coordinates[];
  };
}

/**
 * Geocode an address to coordinates using Google Maps Geocoding API
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded');
      return null;
    }
    
    const geocoder = new google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          console.error('Geocoding failed:', status);
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates in kilometers
 * Uses the Haversine formula
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return parseFloat(distance.toFixed(2));
}

/**
 * Calculate ETA based on distance and average speed
 * @param distance - Distance in km
 * @param avgSpeed - Average speed in km/h (default: 30 km/h)
 * @returns ETA in minutes
 */
export function calculateETA(distance: number, avgSpeed: number = 30): number {
  // Convert to minutes
  return Math.round((distance / avgSpeed) * 60);
}

/**
 * Optimize route for delivery
 * @param pickupLocations - Array of pickup locations
 * @param deliveryLocation - Final delivery location
 * @returns Optimized route details
 */
export async function optimizeRoute(
  pickupLocations: string[],
  deliveryLocation: string
): Promise<RouteDetails | null> {
  try {
    // First try to use the backend API for route optimization
    try {
      const response = await apiRequest('POST', '/api/route/optimize', {
        origins: pickupLocations,
        destination: deliveryLocation
      });
      
      const data = await response.json();
      if (data.success && data.route) {
        return data.route;
      }
    } catch (error) {
      console.warn('Backend route optimization failed, using fallback method:', error);
    }
    
    // Fallback method: Use Google Maps Directions service if available
    if (window.google && window.google.maps) {
      return await optimizeWithGoogleMaps(pickupLocations, deliveryLocation);
    }
    
    // Second fallback: Use a simple distance-based algorithm
    return await simpleFallbackOptimization(pickupLocations, deliveryLocation);
  } catch (error) {
    console.error('Route optimization failed:', error);
    return null;
  }
}

/**
 * Optimize route using Google Maps Directions API
 */
async function optimizeWithGoogleMaps(
  pickupLocations: string[],
  deliveryLocation: string
): Promise<RouteDetails | null> {
  return new Promise((resolve, reject) => {
    try {
      if (!window.google || !window.google.maps) {
        console.warn('Google Maps API not available, using fallback method');
        resolve(null);
        return;
      }
      
      const directionsService = new google.maps.DirectionsService();
      
      // Create waypoints from pickup locations (except the first one)
      const waypoints = pickupLocations.slice(1).map(location => ({
        location,
        stopover: true
      }));
      
      directionsService.route({
        origin: pickupLocations[0],
        destination: deliveryLocation,
        waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          // Create route details from the result
          const route = result.routes[0];
          let totalDistance = 0;
          let totalDuration = 0;
          
          // Sum up leg distances and durations
          route.legs.forEach(leg => {
            totalDistance += leg.distance.value;
            totalDuration += leg.duration.value;
          });
          
          // Convert to kilometers and minutes
          totalDistance = parseFloat((totalDistance / 1000).toFixed(2));
          totalDuration = Math.round(totalDuration / 60);
          
          // Create ordered waypoints based on optimized route
          const waypointOrder = route.waypoint_order || [];
          const orderedWaypoints = waypointOrder.map((index, order) => ({
            location: pickupLocations[index + 1], // +1 because the first location is the origin
            stopOrder: order + 1
          }));
          
          // Add the origin as the first stop
          orderedWaypoints.unshift({
            location: pickupLocations[0],
            stopOrder: 0
          });
          
          // Calculate ETA
          const eta = new Date();
          eta.setMinutes(eta.getMinutes() + totalDuration);
          
          resolve({
            origins: pickupLocations,
            destination: deliveryLocation,
            waypoints: orderedWaypoints,
            eta,
            distance: totalDistance,
            duration: totalDuration
          });
        } else {
          console.warn('Directions request failed:', status);
          // Instead of rejecting and causing an error, we'll resolve with null
          // to indicate that the Google Maps method didn't work
          resolve(null);
        }
      });
    } catch (error) {
      console.warn('Error in Google Maps optimization:', error);
      // Instead of rejecting and causing an error, resolve with null
      resolve(null);
    }
  });
}

/**
 * Fallback optimization algorithm using a simple nearest-neighbor approach
 */
async function simpleFallbackOptimization(
  pickupLocations: string[],
  deliveryLocation: string
): Promise<RouteDetails | null> {
  try {
    // For fallback, we'll use a nearest-neighbor approach
    // First, geocode all locations
    const geocodedPickups: RoutePoint[] = [];
    
    for (const location of pickupLocations) {
      const coords = await geocodeAddress(location);
      geocodedPickups.push({
        location,
        coordinates: coords || undefined
      });
    }
    
    const destinationCoords = await geocodeAddress(deliveryLocation);
    
    // If we couldn't geocode any locations, return a simple route
    if (geocodedPickups.every(p => !p.coordinates) || !destinationCoords) {
      // Create a simple route with the original order
      const waypoints = pickupLocations.map((location, index) => ({
        location,
        stopOrder: index
      }));
      
      // Estimate distance and duration
      // For each pickup location, assume 5km and 10 minutes
      const estimatedDistance = pickupLocations.length * 5;
      const estimatedDuration = pickupLocations.length * 10;
      
      // Calculate ETA
      const eta = new Date();
      eta.setMinutes(eta.getMinutes() + estimatedDuration);
      
      return {
        origins: pickupLocations,
        destination: deliveryLocation,
        waypoints,
        eta,
        distance: estimatedDistance,
        duration: estimatedDuration
      };
    }
    
    // Sort pickup locations using nearest-neighbor algorithm
    const sortedPickups: RoutePoint[] = [];
    let remaining = [...geocodedPickups];
    
    // Start with the first location
    let current = remaining.shift();
    sortedPickups.push(current);
    
    // Find the nearest next location
    while (remaining.length > 0) {
      let nearestIndex = -1;
      let nearestDistance = Infinity;
      
      for (let i = 0; i < remaining.length; i++) {
        if (current.coordinates && remaining[i].coordinates) {
          const distance = calculateDistance(current.coordinates, remaining[i].coordinates);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = i;
          }
        }
      }
      
      if (nearestIndex >= 0) {
        current = remaining[nearestIndex];
        sortedPickups.push(current);
        remaining.splice(nearestIndex, 1);
      } else {
        // If no nearest found, just add the next one
        current = remaining.shift();
        sortedPickups.push(current);
      }
    }
    
    // Calculate total distance and duration
    let totalDistance = 0;
    
    // Calculate distance between sorted pickup points
    for (let i = 0; i < sortedPickups.length - 1; i++) {
      if (sortedPickups[i].coordinates && sortedPickups[i+1].coordinates) {
        totalDistance += calculateDistance(
          sortedPickups[i].coordinates, 
          sortedPickups[i+1].coordinates
        );
      } else {
        // If coordinates are missing, estimate 5km per location
        totalDistance += 5;
      }
    }
    
    // Add distance to destination
    if (sortedPickups[sortedPickups.length - 1].coordinates && destinationCoords) {
      totalDistance += calculateDistance(
        sortedPickups[sortedPickups.length - 1].coordinates,
        destinationCoords
      );
    } else {
      totalDistance += 5;
    }
    
    // Round distance to 2 decimal places
    totalDistance = parseFloat(totalDistance.toFixed(2));
    
    // Calculate duration based on distance (assuming 30 km/h average speed)
    const totalDuration = calculateETA(totalDistance);
    
    // Create waypoints from sorted pickups
    const waypoints = sortedPickups.map((point, index) => ({
      location: point.location,
      stopOrder: index
    }));
    
    // Calculate ETA
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + totalDuration);
    
    return {
      origins: sortedPickups.map(p => p.location),
      destination: deliveryLocation,
      waypoints,
      eta,
      distance: totalDistance,
      duration: totalDuration
    };
  } catch (error) {
    console.error('Error in fallback optimization:', error);
    return null;
  }
}

/**
 * Get current location using browser's geolocation API
 */
export function getCurrentLocation(): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      resolve(null);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting current location:', error);
        resolve(null);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}

/**
 * Convert coordinates to address using reverse geocoding
 */
export async function reverseGeocode(coords: Coordinates): Promise<string | null> {
  try {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded');
      return null;
    }
    
    const geocoder = new google.maps.Geocoder();
    
    return new Promise((resolve) => {
      geocoder.geocode({ location: coords }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          console.error('Reverse geocoding failed:', status);
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}
