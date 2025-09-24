import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { MapPin, Loader2 } from 'lucide-react';

interface Location {
  city?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface LocationPickerProps {
  onLocationSelect?: (location: Location) => Promise<void> | void;
  currentLocation?: Location;
  value?: string;
  placeholder?: string;
}

export function LocationPicker({ 
  onLocationSelect, 
  currentLocation,
  value, 
  placeholder = "Enter location" 
}: LocationPickerProps) {
  const [address, setAddress] = useState(value || currentLocation?.city || '');
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = async () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const location: Location = {
            city: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            coordinates: {
              lat: latitude,
              lng: longitude
            }
          };
          setAddress(location.city || '');
          if (onLocationSelect) {
            await onLocationSelect(location);
          }
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLoading(false);
        }
      );
    } else {
      console.error('Geolocation is not supported');
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder={placeholder}
        className="flex-1"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={getCurrentLocation}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}