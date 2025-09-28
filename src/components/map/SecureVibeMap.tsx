import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  MessageCircle, 
  Users, 
  Plus,
  Minus,
  Sliders,
  X,
  UserPlus,
  Eye
} from 'lucide-react';

// Type definitions
interface Position {
  lat: number;
  lng: number;
}

interface GlobalUser {
  id: number;
  name: string;
  age: number;
  gender: 'male' | 'female';
  distance: string;
  mood: string;
  vibe: string;
  avatar: string;
  status: 'online' | 'away';
  position: Position;
  country: string;
  city: string;
  lastSeen: string;
  profession: string;
}

interface UserLocation {
  id: string;
  name: string;
  position: Position;
  country: string;
  city: string;
}

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: React.ReactNode;
  id: string;
}

interface ProfileCardProps {
  user: GlobalUser;
  onClose: () => void;
}

const SecureVibeMap: React.FC = () => {
  // State management
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [blinkingMarkers, setBlinkingMarkers] = useState<Record<number, boolean>>({});
  const [chatBubbles, setChatBubbles] = useState<Record<number, boolean>>({});
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [searchRadius, setSearchRadius] = useState<number>(25);
  const [showRadiusControls, setShowRadiusControls] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<GlobalUser | null>(null);
  const [showProfileCard, setShowProfileCard] = useState<boolean>(false);
  const [liveUsersCount, setLiveUsersCount] = useState<number>(8);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [mapCenter, setMapCenter] = useState<Position>({ lat: 25.2048, lng: 55.2708 }); // Dubai default

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMapCenter(pos);
          setUserLocation({
            id: 'me',
            name: 'You',
            position: pos,
            country: 'UAE',
            city: 'Current Location'
          });
        },
        () => {
          // Fallback to Dubai if geolocation fails
          setUserLocation({
            id: 'me',
            name: 'You',
            position: { lat: 25.2048, lng: 55.2708 },
            country: 'UAE',
            city: 'Dubai'
          });
        }
      );
    }
  }, []);

  // Realistic global users with proper lat/lng coordinates
  const globalUsers: GlobalUser[] = [
    {
      id: 1, name: "Ahmed Al Mansouri", age: 28, gender: "male", distance: "2.3KM",
      mood: "Coffee enthusiast ☕", vibe: "Best shawarma in town!", avatar: "👨‍💼",
      status: "away", position: { lat: 25.2208, lng: 55.2808 }, country: "UAE", city: "Dubai",
      lastSeen: "5 min ago", profession: "Business Analyst"
    },
    {
      id: 2, name: "Fatima Al Zahra", age: 25, gender: "female", distance: "1.8KM",
      mood: "Art lover 🎨", vibe: "Exhibition at DIFC tonight", avatar: "👩‍🎨",
      status: "online", position: { lat: 25.1948, lng: 55.2608 }, country: "UAE", city: "Dubai",
      lastSeen: "now", profession: "Graphic Designer"
    },
    {
      id: 3, name: "Omar bin Rashid", age: 32, gender: "male", distance: "15.2KM",
      mood: "Tech innovator 💻", vibe: "Working on new startup", avatar: "👨‍💻",
      status: "away", position: { lat: 24.4539, lng: 54.3773 }, country: "UAE", city: "Abu Dhabi",
      lastSeen: "2 hours ago", profession: "Software Engineer"
    },
    {
      id: 4, name: "Sarah Al Qasimi", age: 26, gender: "female", distance: "85.4KM",
      mood: "Adventure seeker ⛰️", vibe: "Hiking Jebel Jais this weekend", avatar: "👩‍🚀",
      status: "online", position: { lat: 25.9579, lng: 56.1291 }, country: "UAE", city: "Ras Al Khaimah",
      lastSeen: "now", profession: "Travel Blogger"
    },
    {
      id: 5, name: "Khalid Al Thani", age: 30, gender: "male", distance: "315KM",
      mood: "Sports fanatic ⚽", vibe: "World Cup memories", avatar: "👨‍⚽",
      status: "away", position: { lat: 25.3548, lng: 51.1839 }, country: "Qatar", city: "Doha",
      lastSeen: "1 hour ago", profession: "Sports Journalist"
    },
    {
      id: 6, name: "Noura Al Sabah", age: 27, gender: "female", distance: "420KM",
      mood: "Foodie explorer 🍽️", vibe: "Traditional Kuwaiti cuisine", avatar: "👩‍🍳",
      status: "online", position: { lat: 29.3117, lng: 47.4818 }, country: "Kuwait", city: "Kuwait City",
      lastSeen: "now", profession: "Food Critic"
    },
    {
      id: 7, name: "Arjun Sharma", age: 26, gender: "male", distance: "1,850KM",
      mood: "Bollywood dancer 💃", vibe: "Teaching dance classes", avatar: "👨‍🎭",
      status: "away", position: { lat: 19.0760, lng: 72.8777 }, country: "India", city: "Mumbai",
      lastSeen: "45 min ago", profession: "Dance Instructor"
    },
    {
      id: 8, name: "Priya Patel", age: 28, gender: "female", distance: "1,720KM",
      mood: "Tech entrepreneur 🚀", vibe: "Building the future", avatar: "👩‍💼",
      status: "online", position: { lat: 12.9716, lng: 77.5946 }, country: "India", city: "Bangalore",
      lastSeen: "now", profession: "CEO & Founder"
    }
  ];

  // Convert lat/lng to screen coordinates
  const latLngToScreenCoords = (position: Position, center: Position, zoom: number) => {
    const scale = Math.pow(2, zoom) * 256;
    const centerX = (center.lng + 180) * (scale / 360);
    const centerY = (1 - Math.log(Math.tan(center.lat * Math.PI / 180) + 1 / Math.cos(center.lat * Math.PI / 180)) / Math.PI) / 2 * scale;
    
    const x = (position.lng + 180) * (scale / 360) - centerX;
    const y = (1 - Math.log(Math.tan(position.lat * Math.PI / 180) + 1 / Math.cos(position.lat * Math.PI / 180)) / Math.PI) / 2 * scale - centerY;
    
    return {
      x: 50 + (x / 10), // Adjust scaling
      y: 50 + (y / 10)
    };
  };

  // Random live users count animation
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUsersCount(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const newCount = prev + change;
        return Math.max(5, Math.min(15, newCount));
      });
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  // Mouse wheel zoom handler
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    setMapZoom(prev => Math.max(8, Math.min(18, prev + delta)));
  };

  // Blinking effect for markers
  useEffect(() => {
    const interval = setInterval(() => {
      setBlinkingMarkers(prev => {
        const newState = { ...prev };
        globalUsers.forEach((user: GlobalUser) => {
          if (user.status === 'online') {
            newState[user.id] = !prev[user.id];
          }
        });
        return newState;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Chat bubbles animation
  useEffect(() => {
    const interval = setInterval(() => {
      setChatBubbles(prev => {
        const newState = { ...prev };
        globalUsers.forEach((user: GlobalUser) => {
          if (user.status === 'online' && Math.random() > 0.85) {
            newState[user.id] = true;
            setTimeout(() => {
              setChatBubbles(current => ({
                ...current,
                [user.id]: false
              }));
            }, 4000);
          }
        });
        return newState;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Custom Checkbox Component
  const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ checked, onChange, label, id }) => (
    <label htmlFor={id} className="flex items-center space-x-3 cursor-pointer">
      <div className="relative">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <div className={`w-5 h-5 border-2 rounded transition-all duration-300 ${
          checked 
            ? 'bg-purple-600 border-purple-600 transform scale-110 shadow-lg' 
            : 'bg-white border-gray-300 hover:border-purple-400 hover:shadow-md'
        }`}>
          {checked && (
            <svg 
              className="w-3 h-3 text-white absolute top-0.5 left-0.5 transform scale-110" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          )}
        </div>
      </div>
      <span className="text-sm text-gray-700 select-none">{label}</span>
    </label>
  );

  // Profile Card Component
  const ProfileCard: React.FC<ProfileCardProps> = ({ user, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all duration-300 scale-100">
        <div className="relative bg-gradient-to-br from-purple-500 to-blue-600 p-6 text-white">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-3xl">
              {user.avatar}
            </div>
            <div>
              <h3 className="text-xl font-bold">{user.name}</h3>
              <p className="text-purple-100">{user.profession}</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                <span className="text-sm">{user.status === 'online' ? 'Online' : user.lastSeen}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Age</span>
            <span className="font-semibold">{user.age}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Distance</span>
            <span className="font-semibold">{user.distance}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Location</span>
            <span className="font-semibold">{user.city}, {user.country}</span>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-700">{user.mood}</p>
            <p className="text-xs text-gray-500 mt-1 italic">"{user.vibe}"</p>
          </div>

          <div className="flex space-x-3">
            <button 
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat</span>
            </button>
            <button 
              onClick={onClose}
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Connect</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!userLocation) {
    return (
      <div className="flex-1 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Getting your location...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 relative bg-gray-100 overflow-hidden"
      onWheel={handleWheel}
      style={{ cursor: 'grab' }}
    >
      {/* Real Map Background using Google Maps style */}
      <div className="absolute inset-0">
        <div 
          className="w-full h-full bg-cover bg-center transition-transform duration-200"
          style={{ 
            backgroundImage: `url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/${mapCenter.lng},${mapCenter.lat},${mapZoom}/1200x800@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw')`,
            transform: `scale(${1 + (mapZoom - 12) * 0.1})`,
            transformOrigin: '50% 50%'
          }}
        />
        
        {/* Fallback pattern if map doesn't load */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><pattern id="water" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse"><rect width="100" height="100" fill="%23a7c7e7"/></pattern><pattern id="land" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse"><rect width="50" height="50" fill="%23f5f5dc"/></pattern></defs><rect width="1000" height="1000" fill="url(%23water)"/><path d="M100,200 Q300,100 500,200 Q700,300 900,200 L900,800 Q700,700 500,800 Q300,900 100,800 Z" fill="url(%23land)"/></svg>')`,
          }}
        />
      </div>
      
      {/* Search radius circle */}
      <div
        className="absolute border-2 border-purple-400 border-dashed rounded-full opacity-30 pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          width: `${searchRadius * 4}px`,
          height: `${searchRadius * 4}px`,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.05) 0%, transparent 70%)',
        }}
      />
      
      {/* Your location marker */}
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30"
        style={{
          left: '50%',
          top: '50%',
        }}
      >
        <div className="absolute inset-0 w-16 h-16 bg-yellow-400 rounded-full animate-ping opacity-40"></div>
        <div className="absolute inset-0 w-12 h-12 bg-yellow-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute inset-0 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-2 border-white shadow-xl flex items-center justify-center">
          <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-yellow-400">
          <div className="animate-bounce">👑</div>
        </div>
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-1 rounded-full shadow-lg">
          <span className="text-xs font-bold text-white">YOU</span>
        </div>
      </div>
      
      {/* Global user markers */}
      {globalUsers.map((user: GlobalUser) => {
        const isVisible = user.status === 'online' ? blinkingMarkers[user.id] !== false : true;
        const showChatBubble = chatBubbles[user.id];
        const screenCoords = latLngToScreenCoords(user.position, mapCenter, mapZoom);
        
        // Only show users within viewport
        if (screenCoords.x < -10 || screenCoords.x > 110 || screenCoords.y < -10 || screenCoords.y > 110) {
          return null;
        }
        
        return (
          <div
            key={user.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 cursor-pointer hover:scale-110 ${
              isVisible ? 'opacity-100' : 'opacity-50'
            }`}
            style={{
              left: `${screenCoords.x}%`,
              top: `${screenCoords.y}%`,
              zIndex: showChatBubble ? 20 : 10
            }}
            onClick={() => {
              setSelectedUser(user);
              setShowProfileCard(true);
            }}
          >
            {/* Chat bubble */}
            {showChatBubble && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-30">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl px-3 py-2 max-w-40 relative shadow-xl animate-bounce">
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium truncate">{user.vibe}</span>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                    <svg width="8" height="6" viewBox="0 0 8 6" className="text-purple-500">
                      <path d="M4 6L0 0h8z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 text-yellow-300 text-xs animate-ping">✨</div>
                </div>
              </div>
            )}
            
            {/* Heart-shaped marker */}
            <div className="relative group">
              <div className="relative w-10 h-10 group-hover:scale-110 transition-all duration-300 cursor-pointer">
                <svg 
                  width="40" 
                  height="40" 
                  viewBox="0 0 24 24" 
                  className="drop-shadow-lg group-hover:drop-shadow-xl transition-all duration-300"
                >
                  <defs>
                    <linearGradient id={`heartGradient-${user.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      {user.gender === 'female' ? (
                        <>
                          <stop offset="0%" stopColor="#ec4899" />
                          <stop offset="50%" stopColor="#f472b6" />
                          <stop offset="100%" stopColor="#fb7185" />
                        </>
                      ) : (
                        <>
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="50%" stopColor="#60a5fa" />
                          <stop offset="100%" stopColor="#93c5fd" />
                        </>
                      )}
                    </linearGradient>
                  </defs>
                  
                  <path
                    d="M12,21.35l-1.45-1.32C5.4,15.36,2,12.28,2,8.5 C2,5.42,4.42,3,7.5,3c1.74,0,3.41,0.81,4.5,2.09C13.09,3.81,14.76,3,16.5,3 C19.58,3,22,5.42,22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z"
                    fill={`url(#heartGradient-${user.id})`}
                    className={user.status === 'online' ? 'animate-pulse' : ''}
                  />
                </svg>
                
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold">
                  {user.avatar}
                </div>
              </div>
              
              {/* Status indicator */}
              <div className="absolute -top-1 -right-1">
                {user.status === 'online' ? (
                  <div className="relative">
                    <div className="w-4 h-4 bg-green-400 border-2 border-white rounded-full shadow-lg"></div>
                    <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-60"></div>
                  </div>
                ) : (
                  <div className="w-4 h-4 bg-gray-400 border-2 border-white rounded-full relative shadow-lg">
                    <div className="absolute inset-1 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
              
              {/* Country flag */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border border-gray-200 flex items-center justify-center text-xs shadow-md">
                {user.country === 'UAE' && '🇦🇪'}
                {user.country === 'India' && '🇮🇳'}
                {user.country === 'Qatar' && '🇶🇦'}
                {user.country === 'Kuwait' && '🇰🇼'}
                {!['UAE', 'India', 'Qatar', 'Kuwait'].includes(user.country) && '🌍'}
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <button 
          onClick={() => setMapZoom(prev => Math.min(prev + 1, 18))}
          className="w-10 h-10 bg-white bg-opacity-95 backdrop-blur-sm shadow-lg rounded-lg flex items-center justify-center hover:bg-gray-50 transition-all duration-300 border border-gray-200"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setMapZoom(prev => Math.max(prev - 1, 8))}
          className="w-10 h-10 bg-white bg-opacity-95 backdrop-blur-sm shadow-lg rounded-lg flex items-center justify-center hover:bg-gray-50 transition-all duration-300 border border-gray-200"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setShowRadiusControls(!showRadiusControls)}
          className="w-10 h-10 bg-purple-600 bg-opacity-95 backdrop-blur-sm shadow-lg rounded-lg flex items-center justify-center hover:bg-purple-700 transition-all duration-300"
        >
          <Sliders className="w-4 h-4 text-white" />
        </button>
      </div>
      
      {/* Radius controls */}
      {showRadiusControls && (
        <div className="absolute top-4 right-16 bg-white bg-opacity-95 backdrop-blur-sm shadow-lg rounded-xl p-4 border border-gray-200">
          <div className="text-sm font-medium text-gray-800 mb-3">Search Radius</div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-500 font-medium">5km</span>
            <input
              type="range"
              min="5"
              max="50"
              value={searchRadius}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchRadius(Number(e.target.value))}
              className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-gray-500 font-medium">50km</span>
          </div>
          <div className="text-center mt-2">
            <span className="text-sm font-bold text-purple-600">{searchRadius}km</span>
          </div>
        </div>
      )}
      
      {/* Live users stats */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-60"></div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600 tabular-nums">
              {liveUsersCount}
            </div>
            <div className="text-xs text-gray-500 -mt-1">live now</div>
          </div>
        </div>
      </div>
      
      {/* Terms checkbox */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-200">
        <CustomCheckbox
          id="terms-map"
          checked={agreedToTerms}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgreedToTerms(e.target.checked)}
          label={
            <>
              I agree to <span className="text-purple-600 underline font-medium">Terms & Policy</span>
            </>
          }
        />
      </div>
      
      {/* Profile Card Modal */}
      {showProfileCard && selectedUser && (
        <ProfileCard 
          user={selectedUser} 
          onClose={() => {
            setShowProfileCard(false);
            setSelectedUser(null);
          }} 
        />
      )}
    </div>
  );
};

export default SecureVibeMap;