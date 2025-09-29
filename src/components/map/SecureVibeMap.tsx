import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, MessageCircle, UserPlus, Heart, X, Loader2, Smile, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Profile, MapUser } from '../../types';

// Mood Selection Modal
const MoodSelectionModal: React.FC<{
  onClose: () => void;
  onSave: (mood: string, vibe: string) => void;
  currentMood?: string;
  currentVibe?: string;
}> = ({ onClose, onSave, currentMood = '', currentVibe = '' }) => {
  const [selectedMood, setSelectedMood] = useState(currentMood);
  const [vibeText, setVibeText] = useState(currentVibe);

  const moods = [
    { emoji: '😊', label: 'Happy', color: 'from-yellow-400 to-orange-400' },
    { emoji: '😎', label: 'Chill', color: 'from-blue-400 to-cyan-400' },
    { emoji: '🔥', label: 'Energetic', color: 'from-red-400 to-pink-400' },
    { emoji: '💼', label: 'Working', color: 'from-gray-400 to-slate-400' },
    { emoji: '☕', label: 'Coffee Time', color: 'from-amber-600 to-amber-800' },
    { emoji: '🎵', label: 'Music Vibes', color: 'from-purple-400 to-pink-400' },
    { emoji: '🏖️', label: 'Relaxing', color: 'from-teal-400 to-cyan-400' },
    { emoji: '🍽️', label: 'Foodie', color: 'from-orange-400 to-red-400' },
    { emoji: '💪', label: 'Gym Mode', color: 'from-green-400 to-emerald-400' },
    { emoji: '🎨', label: 'Creative', color: 'from-indigo-400 to-purple-400' },
    { emoji: '🎮', label: 'Gaming', color: 'from-violet-400 to-purple-400' },
    { emoji: '📚', label: 'Reading', color: 'from-emerald-400 to-teal-400' },
  ];

  const handleSave = () => {
    if (selectedMood && vibeText.trim()) {
      onSave(selectedMood, vibeText.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-purple-500/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Set Your Vibe</h3>
              <p className="text-sm text-gray-400">Let others know what you're up to</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Mood Selection */}
          <div>
            <label className="text-white font-medium mb-3 block flex items-center gap-2">
              <Smile className="w-4 h-4" />
              Choose Your Mood
            </label>
            <div className="grid grid-cols-4 gap-3">
              {moods.map((mood) => (
                <button
                  key={mood.label}
                  onClick={() => setSelectedMood(mood.label)}
                  className={`p-3 rounded-xl transition-all transform hover:scale-105 ${
                    selectedMood === mood.label
                      ? `bg-gradient-to-r ${mood.color} shadow-lg scale-105`
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-1">{mood.emoji}</div>
                  <div className={`text-xs font-medium ${
                    selectedMood === mood.label ? 'text-white' : 'text-gray-300'
                  }`}>
                    {mood.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Vibe Text */}
          <div>
            <label className="text-white font-medium mb-2 block">
              What's Your Vibe? <span className="text-gray-400 text-sm">(Keep it short!)</span>
            </label>
            <textarea
              value={vibeText}
              onChange={(e) => setVibeText(e.target.value)}
              maxLength={60}
              placeholder="e.g., Sipping coffee and watching the sunset..."
              className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 resize-none"
              rows={2}
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {vibeText.length}/60 characters
            </div>
          </div>

          {/* Preview */}
          {selectedMood && vibeText && (
            <div className="bg-gray-700/50 rounded-xl p-4 border border-purple-500/20">
              <p className="text-xs text-gray-400 mb-2">Preview:</p>
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  {moods.find(m => m.label === selectedMood)?.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{selectedMood}</p>
                  <p className="text-gray-300 text-sm italic">"{vibeText}"</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedMood || !vibeText.trim()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Save Vibe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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

  return { currentUser, loading, setCurrentUser };
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

const getMoodEmoji = (mood: string): string => {
  const moodMap: { [key: string]: string } = {
    'Happy': '😊',
    'Chill': '😎',
    'Energetic': '🔥',
    'Working': '💼',
    'Coffee Time': '☕',
    'Music Vibes': '🎵',
    'Relaxing': '🏖️',
    'Foodie': '🍽️',
    'Gym Mode': '💪',
    'Creative': '🎨',
    'Gaming': '🎮',
    'Reading': '📚',
  };
  return moodMap[mood] || '✨';
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
          activity: user.mood_message || 'Just vibing',
          location_name: `${distance.toFixed(1)} km away`
        } as MapUser;
      })
      .filter(user => (user.distance ?? 0) <= radiusKm)
      .filter(user => user.is_online)
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

const updateUserMood = async (userId: string, mood: string, vibe: string): Promise<void> => {
  await supabase
    .from('profiles')
    .update({
      current_mood: mood,
      mood_message: vibe,
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

      // Small animated current user marker with vibe popup
      const moodEmoji = getMoodEmoji(currentUser.current_mood || '');
      const vibeMessage = currentUser.mood_message || '';
      
      const currentUserIcon = L.divIcon({
        html: `<div class="relative flex items-center justify-center">
                 <div class="absolute w-8 h-8 bg-purple-500 rounded-full animate-ping opacity-30"></div>
                 <div class="relative w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-600 border-2 border-white rounded-full shadow-xl flex items-center justify-center z-10">
                   <div class="absolute inset-0 rounded-full bg-white opacity-50 animate-pulse"></div>
                 </div>
                 ${vibeMessage ? `
                 <div class="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-2 rounded-xl shadow-2xl whitespace-nowrap animate-bounce-slow border-2 border-white/20 backdrop-blur-sm" style="animation: floatVibe 3s ease-in-out infinite;">
                   <div class="flex items-center gap-2">
                     <span class="text-lg">${moodEmoji}</span>
                     <span class="text-xs font-medium">"${vibeMessage}"</span>
                   </div>
                   <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-pink-600"></div>
                 </div>` : ''}
               </div>`,
        className: 'current-user-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([currentUser.latitude, currentUser.longitude], { icon: currentUserIcon })
        .addTo(mapInstanceRef.current);

      setMapLoaded(true);
    }
  }, [currentUser.latitude, currentUser.longitude, currentUser.current_mood, currentUser.mood_message, radius]);

  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const L = (window as any).L;

    markersRef.current.forEach(marker => mapInstanceRef.current.removeLayer(marker));
    markersRef.current = [];

    users.forEach((user) => {
      if (!user.latitude || !user.longitude) return;
      
      const moodEmoji = getMoodEmoji(user.current_mood || '');
      const vibeMessage = user.mood_message || '';
      const pinColor = user.gender === 'female' ? 'from-pink-400 to-pink-600' : 'from-blue-400 to-blue-600';
      const statusColor = user.status === 'online' ? 'bg-green-400' : user.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400';
      
      const profileIcon = L.divIcon({
        html: `<div class="relative group">
                 <div class="absolute inset-0 bg-gradient-to-r ${pinColor} rounded-full blur-sm opacity-50 scale-110"></div>
                 <div class="relative w-12 h-12 bg-gradient-to-r ${pinColor} rounded-full shadow-2xl flex items-center justify-center border-3 border-white cursor-pointer transform hover:scale-110 transition-all overflow-hidden">
                   ${user.avatar_url ? 
                     `<img src="${user.avatar_url}" class="w-full h-full object-cover" />` :
                     `<span class="text-2xl">${moodEmoji}</span>`
                   }
                 </div>
                 <div class="absolute -bottom-1 -right-1 w-4 h-4 ${statusColor} border-2 border-gray-900 rounded-full shadow-lg"></div>
                 ${vibeMessage ? `
                 <div class="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-gray-900/95 text-white px-3 py-2 rounded-xl shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm border border-purple-500/30 max-w-xs" style="animation: floatVibeHover 2s ease-in-out infinite;">
                   <div class="flex items-center gap-2">
                     <span class="text-base">${moodEmoji}</span>
                     <span class="text-xs font-medium">"${vibeMessage.length > 40 ? vibeMessage.substring(0, 40) + '...' : vibeMessage}"</span>
                   </div>
                   <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95"></div>
                 </div>` : ''}
               </div>`,
        className: 'profile-marker',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      const marker = L.marker([user.latitude, user.longitude], { icon: profileIcon })
        .addTo(mapInstanceRef.current);

      marker.on('click', () => onUserSelect(user));
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
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      const { data } = await supabase
        .from('user_connections')
        .select('status')
        .or(`and(user_id.eq.${currentUser.user_id},connected_user_id.eq.${user.user_id}),and(user_id.eq.${user.user_id},connected_user_id.eq.${currentUser.user_id})`)
        .maybeSingle();

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

  const moodEmoji = getMoodEmoji(user.current_mood || '');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl mb-3 ${
            user.gender === 'female' ? 'bg-gradient-to-r from-pink-400 to-pink-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'
          }`}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name || 'User'} className="w-full h-full rounded-full object-cover" />
            ) : (
              moodEmoji
            )}
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
          {user.current_mood && user.mood_message && (
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-4 border border-purple-500/30">
              <p className="text-gray-400 text-xs uppercase mb-2">Current Vibe</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{moodEmoji}</span>
                <div>
                  <p className="text-white font-medium">{user.current_mood}</p>
                  <p className="text-gray-300 text-sm italic">"{user.mood_message}"</p>
                </div>
              </div>
            </div>
          )}
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
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat</span>
          </button>
          <button 
            onClick={handleConnect}
            disabled={loading || connectionStatus !== 'none'}
            className={`${
              connectionStatus === 'accepted' ? 'bg-green-600' : 
              connectionStatus === 'pending' ? 'bg-yellow-600' : 
              'bg-purple-600 hover:bg-purple-700'
            } text-white py-3 px-4 rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50 transition-colors`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
             connectionStatus === 'accepted' ? <Heart className="w-4 h-4 fill-current" /> : 
             <UserPlus className="w-4 h-4" />}
            <span>
              {connectionStatus === 'accepted' ? 'Friends' : 
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
const SecureVibeMap: React.FC = () => {
  const { currentUser, loading: userLoading, setCurrentUser } = useCurrentUser();
  const [selectedRadius, setSelectedRadius] = useState(5);
  const [nearbyUsers, setNearbyUsers] = useState<MapUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<MapUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);

  // Check if user needs to set mood on mount
  useEffect(() => {
    if (currentUser && !currentUser.current_mood && !currentUser.mood_message) {
      setShowMoodModal(true);
    }
  }, [currentUser]);

  const handleSaveMood = async (mood: string, vibe: string) => {
    if (!currentUser) return;
    
    await updateUserMood(currentUser.user_id, mood, vibe);
    setCurrentUser({ ...currentUser, current_mood: mood, mood_message: vibe });
  };

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

  useEffect(() => {
    loadNearbyUsers();
  }, [loadNearbyUsers]);

  const handleMessageUser = (user: MapUser) => {
    window.dispatchEvent(new CustomEvent('openChat', { detail: { user } }));
  };

  if (userLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center text-white">
        <p>Please log in to use SparkVibe Map</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex bg-gray-900">
      <style>{`
        body, html {
          overflow: hidden;
          margin: 0;
          padding: 0;
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .animate-ping {
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes floatVibe {
          0%, 100% {
            transform: translateY(0px) translateX(-50%);
          }
          50% {
            transform: translateY(-8px) translateX(-50%);
          }
        }
        @keyframes floatVibeHover {
          0%, 100% {
            transform: translateY(0px) translateX(-50%);
          }
          50% {
            transform: translateY(-5px) translateX(-50%);
          }
        }
        .animate-bounce-slow {
          animation: floatVibe 3s ease-in-out infinite;
        }
        .leaflet-container {
          background: #1e293b;
        }
        .leaflet-control-zoom {
          border: none !important;
        }
        .leaflet-control-zoom a {
          background: rgba(255, 255, 255, 0.9) !important;
          backdrop-filter: blur(12px);
          border: none !important;
          border-radius: 8px !important;
          margin-bottom: 4px !important;
        }
      `}</style>

      {/* Mood Modal */}
      {showMoodModal && (
        <MoodSelectionModal
          onClose={() => setShowMoodModal(false)}
          onSave={handleSaveMood}
          currentMood={currentUser.current_mood || ''}
          currentVibe={currentUser.mood_message || ''}
        />
      )}

      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Discover Nearby</h1>
          <div className="flex items-center space-x-4">
            {/* Edit Vibe Button */}
            <button
              onClick={() => setShowMoodModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              <Sparkles className="w-4 h-4" />
              {currentUser.current_mood ? 'Edit Vibe' : 'Set Your Vibe'}
            </button>
            
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
        
        {/* Current User Vibe Display */}
        {currentUser.current_mood && currentUser.mood_message && (
          <div className="mb-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-3 border border-purple-500/30">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getMoodEmoji(currentUser.current_mood)}</span>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{currentUser.current_mood}</p>
                <p className="text-gray-300 text-xs italic">"{currentUser.mood_message}"</p>
              </div>
              <button
                onClick={() => setShowMoodModal(true)}
                className="text-purple-400 hover:text-purple-300 text-xs"
              >
                Change
              </button>
            </div>
          </div>
        )}
        
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
            {nearbyUsers.map((user) => {
              const moodEmoji = getMoodEmoji(user.current_mood || '');
              return (
                <div 
                  key={user.id} 
                  className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-all cursor-pointer"
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg relative overflow-hidden ${
                      user.gender === 'female' 
                        ? 'bg-gradient-to-r from-pink-400 to-pink-600' 
                        : 'bg-gradient-to-r from-blue-400 to-blue-600'
                    } shadow-lg`}>
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.full_name || 'User'} className="w-full h-full object-cover" />
                      ) : (
                        moodEmoji
                      )}
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
                      
                      {user.mood_message && (
                        <div className="mt-2 bg-gray-800/50 rounded-lg px-2 py-1">
                          <p className="text-xs text-gray-300 italic truncate">"{user.mood_message}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedUser && (
        <UserProfileCard 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)}
          onMessage={handleMessageUser}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default SecureVibeMap;