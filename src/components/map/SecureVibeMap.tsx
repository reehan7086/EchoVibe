import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, MessageCircle, UserPlus, Heart, Send, Users, Bell, Settings, X, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Profile, MapUser, ChatRoom, Message } from '../../types';

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

const getStatusFromLastActive = (lastActive: string): 'online' | 'away' | 'offline' => {
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
          status: getStatusFromLastActive(user.last_active || new Date().toISOString()),
          activity: user.current_mood || 'Just vibing',
          location_name: `${distance.toFixed(1)} km away`
        } as MapUser;
      })
      .filter(user => (user.distance ?? 0) <= radiusKm)
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
      last_active: new Date().toISOString()
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
        html: `<div class="relative"><div class="w-10 h-10 bg-gradient-to-r ${pinColor} rounded-full shadow-lg flex items-center justify-center border-2 border-white"><span class="text-lg">${emoji}</span></div><div class="absolute -top-1 -right-1 w-4 h-4 ${statusColor} border-2 border-white rounded-full"></div></div>`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
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
            } text-white py-3 px-4 rounded-xl flex items-center justify-center space-x-2`}
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

// Main Component
const SparkVibeMap: React.FC = () => {
  const { currentUser, loading: userLoading } = useCurrentUser();
  const [currentView, setCurrentView] = useState<'map' | 'chat' | 'friends' | 'notifications' | 'settings'>('map');
  const [selectedRadius, setSelectedRadius] = useState(5);
  const [nearbyUsers, setNearbyUsers] = useState<MapUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<MapUser | null>(null);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
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

  const loadFriendRequests = useCallback(async () => {
    if (!currentUser) return;
    
    const { data } = await supabase
      .from('user_connections')
      .select(`
        *,
        requester:profiles!user_connections_user_id_fkey(*)
      `)
      .eq('connected_user_id', currentUser.user_id)
      .eq('status', 'pending');

    setFriendRequests(data || []);
  }, [currentUser]);

  const loadFriends = useCallback(async () => {
    if (!currentUser) return;
    
    const { data } = await supabase
      .from('user_connections')
      .select(`
        *,
        friend:profiles!user_connections_connected_user_id_fkey(*)
      `)
      .eq('user_id', currentUser.user_id)
      .eq('status', 'connected');

    setFriends(data || []);
  }, [currentUser]);

  const loadNotifications = useCallback(async () => {
    if (!currentUser) return;
    
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.user_id)
      .order('created_at', { ascending: false });

    setNotifications(data || []);
  }, [currentUser]);

  const handleApproveRequest = async (connectionId: string, requesterId: string) => {
    await supabase
      .from('user_connections')
      .update({ status: 'connected' })
      .eq('id', connectionId);

    await supabase.from('user_connections').insert({
      user_id: currentUser!.user_id,
      connected_user_id: requesterId,
      status: 'connected'
    });

    await supabase.from('notifications').insert({
      user_id: requesterId,
      related_user_id: currentUser!.user_id,
      type: 'connection_accepted',
      message: `${currentUser!.full_name || currentUser!.username} accepted your friend request`,
      read: false
    });

    loadFriendRequests();
    loadFriends();
  };

  const handleRejectRequest = async (connectionId: string) => {
    await supabase
      .from('user_connections')
      .delete()
      .eq('id', connectionId);

    loadFriendRequests();
  };

  useEffect(() => {
    if (currentUser?.user_id) {
      const updateLocation = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              await updateUserLocation(
                currentUser.user_id,
                position.coords.latitude,
                position.coords.longitude
              );
            }
          );
        }
      };

      updateLocation();
      const interval = setInterval(updateLocation, 60000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  useEffect(() => {
    loadNearbyUsers();
  }, [loadNearbyUsers]);

  useEffect(() => {
    if (currentView === 'friends') {
      loadFriendRequests();
      loadFriends();
    } else if (currentView === 'notifications') {
      loadNotifications();
    }
  }, [currentView, loadFriendRequests, loadFriends, loadNotifications]);

  if (userLoading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center text-white">
        <p>Please log in to use SparkVibe Map</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'map':
        return (
          <div className="h-full flex flex-col p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white">Discover Nearby</h1>
              <select 
                value={selectedRadius}
                onChange={(e) => setSelectedRadius(Number(e.target.value))}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg"
              >
                {[1, 2, 5, 10, 20, 50].map(r => (
                  <option key={r} value={r}>{r} km</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              {currentUser.latitude && currentUser.longitude ? (
                <MapComponent 
                  onUserSelect={setSelectedUser} 
                  radius={selectedRadius} 
                  users={nearbyUsers}
                  currentUser={currentUser}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-800 rounded-lg">
                  <p className="text-gray-400">Enable location to see nearby users</p>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'chat':
        return (
          <div className="h-full flex items-center justify-center text-white">
            <p className="text-gray-400">Chat feature coming soon</p>
          </div>
        );
      
      case 'friends':
        return (
          <div className="h-full overflow-y-auto p-4">
            <h2 className="text-2xl font-bold text-white mb-6">Friends</h2>
            
            {friendRequests.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Friend Requests</h3>
                <div className="space-y-3">
                  {friendRequests.map((req) => (
                    <div key={req.id} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                          {req.requester.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-white font-semibold">{req.requester.full_name || req.requester.username}</p>
                          <p className="text-gray-400 text-sm">@{req.requester.username}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleApproveRequest(req.id, req.user_id)}
                          className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleRejectRequest(req.id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">My Friends</h3>
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div key={friend.id} className="bg-gray-800 rounded-lg p-4 flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                      {friend.friend.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{friend.friend.full_name || friend.friend.username}</p>
                      <p className="text-gray-400 text-sm">@{friend.friend.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'notifications':
        return (
          <div className="h-full overflow-y-auto p-4">
            <h2 className="text-2xl font-bold text-white mb-6">Notifications</h2>
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div key={notif.id} className="bg-gray-800 rounded-lg p-4">
                  <p className="text-white">{notif.message}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div className="h-full overflow-y-auto p-4">
            <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Profile</h3>
                <p className="text-gray-400">{currentUser.full_name || currentUser.username}</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-3 flex justify-around items-center">
        <button 
          onClick={() => setCurrentView('map')}
          className={`flex flex-col items-center space-y-1 ${currentView === 'map' ? 'text-purple-400' : 'text-gray-400'}`}
        >
          <MapPin className="w-6 h-6" />
          <span className="text-xs">Vibe Map</span>
        </button>
        <button 
          onClick={() => setCurrentView('chat')}
          className={`flex flex-col items-center space-y-1 ${currentView === 'chat' ? 'text-purple-400' : 'text-gray-400'}`}
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-xs">Chat</span>
        </button>
        <button 
          onClick={() => setCurrentView('friends')}
          className={`flex flex-col items-center space-y-1 ${currentView === 'friends' ? 'text-purple-400' : 'text-gray-400'}`}
        >
          <Users className="w-6 h-6" />
          <span className="text-xs">Friends</span>
        </button>
        <button 
          onClick={() => setCurrentView('notifications')}
          className={`flex flex-col items-center space-y-1 ${currentView === 'notifications' ? 'text-purple-400' : 'text-gray-400'}`}
        >
          <Bell className="w-6 h-6" />
          <span className="text-xs">Notifications</span>
        </button>
        <button 
          onClick={() => setCurrentView('settings')}
          className={`flex flex-col items-center space-y-1 ${currentView === 'settings' ? 'text-purple-400' : 'text-gray-400'}`}
        >
          <Settings className="w-6 h-6" />
          <span className="text-xs">Settings</span>
        </button>
      </div>

      {selectedUser && (
        <UserProfileCard 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)}
          onMessage={(user) => {
            setSelectedUser(null);
            setCurrentView('chat');
          }}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default SparkVibeMap;