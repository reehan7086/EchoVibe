// src/components/ui/LocationPicker.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, X, Navigation } from 'lucide-react';
import { geolocationService, type Location } from '@/services/geolocationService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface LocationPickerProps {
  value?: Location | null;
  onChange: (location: Location | null) => void;
  className?: string;
  placeholder?: string;
  showCurrentLocation?: boolean;
  disabled?: boolean;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  className,
  placeholder = "Search for a location...",
  showCurrentLocation = true,
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const { toast } = useToast();

  // Get current location on component mount
  useEffect(() => {
    if (showCurrentLocation) {
      getCurrentLocation();
    }
  }, [showCurrentLocation]);

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const location = await geolocationService.getCurrentPosition();
      const enrichedLocation = await geolocationService.reverseGeocode(
        location.latitude,
        location.longitude
      );
      setCurrentLocation(enrichedLocation);
    } catch (error: any) {
      console.error('Failed to get current location:', error);
      toast({
        title: "Location Error",
        description: error.message || "Could not get your current location",
        variant: "destructive"
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      // Mock search results - replace with real geocoding service
      const mockResults: Location[] = [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          city: "New York",
          country: "United States",
          formatted: "New York, NY, United States"
        },
        {
          latitude: 34.0522,
          longitude: -118.2437,
          city: "Los Angeles",
          country: "United States", 
          formatted: "Los Angeles, CA, United States"
        }
      ].filter(location => 
        location.formatted?.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(mockResults);
      setShowDropdown(mockResults.length > 0);
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for locations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  const selectLocation = (location: Location) => {
    onChange(location);
    setSearchQuery(location.formatted || `${location.latitude}, ${location.longitude}`);
    setShowDropdown(false);
  };

  const clearSelection = () => {
    onChange(null);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const useCurrentLocation = () => {
    if (currentLocation) {
      selectLocation(currentLocation);
    } else {
      getCurrentLocation();
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Current Location Display */}
      {currentLocation?.city && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>Current: {currentLocation.formatted}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-20"
          />
          
          {/* Clear button */}
          {(searchQuery || value) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="absolute right-12 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          )}

          {/* Loading spinner */}
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {searchResults.map((location, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectLocation(location)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-md last:rounded-b-md"
                disabled={disabled}
              >
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{location.formatted}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Current Location Button */}
      {showCurrentLocation && (
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={useCurrentLocation}
            disabled={disabled || isGettingLocation}
            className="flex items-center space-x-2"
          >
            {isGettingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            <span>Use Current Location</span>
          </Button>

          {currentLocation && (
            <Badge variant="secondary" className="text-xs">
              Accuracy: {currentLocation.accuracy?.toFixed(0) || 'Unknown'}m
            </Badge>
          )}
        </div>
      )}

      {/* Selected Location Display */}
      {value && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                {value.formatted || `${value.latitude.toFixed(4)}, ${value.longitude.toFixed(4)}`}
              </p>
              {value.accuracy && (
                <p className="text-xs text-blue-700">
                  Accuracy: {value.accuracy.toFixed(0)}m
                </p>
              )}
            </div>
          </div>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            disabled={disabled}
            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;