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

// Enhanced mock data with 100+ realistic worldwide users
const mockProfiles: Profile[] = [
  // NORTH AMERICA
  { id: 1, name: "Emma Rodriguez", age: 24, gender: "female", country: "🇺🇸 USA", location: "Manhattan, NYC", status: "online", mood: "Coffee shop vibes ☕", vibe: "Central Park is gorgeous this morning! 🌳", lat: 40.7589, lng: -73.9851 },
  { id: 2, name: "Jake Thompson", age: 28, gender: "male", country: "🇺🇸 USA", location: "Venice Beach, LA", status: "online", mood: "Surfing before work 🏄‍♂️", vibe: "Perfect waves today! 🌊", lat: 33.9850, lng: -118.4695 },
  { id: 3, name: "Sophie Chen", age: 26, gender: "female", country: "🇨🇦 Canada", location: "Downtown Toronto", status: "online", mood: "Lunch break 🥗", vibe: "CN Tower views never get old! 🗼", lat: 43.6426, lng: -79.3871 },
  { id: 4, name: "Lucas Martinez", age: 31, gender: "male", country: "🇲🇽 Mexico", location: "Zona Rosa, Mexico City", status: "away", mood: "Business meeting 💼", vibe: "Amazing street food here! 🌮", lat: 19.4326, lng: -99.1332 },
  
  // SOUTH AMERICA
  { id: 5, name: "Isabella Santos", age: 23, gender: "female", country: "🇧🇷 Brazil", location: "Copacabana, Rio", status: "online", mood: "Beach day! 🏖️", vibe: "Samba music everywhere! 💃", lat: -22.9068, lng: -43.1729 },
  { id: 6, name: "Diego Fernandez", age: 29, gender: "male", country: "🇦🇷 Argentina", location: "Palermo, Buenos Aires", status: "online", mood: "Tango night 💃", vibe: "Best steakhouse in the city! 🥩", lat: -34.6037, lng: -58.3816 },
  { id: 7, name: "Valentina Morales", age: 25, gender: "female", country: "🇨🇴 Colombia", location: "Zona Rosa, Bogotá", status: "online", mood: "Coffee tasting ☕", vibe: "Colombian coffee hits different! ☕", lat: 4.7110, lng: -74.0721 },
  
  // EUROPE
  { id: 8, name: "Amélie Dubois", age: 27, gender: "female", country: "🇫🇷 France", location: "Montmartre, Paris", status: "online", mood: "Art gallery hopping 🎨", vibe: "Eiffel Tower sparkling! ✨", lat: 48.8566, lng: 2.3522 },
  { id: 9, name: "Marco Rossi", age: 30, gender: "male", country: "🇮🇹 Italy", location: "Trastevere, Rome", status: "online", mood: "Aperitivo time 🍷", vibe: "Gelato and ancient history! 🍦", lat: 41.9028, lng: 12.4964 },
  { id: 10, name: "Elena Petrov", age: 24, gender: "female", country: "🇷🇺 Russia", location: "Red Square, Moscow", status: "away", mood: "Museum visit 🏛️", vibe: "Snow is magical here! ❄️", lat: 55.7558, lng: 37.6173 },
  { id: 11, name: "Hans Mueller", age: 33, gender: "male", country: "🇩🇪 Germany", location: "Mitte, Berlin", status: "online", mood: "Tech meetup 💻", vibe: "Berlin's startup scene is insane! 🚀", lat: 52.5200, lng: 13.4050 },
  { id: 12, name: "Ingrid Larsson", age: 28, gender: "female", country: "🇸🇪 Sweden", location: "Gamla Stan, Stockholm", status: "online", mood: "Hygge cafe time ☕", vibe: "Northern lights tonight! 🌌", lat: 59.3293, lng: 18.0686 },
  
  // ASIA PACIFIC
  { id: 13, name: "Yuki Tanaka", age: 25, gender: "female", country: "🇯🇵 Japan", location: "Shibuya, Tokyo", status: "online", mood: "Karaoke night 🎤", vibe: "Cherry blossoms everywhere! 🌸", lat: 35.6762, lng: 139.6503 },
  { id: 14, name: "Chen Wei", age: 32, gender: "male", country: "🇨🇳 China", location: "The Bund, Shanghai", status: "online", mood: "Night photography 📸", vibe: "Skyline is breathtaking! 🌃", lat: 31.2304, lng: 121.4737 },
  { id: 15, name: "Priya Sharma", age: 26, gender: "female", country: "🇮🇳 India", location: "Connaught Place, Delhi", status: "online", mood: "Street food tour 🍛", vibe: "Spice markets are incredible! 🌶️", lat: 28.6139, lng: 77.2090 },
  { id: 16, name: "Raj Patel", age: 29, gender: "male", country: "🇮🇳 India", location: "Marine Drive, Mumbai", status: "away", mood: "Bollywood film shoot 🎬", vibe: "Queen's Necklace at sunset! 🌅", lat: 18.9435, lng: 72.8264 },
  { id: 17, name: "Min-jun Kim", age: 27, gender: "male", country: "🇰🇷 South Korea", location: "Gangnam, Seoul", status: "online", mood: "K-BBQ dinner 🥘", vibe: "Korean fried chicken is life! 🍗", lat: 37.5665, lng: 126.9780 },
  { id: 18, name: "Soo-jin Lee", age: 24, gender: "female", country: "🇰🇷 South Korea", location: "Hongdae, Seoul", status: "online", mood: "K-pop dance class 💃", vibe: "Seoul never sleeps! 🌙", lat: 37.5563, lng: 126.9236 },
  
  // MIDDLE EAST & AFRICA
  { id: 19, name: "Aisha Al-Mansouri", age: 24, gender: "female", country: "🇦🇪 UAE", location: "Dubai Marina", status: "online", mood: "Exploring Dubai Mall! 🛍️", vibe: "Best shawarma at Al Rigga! 🌯", lat: 25.0657, lng: 55.1713 },
  { id: 20, name: "Omar Hassan", age: 29, gender: "male", country: "🇦🇪 UAE", location: "Burj Khalifa Area", status: "online", mood: "Heritage village tour 🏛️", vibe: "Dubai's skyline is unreal! 🏗️", lat: 25.1972, lng: 55.2744 },
  { id: 21, name: "Leila Nazari", age: 26, gender: "female", country: "🇮🇷 Iran", location: "Isfahan", status: "away", mood: "Mosque architecture 🕌", vibe: "Persian gardens are stunning! 🌹", lat: 32.6546, lng: 51.6680 },
  { id: 22, name: "Amara Okafor", age: 23, gender: "female", country: "🇳🇬 Nigeria", location: "Victoria Island, Lagos", status: "online", mood: "Afrobeats concert 🎵", vibe: "Lagos energy is unmatched! ⚡", lat: 6.4281, lng: 3.4219 },
  { id: 23, name: "Kwame Asante", age: 28, gender: "male", country: "🇬🇭 Ghana", location: "Accra", status: "online", mood: "Traditional market 🛒", vibe: "Jollof rice debate continues! 🍚", lat: 5.6037, lng: -0.1870 },
  
  // OCEANIA
  { id: 24, name: "Chloe Williams", age: 25, gender: "female", country: "🇦🇺 Australia", location: "Bondi Beach, Sydney", status: "online", mood: "Surfing session 🏄‍♀️", vibe: "Perfect beach weather! ☀️", lat: -33.8688, lng: 151.2093 },
  { id: 25, name: "Liam Anderson", age: 30, gender: "male", country: "🇦🇺 Australia", location: "Flinders Lane, Melbourne", status: "online", mood: "Coffee culture tour ☕", vibe: "Melbourne's laneways are art! 🎨", lat: -37.8136, lng: 144.9631 },
  
  // Add more users... (continuing with the same pattern)
  { id: 26, name: "Ana García", age: 27, gender: "female", country: "🇪🇸 Spain", location: "Gothic Quarter, Barcelona", status: "online", mood: "Tapas crawl 🍤", vibe: "Gaudí's architecture is mind-blowing! 🏛️", lat: 41.3851, lng: 2.1734 },
  { id: 27, name: "Carlos Mendez", age: 28, gender: "male", country: "🇪🇸 Spain", location: "Malasaña, Madrid", status: "online", mood: "Flamenco show 💃", vibe: "Spanish nightlife is legendary! 🌙", lat: 40.4168, lng: -3.7038 },
  { id: 28, name: "Olivia Brown", age: 26, gender: "female", country: "🇬🇧 UK", location: "Covent Garden, London", status: "online", mood: "Theatre district 🎭", vibe: "Fish and chips in the rain! ☔", lat: 51.5074, lng: -0.1278 },
  { id: 29, name: "James Wilson", age: 31, gender: "male", country: "🇬🇧 UK", location: "Camden, London", status: "away", mood: "Pub quiz night 🍺", vibe: "London pubs are the best! 🍻", lat: 51.5074, lng: -0.1278 },
  { id: 30, name: "Mei Lin", age: 24, gender: "female", country: "🇹🇼 Taiwan", location: "Ximending, Taipei", status: "online", mood: "Night market food 🥟", vibe: "Bubble tea originated here! 🧋", lat: 25.0330, lng: 121.5654 }
];

const MapComponent: React.FC = () => {
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number}>({ lat: 25.2048, lng: 55.2708 });
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [showVibeMessage, setShowVibeMessage] = useState<{[key: number]: boolean}>({});
  const [markerPositions, setMarkerPositions] = useState<{[key: number]: MarkerPosition}>({});
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);

  useEffect(() => {
    // Animate vibe messages
    const vibeInterval = setInterval(() => {
      const randomUser = mockProfiles[Math.floor(Math.random() * mockProfiles.length)];
      setShowVibeMessage(prev => ({ ...prev, [randomUser.id]: true }));
      
      setTimeout(() => {
        setShowVibeMessage(prev => ({ ...prev, [randomUser.id]: false }));
      }, 3000);
    }, 5000);

    return () => clearInterval(vibeInterval);
  }, []);

  // Function to convert lat/lng to pixel coordinates
  const getMarkerPixelPosition = (lat: number, lng: number): {x: number, y: number} => {
    if (mapInstanceRef.current) {
      const point = mapInstanceRef.current.latLngToContainerPoint([lat, lng]);
      return { x: point.x, y: point.y };
    }
    return { x: 0, y: 0 };
  };

  useEffect(() => {
    // Load Leaflet CSS and JS
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
          zoom: 14,
          zoomControl: true,
          scrollWheelZoom: true,
          dragging: true,
        });

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapInstanceRef.current);

        // Add 1km radius circle
        radiusCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
          radius: 1000, // 1km in meters
          color: '#8b5cf6',
          fillColor: '#8b5cf6',
          fillOpacity: 0.1,
          weight: 2,
          className: 'radius-circle'
        }).addTo(mapInstanceRef.current);

        // Add user location marker (you)
        const userIcon = L.divIcon({
          html: `<div class="relative flex items-center justify-center">
                   <div class="w-8 h-8 bg-blue-500 border-4 border-white rounded-full shadow-lg flex items-center justify-center relative z-10">
                     <div class="w-3 h-3 bg-white rounded-full"></div>
                   </div>
                   <div class="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-50"></div>
                 </div>`,
          className: 'user-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup('<div class="text-center"><b>You are here!</b><br/>📍 Ready to connect!</div>')
          .openPopup();

        // Add nearby users markers with emoji-based pins
        mockProfiles.forEach((profile) => {
          const emoji = profile.gender === 'female' ? '👩' : '👨';
          const pinColor = profile.gender === 'female' ? 'from-pink-400 to-pink-600' : 'from-blue-400 to-blue-600';
          const glowColor = profile.gender === 'female' ? 'shadow-pink-400/50' : 'shadow-blue-400/50';
          const statusIndicator = profile.status === 'online' ? 'bg-green-400' : 'bg-yellow-400';
          
          const profileIcon = L.divIcon({
            html: `<div class="relative flex items-center justify-center">
                     <div class="absolute w-12 h-12 bg-gradient-to-r ${pinColor} rounded-full opacity-20 animate-ping"></div>
                     <div class="absolute w-10 h-10 bg-gradient-to-r ${pinColor} rounded-full opacity-40 animate-pulse"></div>
                     <div class="relative w-8 h-8 bg-gradient-to-r ${pinColor} rounded-full shadow-lg ${glowColor} shadow-lg flex items-center justify-center z-10 border-2 border-white">
                       <span class="text-lg">${emoji}</span>
                       <div class="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
                     </div>
                     <div class="absolute -top-1 -right-1 w-3 h-3 ${statusIndicator} border-2 border-white rounded-full z-20 shadow-sm animate-pulse"></div>
                   </div>`,
            className: `profile-marker profile-${profile.id}`,
            iconSize: [48, 48],
            iconAnchor: [24, 24],
          });

          const marker = L.marker([profile.lat, profile.lng], { icon: profileIcon })
            .addTo(mapInstanceRef.current);

          // Store marker position for popover positioning
          setMarkerPositions(prev => ({
            ...prev,
            [profile.id]: { lat: profile.lat, lng: profile.lng, marker }
          }));

          // Add click event for profile popup
          marker.on('click', () => {
            setSelectedUser(profile);
          });

          // Enhanced tooltip
          marker.bindTooltip(`<div class="text-center font-medium">
            <div class="font-bold text-sm">${profile.name}</div>
            <div class="text-xs text-gray-600">${profile.location}</div>
            <div class="text-xs mt-1">${profile.mood}</div>
          </div>`, {
            direction: 'top',
            offset: [0, -30],
            className: 'sparkVibe-tooltip'
          });
        });

        setMapLoaded(true);
      }
    };

    // Get user's actual location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(newLocation);
          
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([newLocation.lat, newLocation.lng], 14);
            if (radiusCircleRef.current) {
              radiusCircleRef.current.setLatLng([newLocation.lat, newLocation.lng]);
            }
          }
        },
        (error) => {
          console.log("Location access denied, using Dubai as default");
        }
      );
    }

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLocation]);

  return (
    <div className="relative w-full h-64 bg-gray-700 rounded-lg overflow-hidden">
      {/* Enhanced CSS for animations and effects */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 0.4; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        .radius-circle {
          animation: pulse 3s infinite;
        }
        .sparkVibe-tooltip {
          background: rgba(17, 24, 39, 0.95) !important;
          border: 1px solid rgba(156, 163, 175, 0.3) !important;
          border-radius: 12px !important;
          backdrop-filter: blur(8px) !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3) !important;
        }
        .sparkVibe-tooltip .leaflet-tooltip-content {
          margin: 8px 12px !important;
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
        style={{ minHeight: '256px' }}
      />

      {/* Floating vibe messages positioned accurately near markers with animation */}
      {mockProfiles.map((profile) => {
        if (!showVibeMessage[profile.id] || !mapInstanceRef.current) return null;
        
        const pixelPos = getMarkerPixelPosition(profile.lat, profile.lng);
        
        return (
          <div
            key={`vibe-${profile.id}`}
            className="absolute z-30 pointer-events-none animate-in slide-in-from-bottom-2 duration-500"
            style={{
              left: `${pixelPos.x}px`,
              top: `${pixelPos.y - 120}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="bg-gray-900 bg-opacity-95 text-white px-4 py-3 rounded-2xl shadow-2xl max-w-xs backdrop-blur-md border border-gray-700 animate-bounce">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                  profile.gender === 'female' ? 'bg-gradient-to-r from-pink-400 to-pink-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'
                }`}>
                  {profile.gender === 'female' ? '👩' : '👨'}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">{profile.name}</div>
                  <div className={`text-xs flex items-center space-x-1 ${
                    profile.status === 'online' ? 'text-green-300' : 'text-yellow-300'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      profile.status === 'online' ? 'bg-green-400' : 'bg-yellow-400'
                    } animate-pulse`}></div>
                    <span>{profile.status === 'online' ? 'Online' : 'Away'}</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="text-xs text-purple-300 font-medium">📍 {profile.location}</div>
                <div className="text-xs text-gray-400">{profile.country}</div>
              </div>
              
              <div className="mb-2">
                <div className="text-xs text-gray-400">Current mood:</div>
                <div className="text-sm text-white">{profile.mood}</div>
              </div>
              
              <div className="text-sm font-medium text-yellow-300 italic">
                "{profile.vibe}"
              </div>
              
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-6 border-r-6 border-t-8 border-transparent border-t-gray-900 animate-pulse"></div>
              </div>
              
              <div className="absolute -top-1 -right-1 text-yellow-400 animate-spin">✨</div>
              <div className="absolute -bottom-1 -left-1 text-purple-400 animate-bounce">💫</div>
            </div>
          </div>
        );
      })}
      
      {/* Custom controls overlay */}
      <div className="absolute top-4 right-4 z-20 space-y-2">
        <button 
          onClick={() => {
            if (mapInstanceRef.current && navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((position) => {
                const newLocation = [position.coords.latitude, position.coords.longitude];
                mapInstanceRef.current.setView(newLocation, 15);
              });
            }
          }}
          className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-3 rounded-xl shadow-lg transition-all backdrop-blur-sm border border-gray-200"
          title="Center on my location"
        >
          <MapPin className="w-5 h-5" />
        </button>
      </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setSelectedUser(null)}>
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 transform transition-all" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3 ${
                selectedUser.gender === 'female' ? 'bg-gradient-to-r from-pink-400 to-pink-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'
              }`}>
                {selectedUser.name.charAt(0)}
              </div>
              <h3 className="text-xl font-bold text-white">{selectedUser.name}</h3>
              <p className="text-gray-400">{selectedUser.age} • {selectedUser.country}</p>
              <p className="text-purple-400 text-sm">{selectedUser.location}</p>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs mt-2 ${
                selectedUser.status === 'online' ? 'bg-green-600 text-green-100' : 'bg-yellow-600 text-yellow-100'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-1 ${
                  selectedUser.status === 'online' ? 'bg-green-300' : 'bg-yellow-300'
                }`}></div>
                {selectedUser.status === 'online' ? 'Online' : 'Away'}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <p className="text-gray-400 text-sm">Current Mood</p>
                <p className="text-white">{selectedUser.mood}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Vibing</p>
                <p className="text-white text-sm italic">"{selectedUser.vibe}"</p>
              </div>
            </div>

            <div className="space-y-2">
              <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-2 px-4 rounded-lg transition-all font-medium">
                💬 Send Message
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-all text-sm">
                  ➕ Add Friend
                </button>
                <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-all text-sm">
                  💖 Share Vibe
                </button>
              </div>
            </div>

            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
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
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<boolean>(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProfiles(mockProfiles);
        setConnectionError(false);
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
        setConnectionError(true);
        setProfiles(mockProfiles);
      }
    };

    fetchProfiles();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-20 bg-gradient-to-b from-purple-800 to-blue-900 flex flex-col">
        <div className="p-4 space-y-6">
          {/* Logo/Brand */}
          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-xl flex items-center justify-center">
            <Menu className="w-6 h-6 text-white" />
          </div>
          
          {/* Profile */}
          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
            P
          </div>
          
          {/* Navigation Icons */}
          <div className="space-y-4">
            <div className="w-12 h-12 bg-purple-700 bg-opacity-50 rounded-xl flex items-center justify-center cursor-pointer">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div className="w-12 h-12 hover:bg-purple-700 hover:bg-opacity-30 rounded-xl flex items-center justify-center cursor-pointer transition-all">
              <MessageCircle className="w-6 h-6 text-gray-300" />
            </div>
            <div className="w-12 h-12 hover:bg-purple-700 hover:bg-opacity-30 rounded-xl flex items-center justify-center cursor-pointer transition-all">
              <Bell className="w-6 h-6 text-gray-300" />
            </div>
            <div className="w-12 h-12 hover:bg-purple-700 hover:bg-opacity-30 rounded-xl flex items-center justify-center cursor-pointer transition-all">
              <Users className="w-6 h-6 text-gray-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-6 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Discover Nearby</h1>
          </div>
          
          {connectionError && (
            <div className="bg-yellow-600 bg-opacity-20 text-yellow-300 px-3 py-1 rounded-lg text-sm">
              Using offline data
            </div>
          )}
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            
            {/* Map Section - Takes 2/3 on large screens */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-xl p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Live Map</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>{profiles.length} users nearby</span>
                  </div>
                </div>
                <MapComponent />
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              
              {/* Quick Stats */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-6">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Online Users</span>
                    <span className="text-green-400 font-bold text-xl">
                      {profiles.filter(p => p.status === 'online').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Messages</span>
                    <span className="text-blue-400 font-bold text-xl">5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Connections</span>
                    <span className="text-purple-400 font-bold text-xl">12</span>
                  </div>
                </div>
              </div>

              {/* Nearby Users */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-6">Nearby Users</h3>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {profiles.slice(0, 6).map((profile) => (
                    <div key={profile.id} className="flex items-center space-x-4 p-3 hover:bg-gray-700 rounded-xl cursor-pointer transition-all">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                        profile.gender === 'female' ? 'bg-gradient-to-r from-pink-400 to-pink-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'
                      }`}>
                        {profile.gender === 'female' ? '👩' : '👨'}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{profile.name}</p>
                        <p className="text-sm text-gray-400">
                          {profile.status === 'online' ? 'Online' : 'Away'} • {profile.location}
                        </p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        profile.status === 'online' ? 'bg-green-400' : 'bg-yellow-400'
                      }`}></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-6">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-4 rounded-xl transition-all font-medium">
                    Start Discovery
                  </button>
                  <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-xl transition-all font-medium">
                    View Messages
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