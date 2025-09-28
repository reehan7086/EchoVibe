import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, UserPlus, X, Shield, RefreshCw, 
  MapPin, Navigation, Users, Settings, Send, ZoomIn, ZoomOut,
  Heart, Coffee, Music, Gamepad2, Book, Camera
} from "lucide-react";

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface VibeUser {
  id: string;
  username: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  mood: string;
  moodText: string;
  avatar?: string;
  location: { lat: number; lng: number };
  distance: number;
  isOnline: boolean;
  isVerified: boolean;
  bio?: string;
}

const MOOD_OPTIONS = [
  { emoji: "😊", label: "Happy", color: "#FFD700", bg: "from-yellow-400 to-orange-400" },
  { emoji: "😎", label: "Cool", color: "#1E90FF", bg: "from-blue-400 to-cyan-400" },
  { emoji: "❤️", label: "Loving", color: "#FF69B4", bg: "from-pink-400 to-red-400" },
  { emoji: "🎉", label: "Party", color: "#FF6347", bg: "from-purple-400 to-pink-400" },
  { emoji: "😴", label: "Chill", color: "#9370DB", bg: "from-indigo-400 to-purple-400" },
  { emoji: "🤔", label: "Thinking", color: "#32CD32", bg: "from-green-400 to-emerald-400" },
  { emoji: "💪", label: "Energetic", color: "#FF4500", bg: "from-orange-400 to-red-400" },
  { emoji: "🎵", label: "Musical", color: "#20B2AA", bg: "from-teal-400 to-blue-400" },
];

// Create beautiful custom markers
const createVibeMarker = (user: VibeUser, isCurrentUser = false) => {
  const genderColors = {
    male: "#3B82F6",
    female: "#EC4899", 
    other: "#8B5CF6"
  };
  
  const borderColor = genderColors[user.gender];
  const mood = MOOD_OPTIONS.find(m => m.emoji === user.mood) || MOOD_OPTIONS[0];
  
  const size = isCurrentUser ? 24 : 20;
  const pulseAnimation = isCurrentUser ? `
    <div class="absolute inset-0 rounded-full border-4 animate-ping opacity-75" 
         style="border-color: ${borderColor}; animation-duration: 2s;"></div>
    <div class="absolute inset-0 rounded-full bg-gradient-to-r ${mood.bg} opacity-20 animate-pulse"></div>
  ` : '';
  
  const html = `
    <div class="relative group cursor-pointer">
      ${pulseAnimation}
      <div class="w-${size} h-${size} rounded-full border-4 shadow-2xl overflow-hidden relative transform transition-all duration-300 group-hover:scale-125 group-hover:z-50"
           style="border-color: ${borderColor}; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
        ${user.avatar 
          ? `<img src="${user.avatar}" class="w-full h-full object-cover" />`
          : `<div class="w-full h-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br ${mood.bg}">
               ${user.name[0]?.toUpperCase()}
             </div>`
        }
        ${user.isOnline ? `
          <div class="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-3 border-white rounded-full flex items-center justify-center">
            <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        ` : ''}
        ${user.isVerified ? `
          <div class="absolute top-0 right-0 w-6 h-6 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
            <span class="text-white text-xs">✓</span>
          </div>
        ` : ''}
      </div>
      <div class="absolute -bottom-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-sm font-bold shadow-lg bg-gradient-to-r ${mood.bg} text-white whitespace-nowrap">
        ${user.mood} ${user.moodText}
      </div>
      <div class="absolute -top-2 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded-full text-xs font-medium bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity">
        ${user.distance.toFixed(1)}km
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "vibe-marker",
    iconSize: [size * 4, size * 4],
    iconAnchor: [size * 2, size * 2],
  });
};

// Generate mock users around Dubai
const generateMockUsers = (centerLat: number, centerLng: number, count = 20): VibeUser[] => {
  const users: VibeUser[] = [];
  const names = {
    male: ['Ahmed', 'Omar', 'Khalid', 'Saif', 'Rashid', 'Hamad', 'Ali', 'Mohammed'],
    female: ['Fatima', 'Aisha', 'Maryam', 'Noura', 'Sara', 'Layla', 'Amira', 'Zara'],
    other: ['Alex', 'Jordan', 'Riley', 'Casey']
  };
  
  for (let i = 0; i < count; i++) {
    const gender = ['male', 'female', 'other'][Math.floor(Math.random() * 3)] as 'male' | 'female' | 'other';
    const namePool = names[gender];
    const name = namePool[Math.floor(Math.random() * namePool.length)];
    const mood = MOOD_OPTIONS[Math.floor(Math.random() * MOOD_OPTIONS.length)];
    
    // Generate location within 20km radius
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * 0.18; // ~20km in degrees
    const lat = centerLat + radius * Math.cos(angle);
    const lng = centerLng + radius * Math.sin(angle);
    const distance = Math.random() * 20;
    
    users.push({
      id: `user_${i}`,
      username: `${name.toLowerCase()}_${Math.floor(Math.random() * 999)}`,
      name,
      gender,
      age: 18 + Math.floor(Math.random() * 30),
      mood: mood.emoji,
      moodText: mood.label,
      location: { lat, lng },
      distance,
      isOnline: Math.random() > 0.3,
      isVerified: Math.random() > 0.7,
      bio: `Love ${['travel', 'coffee', 'music', 'art', 'tech', 'fitness'][Math.floor(Math.random() * 6)]} in Dubai! ✨`
    });
  }
  
  return users;
};

const SecureVibeMap: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number]>([25.2048, 55.2708]); // Dubai
  const [users, setUsers] = useState<VibeUser[]>([]);
  const [currentUser, setCurrentUser] = useState<VibeUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<VibeUser | null>(null);
  const [interactionRadius, setInteractionRadius] = useState(5);
  const [selectedMood, setSelectedMood] = useState(MOOD_OPTIONS[0]);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<any>(null);

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Create current user profile
          const profile: VibeUser = {
            id: user.id,
            username: user.email?.split('@')[0] || 'me',
            name: user.user_metadata?.full_name || 'Me',
            gender: 'other',
            age: 25,
            mood: selectedMood.emoji,
            moodText: selectedMood.label,
            location: { lat: userLocation[0], lng: userLocation[1] },
            distance: 0,
            isOnline: true,
            isVerified: true,
            bio: 'That\'s me! 🌟'
          };
          setCurrentUser(profile);
        }
        
        // Generate mock users
        const mockUsers = generateMockUsers(userLocation[0], userLocation[1]);
        setUsers(mockUsers);
        
        // Try to get real location
        requestLocation();
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, []);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setLocationGranted(true);
          
          if (currentUser) {
            setCurrentUser({
              ...currentUser,
              location: { lat: latitude, lng: longitude }
            });
          }
          
          // Generate new users around actual location
          const newUsers = generateMockUsers(latitude, longitude);
          setUsers(newUsers);
          
          // Center map on new location
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 13);
          }
        },
        (error) => {
          console.warn('Location access denied, using Dubai as default');
          setLocationGranted(true); // Continue with default location
        }
      );
    } else {
      setLocationGranted(true); // Continue with default location
    }
  };

  const updateMood = (mood: typeof MOOD_OPTIONS[0]) => {
    setSelectedMood(mood);
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        mood: mood.emoji,
        moodText: mood.label
      });
    }
    setShowMoodSelector(false);
  };

  const usersInRadius = users.filter(user => user.distance <= interactionRadius);
  const usersOutsideRadius = users.filter(user => user.distance > interactionRadius);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Loading your vibe map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative">
      {/* Map */}
      <MapContainer 
        center={userLocation} 
        zoom={13}
        style={{ width: "100%", height: "100%" }} 
        ref={mapRef}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        
        <ZoomControl position="bottomright" />
        
        {/* Interaction radius circle */}
        <Circle
          center={userLocation}
          radius={interactionRadius * 1000}
          pathOptions={{
            color: '#8B5CF6',
            fillColor: '#8B5CF6',
            fillOpacity: 0.1,
            weight: 3,
            dashArray: "10, 10"
          }}
        />
        
        {/* Current user marker */}
        {currentUser && (
          <Marker 
            position={[currentUser.location.lat, currentUser.location.lng]} 
            icon={createVibeMarker(currentUser, true)}
          >
            <Popup>
              <div className="text-center p-2">
                <div className="text-lg font-bold">You are here!</div>
                <div className="text-green-600">Online & Discoverable</div>
                <div className="text-xs text-gray-500 mt-1">
                  {usersInRadius.length} vibes in your radius
                </div>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Users in radius */}
        {usersInRadius.map((user) => (
          <Marker
            key={user.id}
            position={[user.location.lat, user.location.lng]}
            icon={createVibeMarker(user)}
            eventHandlers={{
              click: () => setSelectedUser(user)
            }}
          >
            <Popup>
              <div className="max-w-sm p-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-400">
                    {user.avatar ? (
                      <img src={user.avatar} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${MOOD_OPTIONS.find(m => m.emoji === user.mood)?.bg || 'from-purple-400 to-blue-400'}`}>
                        {user.name[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold">{user.name}</div>
                    <div className="text-sm text-gray-600">@{user.username} • {user.age}</div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      {user.isOnline ? 'Online' : 'Offline'}
                      {user.isVerified && <span className="text-blue-500 ml-1">✓</span>}
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="text-lg">{user.mood} {user.moodText}</div>
                  {user.bio && <div className="text-sm text-gray-600 mt-1">{user.bio}</div>}
                </div>
                
                <div className="text-xs text-gray-500 mb-3">
                  {user.distance.toFixed(1)} km away
                </div>
                
                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1">
                    <UserPlus size={14} /> Connect
                  </button>
                  <button className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1">
                    <MessageCircle size={14} /> Chat
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Users outside radius (smaller, faded) */}
        {usersOutsideRadius.map((user) => (
          <Marker
            key={user.id}
            position={[user.location.lat, user.location.lng]}
            icon={createVibeMarker({ ...user, isOnline: false })} // Make them appear offline/faded
            eventHandlers={{
              click: () => setSelectedUser(user)
            }}
          >
            <Popup>
              <div className="text-center p-2">
                <div className="font-bold">{user.name}</div>
                <div className="text-sm text-gray-600">{user.mood} {user.moodText}</div>
                <div className="text-xs text-gray-500">{user.distance.toFixed(1)} km away</div>
                <div className="text-xs text-yellow-600 mt-1">Outside interaction radius</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-3 z-[1000]">
        {/* Mood Selector */}
        <div className="relative">
          <button
            onClick={() => setShowMoodSelector(!showMoodSelector)}
            className="w-16 h-16 bg-black/80 backdrop-blur-xl border-2 border-purple-500 rounded-full flex items-center justify-center text-3xl hover:scale-110 transition-all shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${selectedMood.color}40, ${selectedMood.color}20)` }}
          >
            {selectedMood.emoji}
          </button>
          
          <AnimatePresence>
            {showMoodSelector && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute top-20 right-0 bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl"
              >
                <div className="grid grid-cols-2 gap-3">
                  {MOOD_OPTIONS.map((mood) => (
                    <button
                      key={mood.emoji}
                      onClick={() => updateMood(mood)}
                      className="w-14 h-14 rounded-xl hover:scale-110 transition-all flex items-center justify-center text-2xl border-2"
                      style={{ 
                        backgroundColor: selectedMood.emoji === mood.emoji ? mood.color + '40' : 'transparent',
                        borderColor: selectedMood.emoji === mood.emoji ? mood.color : 'rgba(255,255,255,0.2)'
                      }}
                    >
                      {mood.emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Refresh */}
        <button
          onClick={() => {
            const newUsers = generateMockUsers(userLocation[0], userLocation[1]);
            setUsers(newUsers);
          }}
          className="w-16 h-16 bg-black/80 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-2xl"
        >
          <RefreshCw className="w-6 h-6 text-white" />
        </button>
        
        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className="w-16 h-16 bg-black/80 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-2xl"
        >
          <Settings className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Stats Panel */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <div className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{usersInRadius.length}</div>
              <div className="text-xs text-white/60">In Range</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{users.filter(u => u.isOnline).length}</div>
              <div className="text-xs text-white/60">Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{users.filter(u => u.gender === 'male').length}</div>
              <div className="text-xs text-white/60">Male</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-400">{users.filter(u => u.gender === 'female').length}</div>
              <div className="text-xs text-white/60">Female</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{interactionRadius}</div>
              <div className="text-xs text-white/60">km Range</div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Permission Modal */}
      {!locationGranted && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000]">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-black/90 backdrop-blur-xl rounded-2xl border border-purple-500 p-8 text-center max-w-md mx-4"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Navigation className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Find Your Vibe Tribe</h2>
            <p className="text-white/80 mb-6">
              Allow location access to discover amazing people nearby and join the vibe!
            </p>
            <button
              onClick={requestLocation}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-105"
            >
              <MapPin className="w-5 h-5 inline mr-2" />
              Share My Location
            </button>
            <button
              onClick={() => setLocationGranted(true)}
              className="w-full mt-3 text-white/60 hover:text-white py-2 transition-colors"
            >
              Continue with Dubai location
            </button>
          </motion.div>
        </div>
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Vibe Settings</h3>
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
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      requestLocation();
                      setShowSettings(false);
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                  >
                    <Navigation className="w-4 h-4 inline mr-2" />
                    Update Location
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          border: 2px solid white;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default SecureVibeMap;