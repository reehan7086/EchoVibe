// src/components/map/SecureVibeMap.tsx - Real Database Integration
import React, { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  UserPlus, 
  X, 
  Send, 
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  Settings,
  Lock,
  Globe,
  Star,
  MapPin,
  Users,
  Zap,
  Filter,
  RefreshCw
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// Enhanced Profile interface matching database
interface SecureProfile {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  gender: 'male' | 'female' | 'other';
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
  privacy_settings: {
    profile_visibility: string;
    show_age: boolean;
    show_real_name: boolean;
    allow_messages: string;
    allow_friend_requests: boolean;
    location_precision: string;
    show_online_status: boolean;
    show_last_seen: boolean;
    auto_decline_after: number;
  };
  security_settings: {
    block_unverified: boolean;
    min_reputation: number;
    auto_hide_reported: boolean;
    safe_mode: boolean;
  };
}

// Security Context
interface SecuritySettings {
  block_unverified: boolean;
  min_reputation: number;
  auto_hide_reported: boolean;
  safe_mode: boolean;
}

// Report reasons
const REPORT_REASONS = [
  'Inappropriate behavior',
  'Harassment',
  'Fake profile',
  'Spam',
  'Other'
];

// Create gender-specific animated markers
const createGenderMarker = (profile: SecureProfile, isInRange: boolean) => {
  const pulseClass = isInRange ? 'animate-pulse' : '';
  const blinkClass = 'animate-blink';
  
  const genderColor = profile.gender === 'female' ? '#EC4899' : 
                     profile.gender === 'male' ? '#3B82F6' : '#8B5CF6';
  
  const genderSymbol = profile.gender === 'female' ? '♀' : 
                      profile.gender === 'male' ? '♂' : '◆';

  return L.divIcon({
    html: `
      <div class="relative ${pulseClass}">
        <div class="w-16 h-16 rounded-full border-3 border-white shadow-lg overflow-hidden ${blinkClass}" 
             style="border-color: ${genderColor}; animation-duration: 2s;">
          ${profile.avatar_url ? 
            `<img src="${profile.avatar_url}" class="w-full h-full object-cover" />` :
            `<div class="w-full h-full flex items-center justify-center text-2xl font-bold text-white" 
                  style="background: ${genderColor};">${genderSymbol}</div>`
          }
        </div>
        <div class="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
             style="background-color: ${genderColor};">
          ${genderSymbol}
        </div>
        ${isInRange ? `
          <div class="absolute inset-0 rounded-full border-2 animate-ping" 
               style="border-color: ${genderColor}; animation-duration: 1.5s;"></div>
        ` : ''}
      </div>
    `,
    className: 'vibe-marker rotating-marker',
    iconSize: [64, 64],
    iconAnchor: [32, 32],
  });
};

const currentUserIcon = L.divIcon({
  html: `
    <div class="relative">
      <div class="w-18 h-18 rounded-full border-4 border-green-500 bg-gradient-to-r from-green-400 to-emerald-500 shadow-xl flex items-center justify-center">
        <div class="w-4 h-4 bg-white rounded-full animate-pulse"></div>
      </div>
      <div class="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
        <div class="w-3 h-3 bg-white rounded-full"></div>
      </div>
    </div>
  `,
  className: 'current-user-marker pulse-glow',
  iconSize: [72, 72],
  iconAnchor: [36, 36],
});

const SecureVibeMap: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number]>([25.276987, 55.296249]);
  const [profiles, setProfiles] = useState<SecureProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<SecureProfile | null>(null);
  const [interactionRadius, setInteractionRadius] = useState(1); // km
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    block_unverified: false,
    min_reputation: 0,
    auto_hide_reported: true,
    safe_mode: true
  });
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [reportModal, setReportModal] = useState<{user: SecureProfile, isOpen: boolean} | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const mapRef = useRef<any>(null);

  // Initialize map and get user location
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          await loadUserSecuritySettings(user.id);
        }
        
        // Request location permission
        await requestLocationPermission();
        
      } catch (error) {
        console.error("Map initialization error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, []);

  // Fetch nearby users when location or radius changes
  useEffect(() => {
    if (userLocation && currentUserId) {
      fetchNearbyUsers();
    }
  }, [userLocation, interactionRadius, currentUserId, securitySettings]);

  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
      setUserLocation(newLocation);
      setLocationPermission('granted');
      
      // Update user location in database
      await updateUserLocation(position.coords.latitude, position.coords.longitude);
      
    } catch (error) {
      console.error('Location permission denied:', error);
      setLocationPermission('denied');
      // Use default Dubai location
    }
  };

  const updateUserLocation = async (lat: number, lng: number) => {
    try {
      const { error } = await supabase.rpc('update_user_location', {
        new_lat: lat,
        new_lng: lng,
        location_name: 'Current Location'
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const loadUserSecuritySettings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('security_settings')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      
      if (data?.security_settings) {
        setSecuritySettings(data.security_settings);
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  };

  const fetchNearbyUsers = async () => {
    if (!userLocation || !currentUserId) return;
    
    try {
      setRefreshing(true);
      
      // Call the database function to get nearby users
      const { data, error } = await supabase.rpc('get_nearby_users', {
        user_lat: userLocation[0],
        user_lng: userLocation[1],
        radius_km: 10 // Maximum 10km range
      });
      
      if (error) throw error;
      
      // Transform database results to match our interface
      const transformedProfiles: SecureProfile[] = (data || []).map((user: any) => ({
        id: user.profile_id || user.id,
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        gender: user.gender || 'other',
        age: user.age,
        bio: user.bio,
        avatar_url: user.avatar_url,
        current_mood: user.current_mood,
        mood_message: user.mood_message || 'Feeling good!',
        is_online: user.is_online,
        is_verified: user.is_verified,
        reputation_score: user.reputation_score,
        is_visible: true, // Already filtered by function
        last_active: user.last_active,
        location: { lat: userLocation[0], lng: userLocation[1] }, // Approximate for privacy
        distance_km: user.distance_km,
        privacy_settings: user.privacy_settings || {
          profile_visibility: 'public',
          show_age: true,
          show_real_name: false,
          allow_messages: 'everyone',
          allow_friend_requests: true,
          location_precision: 'approximate',
          show_online_status: true,
          show_last_seen: true,
          auto_decline_after: 24
        },
        security_settings: user.security_settings || {
          block_unverified: false,
          min_reputation: 0,
          auto_hide_reported: true,
          safe_mode: true
        }
      }));
      
      setProfiles(transformedProfiles);
      
    } catch (error) {
      console.error('Error fetching nearby users:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter profiles based on security settings and proximity
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      // Security filters
      if (securitySettings.block_unverified && !profile.is_verified) return false;
      if (profile.reputation_score < securitySettings.min_reputation) return false;
      if (securitySettings.safe_mode && profile.distance_km > 5) return false; // Extra safety in safe mode
      
      return true;
    });
  }, [profiles, securitySettings]);

  // Get profiles within interaction radius
  const profilesInRange = useMemo(() => {
    return filteredProfiles.filter(profile => {
      return profile.distance_km <= interactionRadius;
    });
  }, [filteredProfiles, interactionRadius]);

  const handleUserClick = (profile: SecureProfile) => {
    if (profile.distance_km <= interactionRadius) {
      setSelectedUser(profile);
    }
  };

  const handleSendFriendRequest = async (targetUser: SecureProfile) => {
    if (!targetUser.privacy_settings.allow_friend_requests) {
      alert("This user doesn't accept friend requests");
      return;
    }
    
    try {
      const { error } = await supabase.rpc('send_friend_request', {
        target_user_id: targetUser.user_id
      });
      
      if (error) throw error;
      
      alert(`Friend request sent to ${targetUser.username}!`);
      setSelectedUser(null);
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      alert(error.message || "Failed to send friend request");
    }
  };

  const handleStartChat = async (targetUser: SecureProfile) => {
    if (targetUser.privacy_settings.allow_messages === 'none') {
      alert("This user doesn't accept messages");
      return;
    }
    
    if (targetUser.privacy_settings.allow_messages === 'connections') {
      alert("You need to be connected to message this user");
      return;
    }
    
    try {
      // Create or find existing chat
      const { data: existingChat, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .contains('participants', [currentUserId, targetUser.user_id])
        .single();
      
      if (chatError && chatError.code !== 'PGRST116') { // Not found error is OK
        throw chatError;
      }
      
      if (existingChat) {
        // Navigate to existing chat
        window.location.href = `/chat/${existingChat.id}`;
      } else {
        // Create new chat
        const { data: newChat, error: createError } = await supabase
          .from('chats')
          .insert({
            participants: [currentUserId, targetUser.user_id],
            chat_type: 'direct',
            user1_id: currentUserId,
            user2_id: targetUser.user_id
          })
          .select('id')
          .single();
        
        if (createError) throw createError;
        
        // Navigate to new chat
        window.location.href = `/chat/${newChat.id}`;
      }
      
      setSelectedUser(null);
    } catch (error) {
      console.error("Error starting chat:", error);
      alert("Failed to start chat");
    }
  };

  const handleReportUser = async () => {
    if (!reportModal || !reportReason) return;
    
    try {
      const finalReason = reportReason === 'Other' ? customReason : reportReason;
      
      const { error } = await supabase
        .from('user_reports')
        .insert({
          reporter_id: currentUserId,
          reported_user_id: reportModal.user.user_id,
          reason: finalReason,
          description: reportReason === 'Other' ? customReason : null
        });
      
      if (error) throw error;
      
      alert("User reported successfully. Our team will review this.");
      setReportModal(null);
      setSelectedUser(null);
      setReportReason('');
      setCustomReason('');
    } catch (error) {
      console.error("Error reporting user:", error);
      alert("Failed to submit report");
    }
  };

  const updateSecuritySettings = async (newSettings: Partial<SecuritySettings>) => {
    const updatedSettings = { ...securitySettings, ...newSettings };
    setSecuritySettings(updatedSettings);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ security_settings: updatedSettings })
        .eq('user_id', currentUserId);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error updating security settings:", error);
    }
  };

  const refreshData = async () => {
    await fetchNearbyUsers();
    if (locationPermission === 'granted') {
      await requestLocationPermission();
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white">Loading your secure vibe map...</p>
          {locationPermission === 'prompt' && (
            <p className="text-white/60 text-sm mt-2">Requesting location permission...</p>
          )}
        </div>
      </div>
    );
  }

  if (locationPermission === 'denied') {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Location Required</h2>
          <p className="text-white/70 mb-6">
            SecureVibeMap needs your location to show nearby users. Please enable location permissions in your browser settings.
          </p>
          <button
            onClick={requestLocationPermission}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex relative">
      {/* Map Container */}
      <div className="flex-1 h-full relative">
        <MapContainer 
          center={userLocation} 
          zoom={15} 
          style={{ width: "100%", height: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Interaction radius circle */}
          <Circle
            center={userLocation}
            radius={interactionRadius * 1000}
            fillColor="purple"
            fillOpacity={0.1}
            color="purple"
            weight={2}
            dashArray="5, 5"
          />

          {/* Current user marker */}
          <Marker position={userLocation} icon={currentUserIcon}>
            <Popup>
              <div className="text-center p-2">
                <div className="text-green-600 font-bold mb-1">You are here!</div>
                <div className="text-sm text-gray-600">Interaction radius: {interactionRadius}km</div>
              </div>
            </Popup>
          </Marker>

          {/* Other users */}
          {filteredProfiles.map((profile) => {
            const isInRange = profilesInRange.some(p => p.id === profile.id);
            // Add some randomness to location for privacy
            const randomLat = userLocation[0] + (Math.random() - 0.5) * 0.01;
            const randomLng = userLocation[1] + (Math.random() - 0.5) * 0.01;
            
            return (
              <Marker
                key={profile.id}
                position={[randomLat, randomLng]}
                icon={createGenderMarker(profile, isInRange)}
                eventHandlers={{ 
                  click: () => handleUserClick(profile)
                }}
              >
                <Popup>
                  <div className="text-center p-2 min-w-[200px]">
                    <div className="flex items-center justify-center mb-2">
                      {profile.is_verified && (
                        <Shield className="w-4 h-4 text-blue-500 mr-1" />
                      )}
                      <h3 className="font-bold text-gray-800">
                        {profile.privacy_settings.show_real_name ? profile.full_name : profile.username}
                      </h3>
                    </div>
                    <p className="text-sm text-purple-600 font-medium mb-1">
                      {profile.mood_message}
                    </p>
                    {profile.privacy_settings.show_age && profile.age && (
                      <p className="text-xs text-gray-500">Age: {profile.age}</p>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      Distance: {profile.distance_km.toFixed(1)}km | Rep: {profile.reputation_score}%
                    </div>
                    {isInRange && (
                      <div className="mt-2">
                        <button
                          onClick={() => setSelectedUser(profile)}
                          className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                        >
                          Interact
                        </button>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Overlay Controls */}
        <div className="absolute top-4 left-4 z-[1000] space-y-2">
          <button
            onClick={() => setShowSecurityModal(true)}
            className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Settings className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium">Security</span>
          </button>
          <button
            onClick={refreshData}
            className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>

        {/* Radius Slider */}
        <div className="absolute top-24 left-4 z-[1000] bg-white rounded-xl shadow-lg p-4 w-48">
          <label className="text-sm font-medium block mb-2">Interaction Radius (km)</label>
          <input 
            type="range" 
            min="0.1" 
            max={securitySettings.safe_mode ? "5" : "10"}
            step="0.1" 
            value={interactionRadius}
            onChange={(e) => setInteractionRadius(parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-sm text-gray-600 block mt-1">{interactionRadius.toFixed(1)} km</span>
        </div>

        {/* Stats Display */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-xl shadow-lg px-6 py-3 flex gap-8">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium">{filteredProfiles.length} nearby</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium">{profilesInRange.length} in range</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium">Radius: {interactionRadius.toFixed(1)}km</span>
          </div>
        </div>

        {/* Selected User Modal */}
        <AnimatePresence>
          {selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center"
              onClick={() => setSelectedUser(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    {selectedUser.privacy_settings.show_real_name ? selectedUser.full_name : selectedUser.username}
                  </h2>
                  <button onClick={() => setSelectedUser(null)}>
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
                <div className="flex gap-4 mb-4">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500">
                      {selectedUser.username[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    {selectedUser.bio && <p className="text-gray-600 mb-2">{selectedUser.bio}</p>}
                    {selectedUser.current_mood && (
                      <p className="text-sm text-purple-600">Mood: {selectedUser.current_mood}</p>
                    )}
                    <p className="text-sm text-gray-500">Reputation: {selectedUser.reputation_score}</p>
                    {selectedUser.privacy_settings.show_online_status && (
                      <p className="text-sm text-gray-500">
                        {selectedUser.is_online ? 'Online' : `Last active: ${new Date(selectedUser.last_active).toLocaleTimeString()}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStartChat(selectedUser)}
                    className="flex-1 py-2 bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" /> Chat
                  </button>
                  <button
                    onClick={() => handleSendFriendRequest(selectedUser)}
                    className="flex-1 py-2 bg-green-500 text-white rounded-lg flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" /> Friend
                  </button>
                  <button
                    onClick={() => setReportModal({ user: selectedUser, isOpen: true })}
                    className="py-2 px-4 bg-red-500 text-white rounded-lg flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" /> Report
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security Settings Modal */}
        <AnimatePresence>
          {showSecurityModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center"
              onClick={() => setShowSecurityModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Security Settings</h2>
                  <button onClick={() => setShowSecurityModal(false)}>
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={securitySettings.block_unverified}
                      onChange={(e) => updateSecuritySettings({ block_unverified: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Block unverified users</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={securitySettings.auto_hide_reported}
                      onChange={(e) => updateSecuritySettings({ auto_hide_reported: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Auto hide reported users</span>
                  </label>
                  <div>
                    <label className="text-sm block mb-1">Minimum reputation score</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={securitySettings.min_reputation}
                      onChange={(e) => updateSecuritySettings({ min_reputation: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg p-2"
                    />
                  </div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={securitySettings.safe_mode}
                      onChange={(e) => updateSecuritySettings({ safe_mode: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Safe mode (limit to 5km)</span>
                  </label>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report Modal */}
        <AnimatePresence>
          {reportModal?.isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center"
              onClick={() => setReportModal(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Report {reportModal.user.username}</h2>
                  <button onClick={() => setReportModal(null)}>
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
                <div className="space-y-4">
                  {REPORT_REASONS.map((reason) => (
                    <label key={reason} className="flex items-center gap-3">
                      <input
                        type="radio"
                        value={reason}
                        checked={reportReason === reason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{reason}</span>
                    </label>
                  ))}
                  {reportReason === 'Other' && (
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Please describe the issue..."
                      className="w-full border border-gray-300 rounded-lg p-2 h-24"
                    />
                  )}
                  <button
                    onClick={handleReportUser}
                    disabled={!reportReason || (reportReason === 'Other' && !customReason)}
                    className="w-full py-2 bg-red-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Report
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SecureVibeMap;