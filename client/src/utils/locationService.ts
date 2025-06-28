// Location service for handling geolocation and Google Maps integration
export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface UserLocation extends Location {
  userId: number;
  role: 'farmer' | 'buyer' | 'transporter';
  name: string;
  distance?: number;
}

class LocationService {
  private static instance: LocationService;
  private currentLocation: Location | null = null;
  private watchId: number | null = null;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  // Get user's current location using browser geolocation
  async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        // Provide fallback location for demo purposes
        const fallbackLocation = {
          lat: 9.0765,
          lng: 7.3986,
          address: 'Abuja, Nigeria'
        };
        this.currentLocation = fallbackLocation;
        resolve(fallbackLocation);
        return;
      }

      const options = {
        enableHighAccuracy: false, // Changed to false for better compatibility
        timeout: 15000, // Increased timeout
        maximumAge: 600000 // 10 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.currentLocation = location;
          resolve(location);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Provide fallback location instead of rejecting
          const fallbackLocation = {
            lat: 9.0765,
            lng: 7.3986,
            address: 'Abuja, Nigeria (default location)'
          };
          this.currentLocation = fallbackLocation;
          resolve(fallbackLocation);
        },
        options
      );
    });
  }

  // Convert address to coordinates using Google Geocoding API
  async geocodeAddress(address: string): Promise<Location> {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return this.getFallbackCoordinates(address);
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          address: result.formatted_address
        };
      } else {
        return this.getFallbackCoordinates(address);
      }
    } catch (error) {
      console.warn('Geocoding failed, using fallback:', error);
      return this.getFallbackCoordinates(address);
    }
  }

  // Provide fallback coordinates for common locations
  private getFallbackCoordinates(address: string): Location {
    const addressLower = address.toLowerCase();
    
    const locations: { [key: string]: Location } = {
      'lagos': { lat: 6.5244, lng: 3.3792, address: 'Lagos, Nigeria' },
      'abuja': { lat: 9.0765, lng: 7.3986, address: 'Abuja, Nigeria' },
      'kano': { lat: 12.0022, lng: 8.5920, address: 'Kano, Nigeria' },
      'ibadan': { lat: 7.3775, lng: 3.9470, address: 'Ibadan, Nigeria' },
      'port harcourt': { lat: 4.8156, lng: 7.0498, address: 'Port Harcourt, Nigeria' },
      'kaduna': { lat: 10.5105, lng: 7.4165, address: 'Kaduna, Nigeria' },
      'benin': { lat: 6.3350, lng: 5.6037, address: 'Benin City, Nigeria' },
      'jos': { lat: 9.8965, lng: 8.8583, address: 'Jos, Nigeria' }
    };

    for (const [city, coords] of Object.entries(locations)) {
      if (addressLower.includes(city)) {
        return coords;
      }
    }

    // Default to Abuja if no match found
    return { lat: 9.0765, lng: 7.3986, address: `${address} (approximate location)` };
  }

  // Convert coordinates to address using Google Reverse Geocoding API
  async reverseGeocode(location: Location): Promise<string> {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      // Provide a descriptive fallback address based on coordinates
      return this.getLocationDescription(location);
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        return this.getLocationDescription(location);
      }
    } catch (error) {
      console.warn('Reverse geocoding failed, using fallback:', error);
      return this.getLocationDescription(location);
    }
  }

  // Provide a descriptive location based on coordinates
  private getLocationDescription(location: Location): string {
    // Check if coordinates are within Nigeria bounds
    if (location.lat >= 4 && location.lat <= 14 && location.lng >= 3 && location.lng <= 15) {
      // Basic city mapping for major Nigerian cities
      const cities = [
        { name: "Lagos", lat: 6.5244, lng: 3.3792 },
        { name: "Abuja", lat: 9.0765, lng: 7.3986 },
        { name: "Kano", lat: 12.0022, lng: 8.5920 },
        { name: "Ibadan", lat: 7.3775, lng: 3.9470 },
        { name: "Port Harcourt", lat: 4.8156, lng: 7.0498 }
      ];

      let closestCity = cities[0];
      let minDistance = this.calculateDistance(location, cities[0]);

      for (const city of cities) {
        const distance = this.calculateDistance(location, city);
        if (distance < minDistance) {
          minDistance = distance;
          closestCity = city;
        }
      }

      return `Near ${closestCity.name}, Nigeria`;
    }

    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  }

  // Calculate distance between two locations in kilometers
  calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(loc2.lat - loc1.lat);
    const dLng = this.toRadians(loc2.lng - loc1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(loc1.lat)) * Math.cos(this.toRadians(loc2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Get current cached location
  getCachedLocation(): Location | null {
    return this.currentLocation;
  }

  // Find nearby users based on location
  findNearbyUsers(users: UserLocation[], currentLocation: Location, maxDistance: number = 50): UserLocation[] {
    return users
      .map(user => ({
        ...user,
        distance: this.calculateDistance(currentLocation, user)
      }))
      .filter(user => user.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  }
}

export const locationService = LocationService.getInstance();