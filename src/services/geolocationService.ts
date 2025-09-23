// src/services/geolocationService.ts
import { supabase } from '@/lib/supabase'

export interface Location {
  latitude: number
  longitude: number
  accuracy?: number
  city?: string
  country?: string
}

export interface LocationPermissionStatus {
  granted: boolean
  denied: boolean
  prompt: boolean
}

class GeolocationService {
  private watchId: number | null = null
  private lastKnownLocation: Location | null = null

  // Check if geolocation is supported
  isSupported(): boolean {
    return 'geolocation' in navigator
  }

  // Get current position
  async getCurrentPosition(options?: PositionOptions): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
        ...options
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }

          // Reverse geocode to get city and country
          try {
            const geocodedLocation = await this.reverseGeocode(location)
            Object.assign(location, geocodedLocation)
          } catch (error) {
            console.warn('Reverse geocoding failed:', error)
          }

          this.lastKnownLocation = location
          resolve(location)
        },
        (error) => {
          reject(this.handleGeolocationError(error))
        },
        defaultOptions
      )
    })
  }

  // Watch position changes
  async watchPosition(
    callback: (location: Location) => void,
    errorCallback?: (error: Error) => void,
    options?: PositionOptions
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 600000, // 10 minutes
        ...options
      }

      this.watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }

          // Only reverse geocode if location has changed significantly
          if (!this.lastKnownLocation || 
              this.calculateDistance(this.lastKnownLocation, location) > 1) { // 1km threshold
            try {
              const geocodedLocation = await this.reverseGeocode(location)
              Object.assign(location, geocodedLocation)
            } catch (error) {
              console.warn('Reverse geocoding failed:', error)
            }
          } else {
            // Use cached city/country data
            location.city = this.lastKnownLocation.city
            location.country = this.lastKnownLocation.country
          }

          this.lastKnownLocation = location
          callback(location)
        },
        (error) => {
          const handledError = this.handleGeolocationError(error)
          if (errorCallback) {
            errorCallback(handledError)
          } else {
            console.error('Geolocation error:', handledError)
          }
        },
        defaultOptions
      )

      resolve(this.watchId)
    })
  }

  // Stop watching position
  clearWatch(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
  }

  // Check permission status
  async getPermissionStatus(): Promise<LocationPermissionStatus> {
    if (!('permissions' in navigator)) {
      return { granted: false, denied: false, prompt: true }
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      
      return {
        granted: permission.state === 'granted',
        denied: permission.state === 'denied',
        prompt: permission.state === 'prompt'
      }
    } catch (error) {
      console.warn('Permission query failed:', error)
      return { granted: false, denied: false, prompt: true }
    }
  }

  // Request permission (attempt to get position to trigger permission prompt)
  async requestPermission(): Promise<boolean> {
    try {
      await this.getCurrentPosition({ timeout: 5000 })
      return true
    } catch (error) {
      return false
    }
  }

  // Calculate distance between two points in kilometers
  calculateDistance(point1: Location, point2: Location): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRadians(point2.latitude - point1.latitude)
    const dLon = this.toRadians(point2.longitude - point1.longitude)
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Update user location in database
  async updateUserLocation(userId: string, location: Location): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          location: `POINT(${location.longitude} ${location.latitude})`,
          city: location.city || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating user location:', error)
      throw new Error('Failed to update location')
    }
  }

  // Find nearby users within a radius
  async findNearbyUsers(
    userLocation: Location,
    radiusKm: number = 50,
    excludeUserId?: string
  ): Promise<any[]> {
    try {
      // Using PostGIS ST_DWithin for efficient spatial queries
      let query = supabase
        .from('profiles')
        .select(`
          user_id,
          username,
          full_name,
          avatar_url,
          vibe_score,
          is_online,
          city,
          last_active
        `)
        .eq('is_online', true)
        .gte('last_active', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      if (excludeUserId) {
        query = query.neq('user_id', excludeUserId)
      }

      // Use raw SQL for spatial query
      const { data, error } = await supabase.rpc('find_nearby_profiles', {
        user_lat: userLocation.latitude,
        user_lng: userLocation.longitude,
        radius_km: radiusKm,
        exclude_user_id: excludeUserId || null
      })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error finding nearby users:', error)
      return []
    }
  }

  // Get location suggestions based on partial input
  async getLocationSuggestions(query: string): Promise<any[]> {
    if (query.length < 3) return []

    try {
      // Using a simple geocoding service (in production, use Google Places or similar)
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=YOUR_MAPBOX_TOKEN&types=place,locality&limit=5`
      )
      
      if (!response.ok) throw new Error('Geocoding failed')
      
      const data = await response.json()
      
      return data.features.map((feature: any) => ({
        id: feature.id,
        name: feature.place_name,
        city: feature.text,
        coordinates: {
          longitude: feature.center[0],
          latitude: feature.center[1]
        }
      }))
    } catch (error) {
      console.warn('Location suggestions failed:', error)
      return []
    }
  }

  // Reverse geocode coordinates to get city/country
  private async reverseGeocode(location: Location): Promise<Partial<Location>> {
    try {
      // Using a free geocoding service (in production, consider premium services)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.latitude}&longitude=${location.longitude}&localityLanguage=en`
      )
      
      if (!response.ok) throw new Error('Reverse geocoding failed')
      
      const data = await response.json()
      
      return {
        city: data.city || data.locality || data.principalSubdivision,
        country: data.countryName
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error)
      return {}
    }
  }

  // Handle geolocation errors
  private handleGeolocationError(error: GeolocationPositionError): Error {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return new Error('Location access denied by user')
      case error.POSITION_UNAVAILABLE:
        return new Error('Location information unavailable')
      case error.TIMEOUT:
        return new Error('Location request timed out')
      default:
        return new Error('An unknown location error occurred')
    }
  }

  // Convert degrees to radians
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  // Get cached location
  getCachedLocation(): Location | null {
    return this.lastKnownLocation
  }

  // Clear cached location
  clearCache(): void {
    this.lastKnownLocation = null
  }
}

export const geolocationService = new GeolocationService()

// src/components/ui/location-picker.tsx
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Loader2, X, Navigation } from 'lucide-react'
import { geolocationService, type Location } from '@/services/geolocationService'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface LocationPickerProps {
  onLocationSelect: (location: Location) => void
  currentLocation?: Location | null
  className?: string
  showCurrentLocation?: boolean
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  currentLocation,
  className,
  showCurrentLocation = true
}) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown')
  const { toast } = useToast()

  useEffect(() => {
    checkPermissionStatus()
  }, [])

  useEffect(() => {
    const delayedSearch = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setIsSearching(true)
        try {
          const results = await geolocationService.getLocationSuggestions(searchQuery)
          setSuggestions(results)
        } catch (error) {
          console.error('Location search failed:', error)
          setSuggestions([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setSuggestions([])
      }
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchQuery])

  const checkPermissionStatus = async () => {
    try {
      const status = await geolocationService.getPermissionStatus()
      if (status.granted) setPermissionStatus('granted')
      else if (status.denied) setPermissionStatus('denied')
      else setPermissionStatus('prompt')
    } catch (error) {
      setPermissionStatus('unknown')
    }
  }

  const getCurrentLocation = async () => {
    setIsGettingLocation(true)
    try {
      const location = await geolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      })
      
      onLocationSelect(location)
      setPermissionStatus('granted')
      
      toast({
        title: "Location detected! 📍",
        description: `Found you in ${location.city || 'your area'}`,
      })
    } catch (error: any) {
      console.error('Location error:', error)
      
      if (error.message.includes('denied')) {
        setPermissionStatus('denied')
        toast({
          title: "Location access denied",
          description: "Please enable location access in your browser settings.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Location unavailable",
          description: "Could not get your current location. Try searching for your city.",
          variant: "destructive",
        })
      }
    } finally {
      setIsGettingLocation(false)
    }
  }

  const selectSuggestion = (suggestion: any) => {
    const location: Location = {
      latitude: suggestion.coordinates.latitude,
      longitude: suggestion.coordinates.longitude,
      city: suggestion.city
    }
    
    onLocationSelect(location)
    setSearchQuery('')
    setSuggestions([])
    
    toast({
      title: "Location set! 📍",
      description: `Location set to ${suggestion.name}`,
    })
  }

  const clearLocation = () => {
    onLocationSelect({} as Location)
    setSearchQuery('')
    setSuggestions([])
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Current Location Display */}
      {currentLocation?.city && (
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{currentLocation.city}</span>
            {currentLocation.country && (
              <Badge variant="outline" className="text-xs">
                {currentLocation.country}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={clearLocation}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Location Input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Search for your city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          
          {showCurrentLocation && geolocationService.isSupported() && (
            <Button
              variant="outline"
              onClick={getCurrentLocation}
              disabled={isGettingLocation || permissionStatus === 'denied'}
              className="flex-shrink-0"
            >
              {isGettingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              {permissionStatus === 'denied' ? 'Denied' : 'Use Current'}
            </Button>
          )}
        </div>

        {/* Permission Status */}
        {permissionStatus === 'denied' && (
          <p className="text-xs text-muted-foreground">
            Location access denied. Please enable location permissions in your browser settings.
          </p>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardContent className="p-2">
            <div className="space-y-1">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion.id}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => selectSuggestion(suggestion)}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium text-sm">{suggestion.city}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {suggestion.name}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No suggestions message */}
      {searchQuery.length >= 3 && !isSearching && suggestions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No locations found for "{searchQuery}"
        </p>
      )}
    </div>
  )
}