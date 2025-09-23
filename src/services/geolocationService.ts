// src/services/geolocationService.ts

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  city?: string;
  country?: string;
  formatted?: string;
}

export interface GeolocationError {
  code: number;
  message: string;
}

class GeolocationService {
  private watchId: number | null = null;
  private currentPosition: Location | null = null;
  private isWatching = false;

  // Get current position with timeout and fallback
  async getCurrentPosition(options?: PositionOptions): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
        ...options
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          this.currentPosition = location;
          resolve(location);
        },
        (error) => {
          reject(this.handleGeolocationError(error));
        },
        defaultOptions
      );
    });
  }

  // Watch position changes
  watchPosition(
    onSuccess: (location: Location) => void,
    onError: (error: GeolocationError) => void,
    options?: PositionOptions
  ): number | null {
    if (!navigator.geolocation) {
      onError({ code: -1, message: 'Geolocation is not supported' });
      return null;
    }

    if (this.isWatching) {
      this.clearWatch();
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
      ...options
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        this.currentPosition = location;
        this.isWatching = true;
        onSuccess(location);
      },
      (error) => {
        onError(this.handleGeolocationError(error));
      },
      defaultOptions
    );

    return this.watchId;
  }

  // Clear position watch
  clearWatch(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isWatching = false;
    }
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Reverse geocoding (mock implementation - replace with real service)
  async reverseGeocode(latitude: number, longitude: number): Promise<Location> {
    try {
      // Mock implementation - in production, use a real geocoding service
      return {
        latitude,
        longitude,
        city: 'Unknown City',
        country: 'Unknown Country',
        formatted: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      };
    } catch (error) {
      throw new Error('Reverse geocoding failed');
    }
  }

  // Check if geolocation permission is granted
  async checkPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!navigator.permissions) {
      return 'prompt'; // Assume prompt if permissions API not available
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state as 'granted' | 'denied' | 'prompt';
    } catch {
      return 'prompt';
    }
  }

  // Get cached position
  getCachedPosition(): Location | null {
    return this.currentPosition;
  }

  // Check if currently watching position
  isWatchingPosition(): boolean {
    return this.isWatching;
  }

  // Helper methods
  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  private handleGeolocationError(error: GeolocationPositionError): GeolocationError {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return { code: 1, message: 'Geolocation access denied by user.' };
      case error.POSITION_UNAVAILABLE:
        return { code: 2, message: 'Location information is unavailable.' };
      case error.TIMEOUT:
        return { code: 3, message: 'Location request timed out.' };
      default:
        return { code: 0, message: 'An unknown error occurred while retrieving location.' };
    }
  }
}

// Export singleton instance
export const geolocationService = new GeolocationService();
export default geolocationService;