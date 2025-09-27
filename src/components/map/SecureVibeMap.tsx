// src/components/map/SecureVibeMap.tsx - Enhanced with beautiful UI and features
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, UserPlus, X, Shield, AlertTriangle, RefreshCw, 
  MapPin, Navigation, Users, Settings, Heart, Star, Coffee,
  Music, Camera, Gamepad2, BookOpen, Dumbbell, Palette
} from "lucide-react";

interface SecureProfile {
  user_id: string;
  username: string;
  full_name: string;
  gender: "male" | "female" | "other";
  age?: number;
  bio?: string;
  avatar_url?: string;
  current_mood?: string;
  mood_message?: string;
  is_online: boolean;
  is_verified: boolean;
  reputation_score: number;
  is_visible: boolean;
  last_active: string;
  location: { lat: number; lng: number };
  distance_km: number;
  privacy_settings?: any;
  security_settings?: any;
}

interface CurrentUserProfile {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  current_mood?: string;
}

const MOOD_OPTIONS = [
  { emoji: "😊", label: "Happy", color: "#FFD700" },
  { emoji: "😎", label: "Cool", color: "#1E90FF" },
  { emoji: "❤️", label: "In Love", color: "#FF69B4" },
  { emoji: "🎉", label: "Excited", color: "#FF6347" },
  { emoji: "😴", label: "Sleepy", color: "#9370DB" },
  { emoji: "🤔", label: "Thoughtful", color: "#32CD32" },
  { emoji: "💪", label: "Motivated", color: "#FF4500" },
  { emoji: "🎵", label: "Musical", color: "#20B2AA" },
];

const ACTIVITY_ICONS = {
  coffee: Coffee,
  music: Music,
  camera: Camera,
  gaming: Gamepad2,
  reading: BookOpen,
  fitness: Dumbbell,
  art: Palette,
};

// Enhanced marker creation with profile pictures and mood indicators
const createEnhancedMarker = (profile: SecureProfile, isCurrentUser = false) => {
  const genderColors = {
    female: "#EC4899",
    male: "#3B82F6", 
    other: "#8B5CF6"
  };
  
  const borderColor = genderColors[profile.gender] || genderColors.other;
  const moodColor = MOOD_OPTIONS.find(m => m.emoji === profile.current_mood)?.color || "#FFD700";
  
  const html = `
    <div class="relative group">
      <!-- Pulse animation for current user -->
      ${isCurrentUser ? `
        <div class="absolute inset-0 rounded-full border-4 animate-ping" 
             style="border-color: #10B981; animation-duration: 2s;"></div>
        <div class="absolute inset-0 rounded-full" 
             style="background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%); animation: pulse 2s infinite;"></div>
      ` : ''}
      
      <!-- Main marker -->
      <div class="w-16 h-16 rounded-full border-4 shadow-xl overflow-hidden relative transform transition-all duration-300 group-hover:scale-110"
           style="border-color: ${borderColor}; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
        ${profile.avatar_url 
          ? `<img src="${profile.avatar_url}" class="w-full h-full object-cover" />`
          : `<div class="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
               style="background: linear-gradient(135deg, ${borderColor}, ${borderColor}cc);">
               ${profile.full_name?.[0]?.toUpperCase() || '?'}
             </div>`
        }
        
        <!-- Online indicator -->
        ${profile.is_online ? `
          <div class="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
        ` : ''}
        
        <!-- Verified badge -->
        ${profile.is_verified ? `
          <div class="absolute top-0 right-0 w-5 h-5 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
            <span class="text-white text-xs">✓</span>
          </div>
        ` : ''}
      </div>
      
      <!-- Mood indicator -->
      <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded-full text-xs font-bold shadow-lg"
           style="background: linear-gradient(135deg, ${moodColor}, ${moodColor}dd); color: white;">
        ${profile.current_mood || '😊'}
      </div>
      
      <!-- Interaction radius indicator when in range -->
      <div class="absolute inset-0 rounded-full border-2 border-dashed opacity-30 animate-pulse"
           style="border-color: ${borderColor}; transform: scale(1.5);"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "vibe-marker",
    iconSize: [80, 80],
    iconAnchor: [40, 40],
  });
};

const SecureVibeMap: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number]>([25.276987, 55.296249]);
  const [profiles, setProfiles] = useState<SecureProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<CurrentUserProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<SecureProfile | null>(null);
  const [interactionRadius, setInteractionRadius] = useState(5);
  const [reportModal, setReportModal] = useState<{ user: SecureProfile; isOpen: boolean } | null>(null);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [selectedMood, setSelectedMood] = useState("😊");
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const mapRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  // Initialize user and location
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          await fetchCurrentUserProfile(user.id);
        }
      } catch (err) {
        console.error("Error initializing:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Fetch current user profile
  const fetchCurrentUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (data) {
        setCurrentUserProfile(data);
        setSelectedMood(data.current_mood || "😊");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  // Request location permission with user gesture
  const requestLocationPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser");
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      setUserLocation([latitude, longitude]);
      setLocationPermissionGranted(true);
      
      // Center map on user location
      if (mapRef.current) {
        mapRef.current.setView([latitude, longitude], 14);
      }

      // Update location in database
      await supabase.rpc('update_user_location', {
        new_lat: latitude,
        new_lng: longitude,
        location_name: 'Current Location'
      });

      // Fetch nearby users after location is set
      fetchNearbyUsers(latitude, longitude);
    } catch (error) {
      console.error("Error getting location:", error);
      alert("Please allow location access to see nearby users");
    }
  }, []);

  // Fetch nearby users
  const fetchNearbyUsers = async (lat?: number, lng?: number) => {
    if (!currentUserId) return;
    
    const [userLat, userLng] = lat && lng ? [lat, lng] : userLocation;
    
    try {
      const { data, error } = await supabase.rpc("get_nearby_users", {
        user_lat: userLat,
        user_lng: userLng,
        radius_km: 10,
      });
      
      if (error) throw error;
      
      if (data && Array.isArray(data)) {
        const profilesData: SecureProfile[] = data.map((u: any) => ({
          user_id: u.user_id,
          username: u.username || 'Unknown',
          full_name: u.full_name || 'Anonymous User',
          gender: u.gender || "other",
          age: u.age || 25,
          bio: u.bio || '',
          avatar_url: u.avatar_url,
          current_mood: u.current_mood || "😊",
          mood_message: u.mood_message || "Just vibing!",
          is_online: u.is_online || false,
          is_verified: u.is_verified || false,
          reputation_score: u.reputation_score || 50,
          is_visible: true,
          last_active: u.last_active || new Date().toISOString(),
          location: { lat: u.lat || 25.276987, lng: u.lng || 55.296249 },
          distance_km: u.distance_km || 0,
          privacy_settings: u.privacy_settings || {},
          security_settings: u.security_settings || {},
        }));
        setProfiles(profilesData);
      }
    } catch (err) {
      console.error("Error fetching nearby users:", err);
    }
  };

  // Update user mood
  const updateMood = async (mood: string) => {
    if (!currentUserId) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ current_mood: mood })
        .eq('user_id', currentUserId);
      
      if (error) throw error;
      
      setSelectedMood(mood);
      setShowMoodSelector(false);
      
      if (currentUserProfile) {
        setCurrentUserProfile({ ...currentUserProfile, current_mood: mood });
      }
    } catch (error) {
      console.error("Error updating mood:", error);
    }
  };

  // Filter profiles in range
  const profilesInRange = useMemo(
    () => profiles.filter((p) => p.distance_km <= interactionRadius),
    [profiles, interactionRadius]
  );

  // Handle user interactions
  const handleSendFriendRequest = async (target: SecureProfile) => {
    try {
      const { error } = await supabase.rpc("send_friend_request", {
        target_user_id: target.user_id,
      });
      if (error) throw error;
      alert(`Friend request sent to ${target.full_name}!`);
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      alert("Failed to send friend request");
    }
  };

  const handleStartChat = async (target: SecureProfile) => {
    // Implementation for starting chat
    alert(`Starting chat with ${target.full_name}... (Feature coming soon!)`);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Loading your vibe map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Map Container */}
      <MapContainer 
        center={userLocation} 
        zoom={14} 
        style={{ width: "100%", height: "100%" }} 
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User's location marker */}
        {locationPermissionGranted && (
          <>
            <Marker position={userLocation} icon={createEnhancedMarker({
              user_id: currentUserId || '',
              username: currentUserProfile?.username || 'You',
              full_name: currentUserProfile?.full_name || 'You',
              gender: 'other',
              avatar_url: currentUserProfile?.avatar_url,
              current_mood: selectedMood,
              is_online: true,
              is_verified: true,
              reputation_score: 100,
              is_visible: true,
              last_active: new Date().toISOString(),
              location: { lat: userLocation[0], lng: userLocation[1] },
              distance_km: 0,
            }, true)}>
              <Popup>
                <div className="font-bold text-center">
                  <div className="text-lg">You are here!</div>
                  <div className="text-sm text-green-600">Online & Discoverable</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {profilesInRange.length} people nearby
                  </div>
                </div>
              </Popup>
            </Marker>
            
            {/* Interaction radius circle */}
            <Circle
              center={userLocation}
              radius={interactionRadius * 1000}
              pathOptions={{
                color: '#8B5CF6',
                fillColor: '#8B5CF6',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: "5, 10"
              }}
            />
          </>
        )}

        {/* Other users markers */}
        {profilesInRange.map((profile) => (
          <Marker
            key={profile.user_id}
            position={[profile.location.lat, profile.location.lng]}
            icon={createEnhancedMarker(profile)}
            eventHandlers={{ click: () => setSelectedUser(profile) }}
          >
            <Popup>
              <div className="max-w-xs">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-400">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold">
                        {profile.full_name[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{profile.full_name}</div>
                    <div className="text-sm text-gray-600">@{profile.username}</div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className={`w-2 h-2 rounded-full ${profile.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      {profile.is_online ? 'Online' : 'Offline'}
                      {profile.is_verified && <span className="text-blue-500">✓</span>}
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-700">Current Vibe:</div>
                  <div className="text-lg">{profile.current_mood} {profile.mood_message}</div>
                </div>
                
                {profile.bio && (
                  <div className="mb-3">
                    <div className="text-sm text-gray-600">{profile.bio}</div>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{profile.distance_km.toFixed(1)} km away</span>
                  <span>Rep: {profile.reputation_score}</span>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleSendFriendRequest(profile)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors"
                  >
                    <UserPlus size={14} /> Connect
                  </button>
                  <button 
                    onClick={() => handleStartChat(profile)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors"
                  >
                    <MessageCircle size={14} /> Chat
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Location permission prompt */}
      {!locationPermissionGranted && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center max-w-md mx-4"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Navigation className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Discover Your Vibe Tribe</h2>
            <p className="text-white/80 mb-6">
              Share your location to find amazing people nearby and start building real connections.
            </p>
            <button
              onClick={requestLocationPermission}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <MapPin className="w-5 h-5" />
              Share My Location
            </button>
            <p className="text-white/50 text-sm mt-4">
              Your location is only shared with nearby users and can be turned off anytime.
            </p>
          </motion.div>
        </div>
      )}

      {/* Control Panel */}
      <div className="absolute top-4 right-4 flex flex-col gap-3 z-40">
        {/* Mood Selector */}
        <div className="relative">
          <button
            onClick={() => setShowMoodSelector(!showMoodSelector)}
            className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-2xl hover:bg-white/20 transition-all shadow-lg"
          >
            {selectedMood}
          </button>
          
          <AnimatePresence>
            {showMoodSelector && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute top-16 right-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-xl"
              >
                <div className="grid grid-cols-2 gap-2">
                  {MOOD_OPTIONS.map((mood) => (
                    <button
                      key={mood.emoji}
                      onClick={() => updateMood(mood.emoji)}
                      className="w-12 h-12 rounded-lg hover:bg-white/20 transition-all flex items-center justify-center text-xl border border-white/10"
                      style={{ backgroundColor: selectedMood === mood.emoji ? mood.color + '40' : 'transparent' }}
                    >
                      {mood.emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => fetchNearbyUsers()}
          className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all shadow-lg"
        >
          <RefreshCw className="w-6 h-6 text-white" />
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all shadow-lg"
        >
          <Settings className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Stats Panel */}
      <div className="absolute bottom-4 left-4 z-40">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 text-white">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{profilesInRange.length}</div>
              <div className="text-xs text-white/60">Nearby</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{profiles.filter(p => p.is_online).length}</div>
              <div className="text-xs text-white/60">Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{interactionRadius}</div>
              <div className="text-xs text-white/60">km Range</div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Map Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Interaction Radius: {interactionRadius} km
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={interactionRadius}
                    onChange={(e) => setInteractionRadius(Number(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={requestLocationPermission}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    Update Location
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SecureVibeMap;