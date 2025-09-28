import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Users, MessageCircle, Bell, Menu } from 'lucide-react';

// TypeScript interfaces
interface Profile {
  id: number;
  name: string;
  age: number;
  gender: 'female' | 'male';
  country: string;
  location: string;
  status: 'online' | 'away';
  mood: string;
  vibe: string;
  lat: number;
  lng: number;
}

interface MarkerPosition {
  lat: number;
  lng: number;
  marker?: any;
}

// Reduced mock data for testing (first 10 users)
const mockProfiles: Profile[] = [
  { id: 1, name: "Emma Rodriguez", age: 24, gender: "female", country: "🇺🇸 USA", location: "Manhattan, NYC", status: "online", mood: "Coffee shop vibes ☕", vibe: "Central Park is gorgeous this morning! 🌳", lat: 40.7589, lng: -73.9851 },
  { id: 2, name: "Jake Thompson", age: 28, gender: "male", country: "🇺🇸 USA", location: "Venice Beach, LA", status: "online", mood: "Surfing before work 🏄‍♂️", vibe: "Perfect waves today! 🌊", lat: 33.9850, lng: -118.4695 },
  { id: 3, name: "Sophie Chen", age: 26, gender: "female", country: "🇨🇦 Canada", location: "Downtown Toronto", status: "online", mood: "Lunch break 🥗", vibe: "CN Tower views never get old! 🗼", lat: 43.6426, lng: -79.3871 },
  { id: 4, name: "Lucas Martinez", age: 31, gender: "male", country: "🇲🇽 Mexico", location: "Zona Rosa, Mexico City", status: "away", mood: "Business meeting 💼", vibe: "Amazing street food here! 🌮", lat: 19.4326, lng: -99.1332 },
  { id: 5, name: "Isabella Santos", age: 23, gender: "female", country: "🇧🇷 Brazil", location: "Copacabana, Rio", status: "online", mood: "Beach day! 🏖️", vibe: "Samba music everywhere! 💃", lat: -22.9068, lng: -43.1729 },
  { id: 6, name: "Amélie Dubois", age: 27, gender: "female", country: "🇫🇷 France", location: "Montmartre, Paris", status: "online", mood: "Art gallery hopping 🎨", vibe: "Eiffel Tower sparkling! ✨", lat: 48.8566, lng: 2.3522 },
  { id: 7, name: "Marco Rossi", age: 30, gender: "male", country: "🇮🇹 Italy", location: "Trastevere, Rome", status: "online", mood: "Aperitivo time 🍷", vibe: "Gelato and ancient history! 🍦", lat: 41.9028, lng: 12.4964 },
  { id: 8, name: "Yuki Tanaka", age: 25, gender: "female", country: "🇯🇵 Japan", location: "Shibuya, Tokyo", status: "online", mood: "Karaoke night 🎤", vibe: "Cherry blossoms everywhere! 🌸", lat: 35.6762, lng: 139.6503 },
  { id: 9, name: "Chen Wei", age: 32, gender: "male", country: "🇨🇳 China", location: "The Bund, Shanghai", status: "online", mood: "Night photography 📸", vibe: "Skyline is breathtaking! 🌃", lat: 31.2304, lng: 121.4737 },
  { id: 10, name: "Priya Sharma", age: 26, gender: "female", country: "🇮🇳 India", location: "Connaught Place, Delhi", status: "online", mood: "Street food tour 🍛", vibe: "Spice markets are incredible! 🌶️", lat: 28.6139, lng: 77.2090 }
];

const MapComponent: React.FC = () => {
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number}>({ lat: 25.2048, lng: 55.2708 });
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [showVibeMessage, setShowVibeMessage] = useState<{[key: number]: boolean}>({});
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Controlled vibe message animation - less frequent
  useEffect(() => {
    const vibeInterval = setInterval(() => {
      const randomUser = mockProfiles[Math.floor(Math.random() * mockProfiles.length)];
      setShowVibeMessage(prev => ({ ...prev, [randomUser.id]: true }));
      
      setTimeout(() => {
        setShowVibeMessage(prev => ({ ...prev, [randomUser.id]: false }));
      }, 4000);
    }, 8000); // Increased interval to reduce blinking

    return () => clearInterval(vibeInterval);
  }, []);

  // Function to convert lat/lng to pixel coordinates
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
      // Add Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
        document.head.appendChild(link);
      }

      // Load Leaflet JS
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
        
        // Initialize the map
        mapInstanceRef.current = L.map(mapRef.current, {
          center: [userLocation.lat, userLocation.lng],
          zoom: 2, // Start with world view
          zoomControl: true,
          scrollWheelZoom: true,
          dragging: true,
        });

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapInstanceRef.current);

        // Add 1km radius circle - simplified animation
        radiusCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
          radius: 100000, // 100km for better visibility
          color: '#8b5cf6',
          fillColor: '#8b5cf6',
          fillOpacity: 0.1,
          weight: 2,
        }).addTo(mapInstanceRef.current);

        // Add user location marker (you)
        const userIcon = L.divIcon({
          html: `<div class="relative flex items-center justify-center">
                   <div class="w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center relative z-10">
                     <div class="w-2 h-2 bg-white rounded-full"></div>
                   </div>
                 </div>`,
          className: 'user-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup('<div class="text-center"><b>You are here!</b><br/>📍 Ready to connect!</div>');

        // Add user markers - simplified pins
        mockProfiles.forEach((profile) => {
          const emoji = profile.gender === 'female' ? '👩' : '👨';
          const pinColor = profile.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500';
          const statusColor = profile.status === 'online' ? 'bg-green-400' : 'bg-yellow-400';
          
          const profileIcon = L.divIcon({
            html: `<div class="relative flex items-center justify-center">
                     <div class="w-8 h-8 ${pinColor} rounded-full shadow-lg flex items-center justify-center z-10 border-2 border-white">
                       <span class="text-sm">${emoji}</span>
                     </div>
                     <div class="absolute -top-1 -right-1 w-3 h-3 ${statusColor} border border-white rounded-full z-20"></div>
                   </div>`,
            className: `profile-marker profile-${profile.id}`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const marker = L.marker([profile.lat, profile.lng], { icon: profileIcon })
            .addTo(mapInstanceRef.current);

          markersRef.current.push(marker);

          // Add click event for profile popup
          marker.on('click', () => {
            setSelectedUser(profile);
          });

          // Simplified tooltip
          marker.bindTooltip(`<div class="text-center">
            <div class="font-bold text-sm">${profile.name}</div>
            <div class="text-xs">${profile.location}</div>
          </div>`, {
            direction: 'top',
            offset: [0, -20],
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
      markersRef.current = [];
    };
  }, []);

  return (
    <div className="relative w-full h-80 bg-gray-700 rounded-lg overflow-hidden">
      {/* Simplified CSS - no conflicting animations */}
      <style>{`
        .leaflet-container {
          background: #374151 !important;
        }
        .profile-marker {
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
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
      
      {/* Map container */}
      <div 
        ref={mapRef} 
        className="w-full h-full z-0"
        style={{ minHeight: '320px' }}
      />

      {/* Simplified vibe messages - less frequent */}
      {mockProfiles.map((profile) => {
        if (!showVibeMessage[profile.id] || !mapInstanceRef.current) return null;
        
        const pixelPos = getMarkerPixelPosition(profile.lat, profile.lng);
        
        return (
          <div
            key={`vibe-${profile.id}`}
            className="absolute z-30 pointer-events-none"
            style={{
              left: `${pixelPos.x}px`,
              top: `${pixelPos.y - 100}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="bg-gray-900 bg-opacity-95 text-white px-3 py-2 rounded-xl shadow-xl max-w-xs">
              <div className="flex items-center space-x-2 mb-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                  profile.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500'
                }`}>
                  {profile.gender === 'female' ? '👩' : '👨'}
                </div>
                <div className="text-xs font-bold">{profile.name}</div>
              </div>
              <div className="text-xs text-purple-300">{profile.location}</div>
              <div className="text-sm font-medium italic">"{profile.vibe}"</div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Map controls */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={() => {
            if (mapInstanceRef.current && navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((position) => {
                const newLocation = [position.coords.latitude, position.coords.longitude];
                mapInstanceRef.current.setView(newLocation, 10);
              });
            }
          }}
          className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-lg shadow-lg transition-all"
          title="Center on my location"
        >
          <MapPin className="w-4 h-4" />
        </button>
      </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setSelectedUser(null)}>
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-xl font-bold mb-3 ${
                selectedUser.gender === 'female' ? 'bg-gradient-to-r from-pink-400 to-pink-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'
              }`}>
                {selectedUser.gender === 'female' ? '👩' : '👨'}
              </div>
              <h3 className="text-lg font-bold text-white">{selectedUser.name}</h3>
              <p className="text-gray-400 text-sm">{selectedUser.age} • {selectedUser.country}</p>
              <p className="text-purple-400 text-sm">{selectedUser.location}</p>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <p className="text-gray-400 text-xs">Current Mood</p>
                <p className="text-white text-sm">{selectedUser.mood}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Vibing</p>
                <p className="text-white text-sm italic">"{selectedUser.vibe}"</p>
              </div>
            </div>

            <div className="space-y-2">
              <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-2 px-4 rounded-lg transition-all font-medium text-sm">
                💬 Send Message
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-all text-xs">
                  ➕ Add Friend
                </button>
                <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-all text-xs">
                  💖 Share Vibe
                </button>
              </div>
            </div>

            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white text-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const SecureVibeMap: React.FC = () => {
  const [profiles] = useState<Profile[]>(mockProfiles);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Main Content - Remove duplicate sidebar */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-6 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Discover Nearby</h1>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Map Section - Takes 3/4 on large screens */}
            <div className="lg:col-span-3">
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Live Map</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>{profiles.length} users nearby</span>
                  </div>
                </div>
                <MapComponent />
              </div>
            </div>

            {/* Right Sidebar - Beautiful styling */}
            <div className="space-y-6">
              
              {/* Quick Stats */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-100">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Online Users</span>
                    <span className="text-green-400 font-bold text-lg">
                      {profiles.filter(p => p.status === 'online').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Messages</span>
                    <span className="text-blue-400 font-bold text-lg">5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Connections</span>
                    <span className="text-purple-400 font-bold text-lg">12</span>
                  </div>
                </div>
              </div>

              {/* Nearby Users - Beautiful cards */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-100">Nearby Users</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {profiles.slice(0, 8).map((profile) => (
                    <div key={profile.id} className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-all cursor-pointer border border-gray-600">
                      <div className="flex items-center space-x-3">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          profile.gender === 'female' 
                            ? 'bg-gradient-to-r from-pink-400 to-pink-600' 
                            : 'bg-gradient-to-r from-blue-400 to-blue-600'
                        } shadow-lg`}>
                          {profile.gender === 'female' ? '👩' : '👨'}
                        </div>
                        
                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-white text-sm truncate">{profile.name}</p>
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              profile.status === 'online' ? 'bg-green-400' : 'bg-yellow-400'
                            }`}></div>
                          </div>
                          <p className="text-xs text-gray-400 truncate">{profile.location}</p>
                          <div className={`text-xs mt-1 px-2 py-1 rounded-full inline-block ${
                            profile.status === 'online' 
                              ? 'bg-green-600 bg-opacity-20 text-green-300' 
                              : 'bg-yellow-600 bg-opacity-20 text-yellow-300'
                          }`}>
                            {profile.status === 'online' ? 'Online' : 'Away'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Mood/Vibe */}
                      <div className="mt-2 pl-13">
                        <p className="text-xs text-gray-300 italic">"{profile.mood}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-100">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-4 rounded-lg transition-all font-medium text-sm">
                    🚀 Start Discovery
                  </button>
                  <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-all font-medium text-sm">
                    💬 View Messages
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureVibeMap;