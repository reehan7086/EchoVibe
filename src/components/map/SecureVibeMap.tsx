import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, MessageCircle, UserPlus, Heart, X, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Profile, MapUser } from '../../types';

// Current user hook
const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setCurrentUser(profile);
      }
      setLoading(false);
    };
    getCurrentUser();
  }, []);

  return { currentUser, loading };
};

// Utility functions
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const getActivityEmoji = (mood: string, activity?: string, gender?: string): string => {
  const moodLower = mood?.toLowerCase() || '';
  const activityLower = activity?.toLowerCase() || '';
  
  if (moodLower.includes('coffee') || activityLower.includes('coffee')) return '☕';
  if (moodLower.includes('beach') || activityLower.includes('beach')) return '🏖️';
  if (moodLower.includes('work') || activityLower.includes('work')) return '💼';
  if (moodLower.includes('food') || activityLower.includes('eat')) return '🍽️';
  if (moodLower.includes('gym') || activityLower.includes('fitness')) return '💪';
  if (moodLower.includes('art') || activityLower.includes('art')) return '🎨';
  if (moodLower.includes('music') || activityLower.includes('music')) return '🎵';
  
  return gender === 'female' ? '👩' : '👨';
};

const getStatusFromLastActive = (lastActive: string, isOnline: boolean): 'online' | 'away' | 'offline' => {
  if (!isOnline) return 'offline';
  
  const now = new Date();
  const last = new Date(lastActive);
  const diffMinutes = (now.getTime() - last.getTime()) / (1000 * 60);
  
  if (diffMinutes < 5) return 'online';
  if (diffMinutes < 30) return 'away';
  return 'offline';
};

// Database functions
const fetchNearbyUsers = async (userLat: number, userLng: number, radiusKm: number, currentUserId: string): Promise<MapUser[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .neq('user_id', currentUserId)
      .eq('privacy_level', 'public');

    if (error) return [];

    return (data || [])
      .map(user => {
        const distance = calculateDistance(userLat, userLng, user.latitude!, user.longitude!);
        return {
          ...user,
          distance,
          status: getStatusFromLastActive(user.last_active || new Date().toISOString(), user.is_online || false),
          activity: user.current_mood || 'Just vibing',
          location_name: `${distance.toFixed(1)} km away`
        } as MapUser;
      })
      .filter(user => (user.distance ?? 0) <= radiusKm)
      .filter(user => user.is_online) // Only show online users
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  } catch (error) {
    return [];
  }
};

const updateUserLocation = async (userId: string, lat: number, lng: number): Promise<void> => {
  await supabase
    .from('profiles')
    .update({
      latitude: lat,
      longitude: lng,
      last_active: new Date().toISOString(),
      last_ping: new Date().toISOString(),
      is_online: true
    })
    .eq('user_id', userId);
};

// Map Component
const MapComponent: React.FC<{
  onUserSelect: (user: MapUser) => void;
  radius: number;
  users: MapUser[];
  currentUser: Profile;
}> = ({ onUserSelect, radius, users, currentUser }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const initializeMap = useCallback(() => {
    if (mapRef.current && (window as any).L && !mapInstanceRef.current && currentUser.latitude && currentUser.longitude) {
      const L = (window as any).L;
      
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [currentUser.latitude, currentUser.longitude],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      radiusCircleRef.current = L.circle([currentUser.latitude, currentUser.longitude], {
        radius: radius * 1000,
        color: '#8b5cf6',
        fillColor: '#8b5cf6',
        fillOpacity: 0.1,
        weight: 2,
      }).addTo(mapInstanceRef.current);

      const currentUserIcon = L.divIcon({
        html: `<div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 border-4 border-white rounded-full shadow-xl flex items-center justify-center"><span class="text-lg">🧑‍💻</span></div>`,
        className: 'current-user-marker',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      L.marker([currentUser.latitude, currentUser.longitude], { icon: currentUserIcon })
        .addTo(mapInstanceRef.current);

      setMapLoaded(true);
    }
  }, [currentUser.latitude, currentUser.longitude, radius]);

  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const L = (window as any).L;

    markersRef.current.forEach(marker => mapInstanceRef.current.removeLayer(marker));
    markersRef.current = [];

    users.forEach((user) => {
      if (!user.latitude || !user.longitude) return;

      const emoji = getActivityEmoji(user.current_mood || '', user.activity, user.gender);
      const pinColor = user.gender === 'female' ? 'from-pink-400 to-pink-600' : 'from-blue-400 to-blue-600';
      const statusColor = user.status === 'online' ? 'bg-green-400' : user.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400';
      
      const profileIcon = L.divIcon({
        html: `<div class="relative"><div class="w-10 h-10 bg-gradient-to-r ${pinColor} rounded-full shadow-lg flex items-center justify-center border-2 border-white cursor-pointer hover:scale-110 transition-transform"><span class="text-lg">${emoji}</span></div><div class="absolute -top-1 -right-1 w-4 h-4 ${statusColor} border-2 border-white rounded-full"></div></div>`,
        className: 'profile-marker cursor-pointer',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([user.latitude, user.longitude], { icon: profileIcon })
        .addTo(mapInstanceRef.current);

      marker.on('click', () => onUserSelect(user));

      marker.bindTooltip(`<div class="text-center"><div class="font-bold text-sm">${user.full_name || user.username}</div><div class="text-xs">${(user.distance ?? 0).toFixed(1)} km away</div></div>`, {
        direction: 'top',
        offset: [0, -25],
      });

      markersRef.current.push(marker);
    });
  }, [users, mapLoaded, onUserSelect]);

  useEffect(() => {
    const loadLeaflet = async () => {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
        document.head.appendChild(link);
      }

      if (!(window as any).L) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
        script.onload = initializeMap;
        document.head.appendChild(script);
      } else {
        initializeMap();
      }
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initializeMap]);

  useEffect(() => {
    if (radiusCircleRef.current && currentUser.latitude && currentUser.longitude) {
      radiusCircleRef.current.setRadius(radius * 1000);
    }
  }, [radius, currentUser.latitude, currentUser.longitude]);

  return (
    <div className="relative w-full h-full bg-gray-700 rounded-lg overflow-hidden">
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

// User Profile Modal
const UserProfileCard: React.FC<{
  user: MapUser;
  onClose: () => void;
  onMessage: (user: MapUser) => void;
  currentUser: Profile;
}> = ({ user, onClose, onMessage, currentUser }) => {
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected'>('none');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      const { data } = await supabase
        .from('user_connections')
        .select('status')
        .or(`and(user_id.eq.${currentUser.user_id},connected_user_id.eq.${user.user_id}),and(user_id.eq.${user.user_id},connected_user_id.eq.${currentUser.user_id})`)
        .single();

      if (data) {
        setConnectionStatus(data.status);
      }
    };
    checkConnection();
  }, [currentUser.user_id, user.user_id]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await supabase.from('user_connections').insert({
        user_id: currentUser.user_id,
        connected_user_id: user.user_id,
        status: 'pending'
      });

      await supabase.from('notifications').insert({
        user_id: user.user_id,
        related_user_id: currentUser.user_id,
        type: 'connection_request',
        message: `${currentUser.full_name || currentUser.username} wants to connect`,
        read: false
      });

      setConnectionStatus('pending');
    } catch (error) {
      console.error('Connection error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl mb-3 ${
            user.gender === 'female' ? 'bg-gradient-to-r from-pink-400 to-pink-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'
          }`}>
            {getActivityEmoji(user.current_mood || '', user.activity, user.gender)}
          </div>
          <h3 className="text-xl font-bold text-white">{user.full_name || user.username}</h3>
          <p className="text-gray-400">@{user.username}</p>
          <p className="text-purple-400 text-sm">{user.location_name}</p>
          
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs mt-2 ${
            user.status === 'online' ? 'bg-green-600 text-green-100' : 
            user.status === 'away' ? 'bg-yellow-600 text-yellow-100' : 'bg-gray-600 text-gray-100'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              user.status === 'online' ? 'bg-green-300' : 
              user.status === 'away' ? 'bg-yellow-300' : 'bg-gray-300'
            } animate-pulse`}></div>
            {user.status === 'online' ? 'Online' : user.status === 'away' ? 'Away' : 'Offline'}
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <p className="text-gray-400 text-xs uppercase">Current Mood</p>
            <p className="text-white">{user.current_mood || 'Just vibing'}</p>
          </div>
          {user.bio && (
            <div>
              <p className="text-gray-400 text-xs uppercase">Bio</p>
              <p className="text-white text-sm">{user.bio}</p>
            </div>
          )}
          <div>
            <p className="text-gray-400 text-xs uppercase">Vibe Score</p>
            <p className="text-yellow-300 text-sm">{user.vibe_score || 50}/100</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => onMessage(user)}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl flex items-center justify-center space-x-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat</span>
          </button>
          <button 
            onClick={handleConnect}
            disabled={loading || connectionStatus !== 'none'}
            className={`${
              connectionStatus === 'connected' ? 'bg-green-600' : 
              connectionStatus === 'pending' ? 'bg-yellow-600' : 
              'bg-purple-600 hover:bg-purple-700'
            } text-white py-3 px-4 rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
             connectionStatus === 'connected' ? <Heart className="w-4 h-4 fill-current" /> : 
             <UserPlus className="w-4 h-4" />}
            <span>
              {connectionStatus === 'connected' ? 'Friends' : 
               connectionStatus === 'pending' ? 'Pending' : 
               'Connect'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component - NO BOTTOM NAV (Dashboard handles navigation)
const SecureVibeMap: React.FC = () => {
  const { currentUser, loading: userLoading } = useCurrentUser();
  const [selectedRadius, setSelectedRadius] = useState(5);
  const [nearbyUsers, setNearbyUsers] = useState<MapUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<MapUser | null>(null);
  const [loading, setLoading] = useState(false);

  const loadNearbyUsers = useCallback(async () => {
    if (!currentUser?.latitude || !currentUser?.longitude) return;
    
    setLoading(true);
    const users = await fetchNearbyUsers(
      currentUser.latitude, 
      currentUser.longitude, 
      selectedRadius, 
      currentUser.user_id
    );
    setNearbyUsers(users);
    setLoading(false);
  }, [currentUser, selectedRadius]);

  // Update location periodically
  useEffect(() => {
    if (!currentUser?.user_id) return;

    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            await updateUserLocation(
              currentUser.user_id,
              position.coords.latitude,
              position.coords.longitude
            );
          },
          (error) => console.error('Geolocation error:', error)
        );
      }
    };

    updateLocation();
    const interval = setInterval(updateLocation, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Load users when radius or location changes
  useEffect(() => {
    loadNearbyUsers();
  }, [loadNearbyUsers]);

  // Real-time updates for online status changes
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles' 
        },
        async (payload: any) => {
          const updatedProfile = payload.new as Profile;
          
          // Update user in nearby list if they're in range
          if (currentUser.latitude && currentUser.longitude && updatedProfile.latitude && updatedProfile.longitude) {
            const distance = calculateDistance(
              currentUser.latitude, 
              currentUser.longitude, 
              updatedProfile.latitude, 
              updatedProfile.longitude
            );
            
            if (distance <= selectedRadius && updatedProfile.user_id !== currentUser.user_id && updatedProfile.is_online) {
              const mapUser: MapUser = {
                ...updatedProfile,
                distance,
                status: getStatusFromLastActive(updatedProfile.last_active || new Date().toISOString(), updatedProfile.is_online || false),
                activity: updatedProfile.current_mood || 'Just vibing',
                location_name: `${distance.toFixed(1)} km away`
              };
              
              setNearbyUsers(prev => {
                const existingIndex = prev.findIndex(user => user.user_id === updatedProfile.user_id);
                if (existingIndex >= 0) {
                  const updated = [...prev];
                  updated[existingIndex] = mapUser;
                  return updated.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
                } else {
                  return [...prev, mapUser].sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
                }
              });
            } else if (!updatedProfile.is_online) {
              // Remove offline users
              setNearbyUsers(prev => prev.filter(user => user.user_id !== updatedProfile.user_id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, selectedRadius]);

  if (userLoading) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center text-white">
        <p>Please log in to use SparkVibe Map</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 flex">
      {/* Main Map Area */}
      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Discover Nearby</h1>
          <div className="flex items-center space-x-4">
            <select 
              value={selectedRadius}
              onChange={(e) => setSelectedRadius(Number(e.target.value))}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {[1, 2, 5, 10, 20, 50].map(r => (
                <option key={r} value={r}>{r} km</option>
              ))}
            </select>
            <div className="text-sm text-gray-400">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin inline" />
              ) : (
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  {nearbyUsers.length} users nearby
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1 min-h-0">
          {currentUser.latitude && currentUser.longitude ? (
            <MapComponent 
              onUserSelect={setSelectedUser} 
              radius={selectedRadius} 
              users={nearbyUsers}
              currentUser={currentUser}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-800 rounded-lg">
              <div className="text-center text-white">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400 mb-4">Location access required</p>
                <button 
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        async (position) => {
                          if (currentUser) {
                            await updateUserLocation(
                              currentUser.user_id,
                              position.coords.latitude,
                              position.coords.longitude
                            );
                            window.location.reload();
                          }
                        }
                      );
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Enable Location
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Nearby Users List */}
      <div className="w-80 bg-gray-800 p-4 overflow-y-auto border-l border-gray-700 hidden md:block">
        <h3 className="text-lg font-semibold text-white mb-4">Nearby Users</h3>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : nearbyUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No users nearby</p>
            <p className="text-sm mt-2">Try increasing the radius</p>
          </div>
        ) : (
          <div className="space-y-3">
            {nearbyUsers.map((user) => (
              <div 
                key={user.id} 
                className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-all cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg relative ${
                    user.gender === 'female' 
                      ? 'bg-gradient-to-r from-pink-400 to-pink-600' 
                      : 'bg-gradient-to-r from-blue-400 to-blue-600'
                  } shadow-lg`}>
                    {getActivityEmoji(user.current_mood || '', user.activity, user.gender)}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-700 ${
                      user.status === 'online' ? 'bg-green-400' : 
                      user.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white text-sm truncate">{user.full_name || user.username}</p>
                        <p className="text-xs text-gray-400 truncate">{user.location_name}</p>
                      </div>
                      <span className="text-xs text-gray-400 ml-2">{(user.distance ?? 0).toFixed(1)} km</span>
                    </div>
                    
                    <p className="text-xs text-gray-300 italic truncate mt-1">"{user.current_mood || 'Just vibing'}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfileCard 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)}
          onMessage={(user) => {
            setSelectedUser(null);
            // Emit event or use router to navigate to messages
            console.log('Open chat with:', user);
          }}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default SecureVibeMap;