import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  city?: string;
  country?: string;
}

interface GeolocationState {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  permission: PermissionState | null;
}

export const useGeolocation = (options?: PositionOptions) => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: false,
    error: null,
    permission: null
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Check permission status
  const checkPermission = useCallback(async () => {
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setState(prev => ({ ...prev, permission: result.state }));
        
        result.addEventListener('change', () => {
          setState(prev => ({ ...prev, permission: result.state }));
        });
      } catch (error) {
        console.error('Error checking permission:', error);
      }
    }
  }, []);

  // Get city name from coordinates using reverse geocoding
  const getCityFromCoords = async (lat: number, lon: number): Promise<string | undefined> => {
    try {
      // Using OpenStreetMap's Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
      );
      const data = await response.json();
      
      return data.address?.city || 
             data.address?.town || 
             data.address?.village || 
             data.address?.municipality ||
             data.address?.state;
    } catch (error) {
      console.error('Error getting city name:', error);
      return undefined;
    }
  };

  // Update user's location in database
  const updateUserLocation = useCallback(async (location: LocationData) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          location: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          },
          city: location.city,
          last_active: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }, [user]);

  // Get current position
  const getCurrentPosition = useCallback(async () => {
    if (!navigator.geolocation) {
      setState(prev => ({ 
        ...prev, 
        error: 'Geolocation is not supported by your browser' 
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Get city name
        const city = await getCityFromCoords(latitude, longitude);
        
        const locationData: LocationData = {
          latitude,
          longitude,
          accuracy,
          city
        };

        setState(prev => ({
          ...prev,
          location: locationData,
          loading: false,
          error: null
        }));

        // Update in database
        await updateUserLocation(locationData);
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }

        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));

        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive"
        });
      },
      options || {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [options, updateUserLocation, toast]);

  // Watch position for real-time updates
  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Only get city name if location changed significantly (>1km)
        const prevLocation = state.location;
        let city = prevLocation?.city;
        
        if (!prevLocation || calculateDistance(
          prevLocation.latitude, 
          prevLocation.longitude,
          latitude, 
          longitude
        ) > 1) {
          city = await getCityFromCoords(latitude, longitude);
        }

        const locationData: LocationData = {
          latitude,
          longitude,
          accuracy,
          city
        };

        setState(prev => ({
          ...prev,
          location: locationData,
          error: null
        }));

        await updateUserLocation(locationData);
      },
      (error) => {
        console.error('Watch position error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [state.location, updateUserLocation]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    ...state,
    getCurrentPosition,
    watchPosition,
    requestPermission: getCurrentPosition
  };
};

// Utility function to calculate distance between two points (in km)
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const toRad = (value: number): number => {
  return value * Math.PI / 180;
};

// Hook to find nearby users
export const useNearbyUsers = (radiusKm: number = 10) => {
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { location } = useGeolocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!location || !user) return;

    const fetchNearbyUsers = async () => {
      setLoading(true);
      
      try {
        // First get all users (we'll filter by distance in the frontend)
        // In production, you'd want to use PostGIS functions for efficiency
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('user_id', user.id)
          .eq('is_online', true);

        if (error) throw error;

        // Filter by distance
        const nearby = profiles?.filter(profile => {
          if (!profile.location?.coordinates) return false;
          
          const [lon, lat] = profile.location.coordinates;
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            lat,
            lon
          );
          
          return distance <= radiusKm;
        }).map(profile => ({
          ...profile,
          distance: calculateDistance(
            location.latitude,
            location.longitude,
            profile.location.coordinates[1],
            profile.location.coordinates[0]
          )
        })).sort((a, b) => a.distance - b.distance);

        setNearbyUsers(nearby || []);
      } catch (error) {
        console.error('Error fetching nearby users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyUsers();
  }, [location, user, radiusKm]);

  return { nearbyUsers, loading };
};