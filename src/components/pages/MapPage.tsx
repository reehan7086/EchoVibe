// src/components/pages/MapPage.tsx - Enhanced map experience
import React, { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  Heart, 
  X, 
  Send, 
  UserPlus, 
  MapPin,
  Zap,
  Filter
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { getCurrentUser } from "../../utils";

// Profile type
interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  city?: string;
  mood?: string;
  avatar_url?: string;
  location?: { lat: number; lng: number };
  is_online?: boolean;
  vibe_score?: number;
  bio?: string;
}

// Connection type
interface Connection {
  id: string;
  user1_id: string;
  user2_id: string;
  status: "pending" | "connected";
}

// Message type
interface DbMessage {
  id?: string;
  chat_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at?: string;
}

// Default avatar
const defaultAvatar = "https://via.placeholder.com/40x40/8B5CF6/FFFFFF?text=U";

// Create custom map icons
const createUserIcon = (avatarUrl?: string, mood?: string) => {
  const moodColors: Record<string, string> = {
    happy: '#10B981',
    excited: '#F59E0B',
    peaceful: '#3B82F6',
    thoughtful: '#8B5CF6',
    grateful: '#EC4899',
    creative: '#EF4444'
  };
  
  const color = moodColors[mood || 'happy'] || '#8B5CF6';
  
  return L.divIcon({
    html: `
      <div class="relative">
        <div class="w-12 h-12 rounded-full border-3 border-white shadow-lg overflow-hidden" style="border-color: ${color};">
          <img src="${avatarUrl || defaultAvatar}" class="w-full h-full object-cover" />
        </div>
        <div class="absolute -top-1 -right-1 w-4 h-4 rounded-full" style="background-color: ${color};"></div>
      </div>
    `,
    className: 'vibe-marker',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

const currentUserIcon = L.divIcon({
  html: `
    <div class="relative">
      <div class="w-14 h-14 rounded-full border-4 border-purple-500 bg-gradient-to-r from-purple-500 to-pink-500 shadow-xl flex items-center justify-center">
        <div class="w-3 h-3 bg-white rounded-full animate-pulse"></div>
      </div>
      <div class="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
        <div class="w-2 h-2 bg-white rounded-full"></div>
      </div>
    </div>
  `,
  className: 'current-user-marker',
  iconSize: [56, 56],
  iconAnchor: [28, 28],
});

// Haversine distance calculation
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const MapPage: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number]>([25.276987, 55.296249]); // Dubai default
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [chatPartner, setChatPartner] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<{ senderId: string; content: string; timestamp: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const mapRef = useRef<any>(null);

  const moods = ['happy', 'excited', 'peaceful', 'thoughtful', 'grateful', 'creative'];

  // Compute unique moods from profiles
  const uniqueMoods = useMemo(() => {
    const moods = new Set(profiles.map(p => p.mood).filter(Boolean));
    return Array.from(moods);
  }, [profiles]);

  // Filter profiles (nearby and mood)
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      if (!profile.location || profile.user_id === currentUserId) return false;
      const dist = calculateDistance(userLocation[0], userLocation[1], profile.location.lat, profile.location.lng);
      const isNearby = dist < 10; // 10km radius
      const moodMatch = !selectedMood || profile.mood === selectedMood;
      const isOnline = profile.is_online;
      return isNearby && moodMatch && isOnline;
    });
  }, [profiles, userLocation, selectedMood, currentUserId]);

  // Connected profiles
  const connectedProfiles = useMemo(() => {
    return connections
      .filter(c => c.status === "connected")
      .map(c => {
        const otherId = c.user1_id === currentUserId ? c.user2_id : c.user1_id;
        return profiles.find(p => p.user_id === otherId);
      })
      .filter((p): p is Profile => !!p);
  }, [connections, profiles, currentUserId]);

  // Fetch nearby profiles
  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq('is_online', true);
      
      if (error) throw error;
      
      const profilesWithLocation = (data || [])
        .map(profile => ({
          ...profile,
          location: profile.location ? JSON.parse(profile.location) : null
        }))
        .filter(profile => profile.location);
      
      setProfiles(profilesWithLocation as Profile[]);
    } catch (err) {
      console.error("Error fetching profiles:", err);
    }
  };

  // Get user location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLocation: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(newLocation);
          
          // Update user's location in database
          if (currentUserId) {
            supabase
              .from('profiles')
              .update({ location: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }) })
              .eq('user_id', currentUserId);
          }
        },
        (err) => console.error("Geolocation error:", err)
      );
    }
  };

  // Fetch connections for current user
  const fetchConnections = async (userId: string) => {
    const { data, error } = await supabase
      .from("connections")
      .select("*")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
    if (error) console.error(error);
    else setConnections(data || []);
  };

  // Handle connecting to a user
  const handleConnect = async (profile: Profile) => {
    if (!currentUserId) return alert("User not logged in");
    
    try {
      // Check for existing connection
      const { data: existing } = await supabase
        .from("connections")
        .select("*")
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${profile.user_id}),and(user1_id.eq.${profile.user_id},user2_id.eq.${currentUserId})`);
      
      if (existing && existing.length > 0) {
        if (existing[0].status === 'connected') {
          // Already connected, open chat
          setChatPartner(profile);
          setSelectedUser(null);
          return;
        } else {
          return alert("Connection request already sent");
        }
      }

      // Create connection request
      await supabase.from("connections").insert({
        user1_id: currentUserId,
        user2_id: profile.user_id,
        status: "pending",
      });

      // Create vibe match
      await supabase.from("vibe_matches").insert({
        user1_id: currentUserId,
        user2_id: profile.user_id,
        compatibility_score: Math.random() * 0.5 + 0.5, // Random score between 0.5-1.0
        chat_started: false,
        is_active: true
      });

      alert(`Connection request sent to ${profile.full_name}! 🎉`);
      fetchConnections(currentUserId);
      setShowConnectModal(false);
    } catch (err) {
      console.error("Error connecting:", err);
    }
  };

  // Open chat with a connected user
  const openChat = async (profile: Profile) => {
    if (!currentUserId) return;
    setChatPartner(profile);
    setSelectedUser(null);
    
    // Create chat if doesn't exist
    try {
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${profile.user_id}),and(user1_id.eq.${profile.user_id},user2_id.eq.${currentUserId})`)
        .single();

      if (!existingChat) {
        // Create new chat
        await supabase.from('chats').insert({
          user1_id: currentUserId,
          user2_id: profile.user_id,
          is_active: true
        });
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!chatPartner || !newMessage.trim() || !currentUserId) return;
    
    try {
      // Find or create chat
      let { data: chatData } = await supabase
        .from('chats')
        .select('id')
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${chatPartner.user_id}),and(user1_id.eq.${chatPartner.user_id},user2_id.eq.${currentUserId})`)
        .single();

      if (!chatData) {
        const { data: newChat } = await supabase
          .from('chats')
          .insert({
            user1_id: currentUserId,
            user2_id: chatPartner.user_id,
            is_active: true
          })
          .select('id')
          .single();
        chatData = newChat;
      }

      if (chatData) {
        await supabase.from("messages").insert({
          chat_id: chatData.id,
          sender_id: currentUserId,
          receiver_id: chatPartner.user_id,
          content: newMessage,
          topic: 'general',
          extension: 'text',
          message_type: 'text',
          private: false
        });

        // Add to local messages
        setMessages(prev => [...prev, {
          senderId: currentUserId,
          content: newMessage,
          timestamp: new Date().toISOString()
        }]);
      }

      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Initialize app
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        getCurrentLocation();
        await fetchProfiles();

        const user = await getCurrentUser();
        if (user) {
          setCurrentUserId(user.id);
          await fetchConnections(user.id);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    if (!currentUserId) return;

    // Subscribe to profile changes
    const profileSubscription = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles' 
      }, () => {
        fetchProfiles();
      })
      .subscribe();

    // Subscribe to connection changes
    const connectionSubscription = supabase
      .channel('connections-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'connections',
        filter: `user1_id=eq.${currentUserId},user2_id=eq.${currentUserId}`
      }, () => {
        fetchConnections(currentUserId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
      supabase.removeChannel(connectionSubscription);
    };
  }, [currentUserId]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white">Finding your vibe...</p>
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
          zoom={13} 
          style={{ width: "100%", height: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Current user marker */}
          <Marker position={userLocation} icon={currentUserIcon}>
            <Popup>
              <div className="text-center p-2">
                <div className="text-purple-600 font-bold mb-1">You are here! 📍</div>
                <div className="text-sm text-gray-600">Ready to connect</div>
              </div>
            </Popup>
          </Marker>

          {/* Nearby users */}
          {filteredProfiles.map((profile) => (
            <Marker
              key={profile.id}
              position={[profile.location!.lat, profile.location!.lng]}
              icon={createUserIcon(profile.avatar_url, profile.mood)}
              eventHandlers={{ 
                click: () => setSelectedUser(profile)
              }}
            >
              <Popup>
                <div className="flex flex-col items-center p-2 min-w-[200px]">
                  <img
                    src={profile.avatar_url || defaultAvatar}
                    alt={profile.full_name}
                    className="w-16 h-16 rounded-full mb-2 border-2 border-purple-400"
                  />
                  <h3 className="font-bold text-gray-800">{profile.full_name}</h3>
                  <p className="text-sm text-gray-600">@{profile.username}</p>
                  {profile.city && <p className="text-xs text-gray-500">{profile.city}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm">Mood:</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs capitalize">
                      {profile.mood || 'unknown'}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedUser(profile)}
                    className="mt-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                  >
                    Connect ⚡
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Map Controls */}
        <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4 z-[1000]">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">Filter by mood</span>
          </div>
          <select
            value={selectedMood || ""}
            onChange={(e) => setSelectedMood(e.target.value || null)}
            className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="" className="bg-slate-800">All Moods</option>
            {uniqueMoods.map((mood) => (
              <option key={mood} value={mood} className="bg-slate-800 capitalize">
                {mood}
              </option>
            ))}
          </select>
          
          <div className="mt-3 pt-3 border-t border-white/20">
            <div className="text-white text-xs">
              <div className="flex items-center justify-between">
                <span>Online Users:</span>
                <span className="font-bold">{filteredProfiles.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Connections:</span>
                <span className="font-bold">{connectedProfiles.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar: Connections */}
      <div className="w-80 h-full bg-black/20 backdrop-blur-xl border-l border-white/10 flex flex-col p-4 z-[1000]">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-purple-400" />
          <h2 className="font-bold text-lg text-white">Connections</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3">
          {connectedProfiles.length > 0 ? (
            connectedProfiles.map((profile) => (
              <div
                key={profile.id}
                onClick={() => openChat(profile)}
                className="p-3 bg-white/5 rounded-xl hover:bg-white/10 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={profile.avatar_url || defaultAvatar}
                      alt={profile.full_name}
                      className="w-12 h-12 rounded-full"
                    />
                    {profile.is_online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white group-hover:text-purple-300 transition-colors">
                      {profile.full_name}
                    </h3>
                    <p className="text-sm text-white/60">@{profile.username}</p>
                    {profile.mood && (
                      <span className="inline-block mt-1 px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs capitalize">
                        {profile.mood}
                      </span>
                    )}
                  </div>
                  <MessageCircle className="w-5 h-5 text-white/40 group-hover:text-purple-400 transition-colors" />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 mx-auto mb-4 text-white/20" />
              <p className="text-white/60 text-sm">No connections yet</p>
              <p className="text-white/40 text-xs mt-2">
                Click on map markers to connect with nearby vibers!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* User Profile Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">Connect with {selectedUser.full_name}?</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="text-center mb-6">
                <img
                  src={selectedUser.avatar_url || defaultAvatar}
                  alt={selectedUser.full_name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-purple-400"
                />
                <h4 className="text-lg font-semibold text-white">{selectedUser.full_name}</h4>
                <p className="text-white/60">@{selectedUser.username}</p>
                {selectedUser.bio && (
                  <p className="text-white/80 text-sm mt-2">{selectedUser.bio}</p>
                )}
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span className="text-sm text-white/60">Current mood:</span>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm capitalize">
                    {selectedUser.mood || 'unknown'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
                >
                  Maybe later
                </button>
                <button
                  onClick={() => handleConnect(selectedUser)}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  Connect
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {chatPartner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4"
            onClick={() => setChatPartner(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-2xl max-w-md w-full h-[500px] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img
                    src={chatPartner.avatar_url || defaultAvatar}
                    alt={chatPartner.full_name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold text-white">{chatPartner.full_name}</h3>
                    <p className="text-xs text-white/60">
                      {chatPartner.is_online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setChatPartner(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length > 0 ? (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          message.senderId === currentUserId
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/10 text-white'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-white/20" />
                      <p className="text-white/60">Start the conversation!</p>
                      <p className="text-white/40 text-sm mt-1">Say hello to {chatPartner.full_name}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
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

export default MapPage;