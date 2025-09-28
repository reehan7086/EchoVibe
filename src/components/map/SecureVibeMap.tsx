import React, { useState, useEffect, useRef } from 'react';
import { MapPin, MessageCircle, UserPlus, Heart, ArrowLeft, Send, Phone, Video } from 'lucide-react';

// TypeScript interfaces
interface Profile {
  id: number;
  name: string;
  age: number;
  gender: 'female' | 'male';
  country: string;
  location: string;
  status: 'online' | 'away' | 'offline';
  mood: string;
  vibe: string;
  lat: number;
  lng: number;
  avatar: string;
  bio: string;
  lastSeen?: string;
  distance?: string;
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  message: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

// Current user (logged in)
const currentUser: Profile = {
  id: 0,
  name: "You",
  age: 25,
  gender: "male",
  country: "🇦🇪 UAE",
  location: "Dubai",
  status: "online",
  mood: "Ready to connect! ✨",
  vibe: "Looking for new friends nearby!",
  lat: 25.2048,
  lng: 55.2708,
  avatar: "🧑‍💻",
  bio: "Tech enthusiast exploring Dubai"
};

// Mock users near Dubai (within 5km radius)
const mockProfiles: Profile[] = [
  {
    id: 1,
    name: "Aisha Al-Mansouri",
    age: 24,
    gender: "female",
    country: "🇦🇪 UAE",
    location: "Dubai Marina",
    status: "online",
    mood: "Coffee & sunset vibes ☕🌅",
    vibe: "Perfect evening at Marina Walk!",
    lat: 25.0657,
    lng: 55.1713,
    avatar: "👩‍🎨",
    bio: "Local artist, love showing visitors around Dubai's hidden gems",
    distance: "2.1 km"
  },
  {
    id: 2,
    name: "Carlos Mendez",
    age: 28,
    gender: "male",
    country: "🇪🇸 Spain",
    location: "Business Bay",
    status: "online",
    mood: "Working remotely 💻",
    vibe: "Best coworking space in Dubai!",
    lat: 25.1875,
    lng: 55.2644,
    avatar: "👨‍💼",
    bio: "Spanish expat, software developer. Love exploring new cafes!",
    distance: "1.8 km"
  },
  {
    id: 3,
    name: "Priya Nair",
    age: 26,
    gender: "female",
    country: "🇮🇳 India",
    location: "Bur Dubai",
    status: "away",
    mood: "Shopping at Gold Souk 💰",
    vibe: "Traditional markets are amazing!",
    lat: 25.2677,
    lng: 55.2962,
    avatar: "👩‍🎓",
    bio: "UX Designer, foodie, love Dubai's culture mix",
    lastSeen: "5 min ago",
    distance: "3.2 km"
  },
  {
    id: 4,
    name: "Ahmed Al-Rashid",
    age: 29,
    gender: "male",
    country: "🇦🇪 UAE",
    location: "Downtown Dubai",
    status: "online",
    mood: "Burj Khalifa views 🏗️",
    vibe: "Dubai Mall, then fountain show!",
    lat: 25.1972,
    lng: 55.2744,
    avatar: "👨‍🏫",
    bio: "Local guide, photographer. Born and raised in Dubai!",
    distance: "1.2 km"
  },
  {
    id: 5,
    name: "Emma Wilson",
    age: 23,
    gender: "female",
    country: "🇬🇧 UK",
    location: "JBR Beach",
    status: "online",
    mood: "Beach day! 🏖️",
    vibe: "Perfect weather for volleyball!",
    lat: 25.0707,
    lng: 55.1396,
    avatar: "👩‍🏄",
    bio: "Travel blogger, beach lover, here for 3 months",
    distance: "4.1 km"
  },
  {
    id: 6,
    name: "Hassan Ali",
    age: 31,
    gender: "male",
    country: "🇦🇪 UAE",
    location: "DIFC",
    status: "away",
    mood: "Finance district hustle 💼",
    vibe: "Networking event tonight!",
    lat: 25.2138,
    lng: 55.2824,
    avatar: "👨‍💻",
    bio: "Finance professional, gym enthusiast, coffee addict",
    lastSeen: "12 min ago",
    distance: "2.7 km"
  },
  {
    id: 7,
    name: "Fatima Al-Zahra",
    age: 22,
    gender: "female",
    country: "🇦🇪 UAE",
    location: "City Walk",
    status: "online",
    mood: "Art & food exploring 🎨",
    vibe: "Best street art in Dubai!",
    lat: 25.2285,
    lng: 55.2607,
    avatar: "👩‍🎨",
    bio: "Art student, instagram photographer, local foodie",
    distance: "1.5 km"
  },
  {
    id: 8,
    name: "Mike Chen",
    age: 27,
    gender: "male",
    country: "🇺🇸 USA",
    location: "Al Seef",
    status: "online",
    mood: "Heritage district vibes 🏛️",
    vibe: "Old meets new Dubai!",
    lat: 25.2406,
    lng: 55.2962,
    avatar: "👨‍🎭",
    bio: "Photographer, travel vlogger, documenting Dubai culture",
    distance: "3.8 km"
  }
];

const MapComponent: React.FC<{
  onUserSelect: (user: Profile) => void;
}> = ({ onUserSelect }) => {
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [showVibeMessage, setShowVibeMessage] = useState<{[key: number]: boolean}>({});
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);

  // Controlled vibe message animation
  useEffect(() => {
    const vibeInterval = setInterval(() => {
      const randomUser = mockProfiles[Math.floor(Math.random() * mockProfiles.length)];
      setShowVibeMessage(prev => ({ ...prev, [randomUser.id]: true }));
      
      setTimeout(() => {
        setShowVibeMessage(prev => ({ ...prev, [randomUser.id]: false }));
      }, 4000);
    }, 10000);

    return () => clearInterval(vibeInterval);
  }, []);

  const getMarkerPixelPosition = (lat: number, lng: number): {x: number, y: number} => {
    if (mapInstanceRef.current) {
      try {
        const point = mapInstanceRef.current.latLngToContainerPoint([lat, lng]);
        return { x: point.x, y: point.y };
      } catch (error) {
        return { x: 0, y: 0 };
      }
    }
    return { x: 0, y: 0 };
  };

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

    const initializeMap = () => {
      if (mapRef.current && (window as any).L && !mapInstanceRef.current) {
        const L = (window as any).L;
        
        mapInstanceRef.current = L.map(mapRef.current, {
          center: [currentUser.lat, currentUser.lng],
          zoom: 12, // Good zoom for 5km radius
          zoomControl: true,
          scrollWheelZoom: true,
          dragging: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapInstanceRef.current);

        // 5km radius circle
        radiusCircleRef.current = L.circle([currentUser.lat, currentUser.lng], {
          radius: 5000, // 5km
          color: '#8b5cf6',
          fillColor: '#8b5cf6',
          fillOpacity: 0.1,
          weight: 2,
          dashArray: '10, 5'
        }).addTo(mapInstanceRef.current);

        // Current user marker - special design
        const currentUserIcon = L.divIcon({
          html: `<div class="relative flex items-center justify-center">
                   <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 border-4 border-white rounded-full shadow-xl flex items-center justify-center relative z-10">
                     <span class="text-lg">${currentUser.avatar}</span>
                   </div>
                   <div class="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-ping opacity-30"></div>
                   <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                     YOU
                   </div>
                 </div>`,
          className: 'current-user-marker',
          iconSize: [48, 48],
          iconAnchor: [24, 24],
        });

        L.marker([currentUser.lat, currentUser.lng], { icon: currentUserIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`<div class="text-center"><b>${currentUser.name}</b><br/>📍 ${currentUser.mood}</div>`);

        // Add other user markers
        mockProfiles.forEach((profile) => {
          const emoji = profile.avatar;
          const pinColor = profile.gender === 'female' ? 'from-pink-400 to-pink-600' : 'from-blue-400 to-blue-600';
          const statusColor = profile.status === 'online' ? 'bg-green-400' : profile.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400';
          
          const profileIcon = L.divIcon({
            html: `<div class="relative flex items-center justify-center">
                     <div class="w-10 h-10 bg-gradient-to-r ${pinColor} rounded-full shadow-lg flex items-center justify-center z-10 border-3 border-white">
                       <span class="text-sm">${emoji}</span>
                     </div>
                     <div class="absolute -top-1 -right-1 w-4 h-4 ${statusColor} border-2 border-white rounded-full z-20"></div>
                   </div>`,
            className: `profile-marker profile-${profile.id} cursor-pointer`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          });

          const marker = L.marker([profile.lat, profile.lng], { icon: profileIcon })
            .addTo(mapInstanceRef.current);

          marker.on('click', () => {
            onUserSelect(profile);
          });

          marker.bindTooltip(`<div class="text-center">
            <div class="font-bold text-sm">${profile.name}</div>
            <div class="text-xs text-gray-600">${profile.distance} away</div>
            <div class="text-xs">${profile.mood}</div>
          </div>`, {
            direction: 'top',
            offset: [0, -25],
          });
        });

        setMapLoaded(true);
      }
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onUserSelect]);

  return (
    <div className="relative w-full h-96 bg-gray-700 rounded-lg overflow-hidden">
      <style>{`
        .leaflet-container {
          background: #374151 !important;
          border-radius: 0.5rem;
        }
        .profile-marker {
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
        }
        .current-user-marker {
          filter: drop-shadow(0 6px 12px rgba(139, 92, 246, 0.4));
        }
      `}</style>

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700 z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">Loading map...</p>
          </div>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        className="w-full h-full z-0"
        style={{ minHeight: '384px' }}
      />

      {/* Vibe messages */}
      {mockProfiles.map((profile) => {
        if (!showVibeMessage[profile.id] || !mapInstanceRef.current) return null;
        
        const pixelPos = getMarkerPixelPosition(profile.lat, profile.lng);
        
        return (
          <div
            key={`vibe-${profile.id}`}
            className="absolute z-30 pointer-events-none"
            style={{
              left: `${pixelPos.x}px`,
              top: `${pixelPos.y - 80}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="bg-gray-900 bg-opacity-95 text-white px-3 py-2 rounded-xl shadow-xl max-w-xs animate-bounce">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm">{profile.avatar}</span>
                <div className="text-xs font-bold">{profile.name}</div>
              </div>
              <div className="text-xs text-yellow-300 italic">"{profile.vibe}"</div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        );
      })}
      
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([currentUser.lat, currentUser.lng], 12);
            }
          }}
          className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-lg shadow-lg transition-all"
          title="Center on my location"
        >
          <MapPin className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const UserProfileCard: React.FC<{
  user: Profile;
  onClose: () => void;
  onMessage: (user: Profile) => void;
}> = ({ user, onClose, onMessage }) => {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full transform transition-all shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl font-bold mb-3 ${
            user.gender === 'female' ? 'bg-gradient-to-r from-pink-400 to-pink-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'
          } shadow-lg`}>
            {user.avatar}
          </div>
          <h3 className="text-xl font-bold text-white">{user.name}</h3>
          <p className="text-gray-400">{user.age} • {user.country}</p>
          <p className="text-purple-400 text-sm">{user.location} • {user.distance}</p>
          
          {/* Status */}
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs mt-2 ${
            user.status === 'online' ? 'bg-green-600 text-green-100' : 
            user.status === 'away' ? 'bg-yellow-600 text-yellow-100' : 'bg-gray-600 text-gray-100'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              user.status === 'online' ? 'bg-green-300' : 
              user.status === 'away' ? 'bg-yellow-300' : 'bg-gray-300'
            } animate-pulse`}></div>
            {user.status === 'online' ? 'Online' : user.status === 'away' ? 'Away' : `Last seen ${user.lastSeen}`}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-4 mb-6">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Current Mood</p>
            <p className="text-white">{user.mood}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Bio</p>
            <p className="text-white text-sm">{user.bio}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Vibing</p>
            <p className="text-yellow-300 text-sm italic">"{user.vibe}"</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onMessage(user)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-xl transition-all font-medium text-sm flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Message</span>
            </button>
            <button 
              onClick={() => setIsConnected(!isConnected)}
              className={`${isConnected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'} text-white py-3 px-4 rounded-xl transition-all font-medium text-sm flex items-center justify-center space-x-2`}
            >
              {isConnected ? <Heart className="w-4 h-4 fill-current" /> : <UserPlus className="w-4 h-4" />}
              <span>{isConnected ? 'Connected' : 'Connect'}</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-xl transition-all text-sm flex items-center justify-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>Call</span>
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-xl transition-all text-sm flex items-center justify-center space-x-2">
              <Video className="w-4 h-4" />
              <span>Video</span>
            </button>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

const MessagingInterface: React.FC<{
  user: Profile;
  onBack: () => void;
}> = ({ user, onBack }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      senderId: 0,
      receiverId: user.id,
      message: "Hey! I saw you're nearby. Love your vibe! 😊",
      timestamp: "10:30 AM",
      status: "read"
    },
    {
      id: 2,
      senderId: user.id,
      receiverId: 0,
      message: "Thanks! You seem cool too. What brings you to Dubai?",
      timestamp: "10:32 AM",
      status: "read"
    },
    {
      id: 3,
      senderId: 0,
      receiverId: user.id,
      message: "Work and exploring! Any recommendations for good coffee spots?",
      timestamp: "10:35 AM",
      status: "delivered"
    }
  ]);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        senderId: 0,
        receiverId: user.id,
        message: message.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: "sent"
      };
      setMessages([...messages, newMessage]);
      setMessage('');
      
      // Simulate delivery
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg
        ));
      }, 1000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center space-x-4 border-b border-gray-700">
        <button onClick={onBack} className="text-white hover:text-gray-300">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          user.gender === 'female' ? 'bg-gradient-to-r from-pink-400 to-pink-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'
        }`}>
          {user.avatar}
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold">{user.name}</h3>
          <p className={`text-xs ${
            user.status === 'online' ? 'text-green-400' : 'text-gray-400'
          }`}>
            {user.status === 'online' ? 'Online' : `Last seen ${user.lastSeen}`}
          </p>
        </div>
        <div className="flex space-x-2">
          <button className="text-white hover:text-gray-300">
            <Phone className="w-5 h-5" />
          </button>
          <button className="text-white hover:text-gray-300">
            <Video className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === 0 ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
              msg.senderId === 0 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-white'
            }`}>
              <p className="text-sm">{msg.message}</p>
              <div className={`flex items-center justify-end space-x-1 mt-1 text-xs ${
                msg.senderId === 0 ? 'text-blue-200' : 'text-gray-400'
              }`}>
                <span>{msg.timestamp}</span>
                {msg.senderId === 0 && (
                  <span className={msg.status === 'read' ? 'text-blue-200' : 'text-gray-300'}>
                    {getStatusIcon(msg.status)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const SecureVibeMap: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [showMessaging, setShowMessaging] = useState<Profile | null>(null);

  const handleUserSelect = (user: Profile) => {
    setSelectedUser(user);
  };

  const handleMessage = (user: Profile) => {
    setSelectedUser(null);
    setShowMessaging(user);
  };

  const handleBackFromMessaging = () => {
    setShowMessaging(null);
  };

  if (showMessaging) {
    return <MessagingInterface user={showMessaging} onBack={handleBackFromMessaging} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-6 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Discover Nearby</h1>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>{mockProfiles.length} users nearby</span>
        </div>
      </header>

      {/* Content Area */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Map Section */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Live Map</h2>
                <div className="text-sm text-gray-400">
                  5km radius • Click any user to connect
                </div>
              </div>
              <MapComponent onUserSelect={handleUserSelect} />
            </div>
          </div>

          {/* Nearby Users Sidebar */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-100">Nearby Users</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {mockProfiles.map((profile) => (
                  <div 
                    key={profile.id} 
                    className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-all cursor-pointer border border-gray-600"
                    onClick={() => handleUserSelect(profile)}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold relative ${
                        profile.gender === 'female' 
                          ? 'bg-gradient-to-r from-pink-400 to-pink-600' 
                          : 'bg-gradient-to-r from-blue-400 to-blue-600'
                      } shadow-lg`}>
                        {profile.avatar}
                        {/* Status indicator */}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-700 ${
                          profile.status === 'online' ? 'bg-green-400' : 
                          profile.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                        }`}></div>
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-white text-sm truncate">{profile.name}</p>
                          <span className="text-xs text-gray-400">{profile.distance}</span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{profile.location}</p>
                        <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${
                          profile.status === 'online' 
                            ? 'bg-green-600 bg-opacity-20 text-green-300' 
                            : profile.status === 'away'
                            ? 'bg-yellow-600 bg-opacity-20 text-yellow-300'
                            : 'bg-gray-600 bg-opacity-20 text-gray-300'
                        }`}>
                          {profile.status === 'online' ? 'Online' : 
                           profile.status === 'away' ? 'Away' : `Last seen ${profile.lastSeen}`}
                        </div>
                      </div>
                    </div>
                    
                    {/* Mood */}
                    <div className="mt-2 pl-13">
                      <p className="text-xs text-gray-300 italic truncate">"{profile.mood}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfileCard 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)}
          onMessage={handleMessage}
        />
      )}
    </div>
  );
};

export default SecureVibeMap;