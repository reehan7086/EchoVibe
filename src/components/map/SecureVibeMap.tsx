import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  MessageCircle, 
  Users, 
  Plus,
  Minus,
  Sliders,
  X,
  UserPlus,
  Navigation,
  Filter
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
  interests: string[];
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
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [searchRadius, setSearchRadius] = useState<number>(25);
  const [showRadiusControls, setShowRadiusControls] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<GlobalUser | null>(null);
  const [showProfileCard, setShowProfileCard] = useState<boolean>(false);
  const [liveUsersCount, setLiveUsersCount] = useState<number>(12);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [mapCenter, setMapCenter] = useState<Position>({ lat: 25.2048, lng: 55.2708 });
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [ageFilter, setAgeFilter] = useState<[number, number]>([18, 50]);
  const [genderFilter, setGenderFilter] = useState<string>('all');

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
            country: 'Current',
            city: 'Location'
          });
        },
        () => {
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

  // Realistic users with proper coordinates
  const globalUsers: GlobalUser[] = [
    {
      id: 1, name: "Ahmed Al Mansouri", age: 28, gender: "male", distance: "2.3KM",
      mood: "Coffee enthusiast", vibe: "Best shawarma in town!", avatar: "👨‍💼",
      status: "online", position: { lat: 25.2208, lng: 55.2808 }, country: "UAE", city: "Dubai",
      lastSeen: "now", profession: "Business Analyst", interests: ["coffee", "business"]
    },
    {
      id: 2, name: "Fatima Al Zahra", age: 25, gender: "female", distance: "1.8KM",
      mood: "Art lover", vibe: "Exhibition at DIFC tonight", avatar: "👩‍🎨",
      status: "online", position: { lat: 25.1948, lng: 55.2608 }, country: "UAE", city: "Dubai",
      lastSeen: "now", profession: "Graphic Designer", interests: ["art", "design"]
    },
    {
      id: 3, name: "Omar bin Rashid", age: 32, gender: "male", distance: "4.2KM",
      mood: "Tech innovator", vibe: "Working on new startup", avatar: "👨‍💻",
      status: "away", position: { lat: 25.2348, lng: 55.2908 }, country: "UAE", city: "Dubai",
      lastSeen: "5 min ago", profession: "Software Engineer", interests: ["technology", "gaming"]
    },
    {
      id: 4, name: "Sarah Al Qasimi", age: 26, gender: "female", distance: "3.1KM",
      mood: "Adventure seeker", vibe: "Weekend hiking plans", avatar: "👩‍🚀",
      status: "online", position: { lat: 25.1848, lng: 55.2408 }, country: "UAE", city: "Dubai",
      lastSeen: "now", profession: "Travel Blogger", interests: ["travel", "hiking"]
    },
    {
      id: 5, name: "Khalid Al Thani", age: 30, gender: "male", distance: "5.7KM",
      mood: "Sports fanatic", vibe: "Football match tonight", avatar: "⚽",
      status: "away", position: { lat: 25.2548, lng: 55.3208 }, country: "UAE", city: "Dubai",
      lastSeen: "15 min ago", profession: "Sports Journalist", interests: ["sports", "football"]
    },
    {
      id: 6, name: "Noura Al Sabah", age: 27, gender: "female", distance: "2.9KM",
      mood: "Foodie explorer", vibe: "New restaurant discovery", avatar: "👩‍🍳",
      status: "online", position: { lat: 25.2148, lng: 55.2508 }, country: "UAE", city: "Dubai",
      lastSeen: "now", profession: "Food Critic", interests: ["food", "cooking"]
    },
    {
      id: 7, name: "Hassan Ali", age: 24, gender: "male", distance: "6.2KM",
      mood: "Fitness enthusiast", vibe: "Gym session complete", avatar: "🏋️‍♂️",
      status: "online", position: { lat: 25.2448, lng: 55.2308 }, country: "UAE", city: "Dubai",
      lastSeen: "now", profession: "Personal Trainer", interests: ["fitness", "health"]
    },
    {
      id: 8, name: "Layla Mahmoud", age: 23, gender: "female", distance: "1.5KM",
      mood: "Photography lover", vibe: "Golden hour shots", avatar: "📸",
      status: "online", position: { lat: 25.2098, lng: 55.2758 }, country: "UAE", city: "Dubai",
      lastSeen: "now", profession: "Photographer", interests: ["photography", "art"]
    }
  ];

  // Filter users
  const filteredUsers = globalUsers.filter(user => {
    const ageMatch = user.age >= ageFilter[0] && user.age <= ageFilter[1];
    const genderMatch = genderFilter === 'all' || user.gender === genderFilter;
    return ageMatch && genderMatch;
  });

  // Convert lat/lng to screen coordinates
  const latLngToScreenCoords = (position: Position, center: Position, zoom: number) => {
    const scale = Math.pow(2, zoom) * 256;
    const centerX = (center.lng + 180) * (scale / 360);
    const centerY = (1 - Math.log(Math.tan(center.lat * Math.PI / 180) + 1 / Math.cos(center.lat * Math.PI / 180)) / Math.PI) / 2 * scale;
    
    const x = (position.lng + 180) * (scale / 360) - centerX;
    const y = (1 - Math.log(Math.tan(position.lat * Math.PI / 180) + 1 / Math.cos(position.lat * Math.PI / 180)) / Math.PI) / 2 * scale - centerY;
    
    return {
      x: 50 + (x / 8),
      y: 50 + (y / 8)
    };
  };

  // Random live users count
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUsersCount(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        return Math.max(8, Math.min(18, prev + change));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    setMapZoom(prev => Math.max(10, Math.min(18, prev + delta)));
  };

  // Blinking markers effect
  useEffect(() => {
    const interval = setInterval(() => {
      setBlinkingMarkers(prev => {
        const newState = { ...prev };
        filteredUsers.forEach((user: GlobalUser) => {
          if (user.status === 'online') {
            newState[user.id] = !prev[user.id];
          }
        });
        return newState;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [filteredUsers]);

  // Chat bubbles animation
  useEffect(() => {
    const interval = setInterval(() => {
      setChatBubbles(prev => {
        const newState = { ...prev };
        filteredUsers.forEach((user: GlobalUser) => {
          if (user.status === 'online' && Math.random() > 0.88) {
            newState[user.id] = true;
            setTimeout(() => {
              setChatBubbles(current => ({
                ...current,
                [user.id]: false
              }));
            }, 3500);
          }
        });
        return newState;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [filteredUsers]);

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
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
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
            <p className="text-sm text-gray-700 font-medium">{user.mood}</p>
            <p className="text-xs text-gray-500 mt-1 italic">"{user.vibe}"</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {user.interests.map((interest, index) => (
              <span key={index} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                {interest}
              </span>
            ))}
          </div>

          <div className="flex space-x-3">
            <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
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
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Getting your location...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 relative bg-gray-50 overflow-hidden"
      onWheel={handleWheel}
      style={{ cursor: 'grab' }}
    >
      {/* Real Map Background */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundColor: '#f5f5f2',
          backgroundImage: `
            linear-gradient(90deg, #e5e5e5 1px, transparent 1px),
            linear-gradient(180deg, #e5e5e5 1px, transparent 1px),
            radial-gradient(circle at 25% 25%, #a2daf2 2px, transparent 2px),
            radial-gradient(circle at 75% 75%, #a2daf2 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px, 50px 50px, 100px 100px, 80px 80px'
        }}
      />
      
      {/* Search radius circle */}
      <div
        className="absolute border-2 border-purple-400 border-dashed rounded-full opacity-25 pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          width: `${searchRadius * 6}px`,
          height: `${searchRadius * 6}px`,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.05) 0%, transparent 70%)',
        }}
      />
      
      {/* Your location marker */}
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30"
        style={{ left: '50%', top: '50%' }}
      >
        <div className="relative">
          <div className="absolute inset-0 w-12 h-12 bg-yellow-400 rounded-full animate-ping opacity-30"></div>
          <div className="relative w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-3 border-white shadow-xl flex items-center justify-center">
            <Navigation className="w-5 h-5 text-white" />
          </div>
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-yellow-500 px-2 py-1 rounded-md shadow-lg">
            <span className="text-xs font-bold text-white">YOU</span>
          </div>
        </div>
      </div>
      
      {/* User markers - Meetup style map pins */}
      {filteredUsers.map((user: GlobalUser) => {
        const isVisible = user.status === 'online' ? blinkingMarkers[user.id] !== false : true;
        const showChatBubble = chatBubbles[user.id];
        const screenCoords = latLngToScreenCoords(user.position, mapCenter, mapZoom);
        
        if (screenCoords.x < -5 || screenCoords.x > 105 || screenCoords.y < -5 || screenCoords.y > 105) {
          return null;
        }
        
        const pinColor = user.gender === 'female' ? 'from-pink-500 to-pink-600' : 'from-blue-500 to-blue-600';
        
        return (
          <div
            key={user.id}
            className={`absolute transform -translate-x-1/2 -translate-y-full transition-all duration-500 cursor-pointer hover:scale-110 ${
              isVisible ? 'opacity-100' : 'opacity-70'
            }`}
            style={{
              left: `${screenCoords.x}%`,
              top: `${screenCoords.y}%`,
              zIndex: showChatBubble ? 25 : 15
            }}
            onClick={() => {
              setSelectedUser(user);
              setShowProfileCard(true);
            }}
          >
            {/* Chat bubble */}
            {showChatBubble && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-30">
                <div className="bg-white rounded-lg shadow-xl px-3 py-2 max-w-48 relative border border-gray-200 animate-bounce">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-800 truncate">{user.vibe}</span>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                    <div className="border-4 border-transparent border-t-white"></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Meetup-style map pin */}
            <div className="relative group">
              <div className={`w-8 h-12 bg-gradient-to-b ${pinColor} rounded-t-full rounded-br-full shadow-lg group-hover:shadow-xl transition-all duration-300 flex items-start justify-center pt-1`}>
                <div className="text-white text-sm font-bold">
                  {user.avatar}
                </div>
              </div>
              
              {/* Pin point */}
              <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gradient-to-b ${pinColor} rotate-45`}></div>
              
              {/* Status indicator */}
              <div className="absolute -top-1 -right-1">
                {user.status === 'online' ? (
                  <div className="relative">
                    <div className="w-4 h-4 bg-green-400 border-2 border-white rounded-full shadow-md"></div>
                    <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-50"></div>
                  </div>
                ) : (
                  <div className="w-4 h-4 bg-gray-400 border-2 border-white rounded-full shadow-md"></div>
                )}
              </div>
              
              {/* Hover info card */}
              <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl px-3 py-2 min-w-32 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border border-gray-200">
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-800">{user.name}</div>
                  <div className="text-xs text-gray-600">{user.age} • {user.distance}</div>
                  <div className="text-xs text-purple-600 mt-1">{user.mood}</div>
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                  <div className="border-4 border-transparent border-t-white"></div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <button 
          onClick={() => setMapZoom(prev => Math.min(prev + 1, 18))}
          className="w-10 h-10 bg-white shadow-lg rounded-lg flex items-center justify-center hover:bg-gray-50 transition-all duration-300 border border-gray-200"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setMapZoom(prev => Math.max(prev - 1, 10))}
          className="w-10 h-10 bg-white shadow-lg rounded-lg flex items-center justify-center hover:bg-gray-50 transition-all duration-300 border border-gray-200"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setShowRadiusControls(!showRadiusControls)}
          className="w-10 h-10 bg-purple-600 shadow-lg rounded-lg flex items-center justify-center hover:bg-purple-700 transition-all duration-300"
        >
          <Sliders className="w-4 h-4 text-white" />
        </button>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="w-10 h-10 bg-blue-600 shadow-lg rounded-lg flex items-center justify-center hover:bg-blue-700 transition-all duration-300"
        >
          <Filter className="w-4 h-4 text-white" />
        </button>
      </div>
      
      {/* Radius controls */}
      {showRadiusControls && (
        <div className="absolute top-4 right-16 bg-white shadow-lg rounded-xl p-4 border border-gray-200">
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

      {/* Filter controls */}
      {showFilters && (
        <div className="absolute top-4 right-28 bg-white shadow-lg rounded-xl p-4 border border-gray-200 w-64">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-800 mb-2 block">Age Range</label>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-500">{ageFilter[0]}</span>
                <input
                  type="range"
                  min="18"
                  max="50"
                  value={ageFilter[0]}
                  onChange={(e) => setAgeFilter([Number(e.target.value), ageFilter[1]])}
                  className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="range"
                  min="18"
                  max="50"
                  value={ageFilter[1]}
                  onChange={(e) => setAgeFilter([ageFilter[0], Number(e.target.value)])}
                  className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-500">{ageFilter[1]}</span>
              </div>
              <div className="text-center mt-1 text-xs text-gray-600">
                {ageFilter[0]} - {ageFilter[1]} years
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-800 mb-2 block">Gender</label>
              <select 
                value={genderFilter} 
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Genders</option>
                <option value="male">Men</option>
                <option value="female">Women</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Live users stats */}
      <div className="absolute top-4 left-4 bg-white shadow-lg rounded-xl p-4 border border-gray-200">
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
        <div className="mt-2 text-xs text-gray-600">
          {filteredUsers.length} nearby users
        </div>
      </div>

      {/* Nearby Vibers button */}
      <div className="absolute bottom-20 right-4">
        <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 font-medium">
          <Users className="w-5 h-5" />
          <span>Nearby Vibers</span>
        </button>
      </div>
      
      {/* Terms checkbox */}
      <div className="absolute bottom-4 left-4 bg-white shadow-lg rounded-xl p-4 border border-gray-200">
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

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white shadow-lg rounded-xl p-4 border border-gray-200 w-48">
        <div className="text-sm font-medium text-gray-800 mb-3">Map Legend</div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-6 bg-gradient-to-b from-pink-500 to-pink-600 rounded-t-full rounded-br-full"></div>
            <span className="text-xs text-gray-600">Women</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-t-full rounded-br-full"></div>
            <span className="text-xs text-gray-600">Men</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-xs text-gray-600">Online</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-xs text-gray-600">Away</span>
          </div>
        </div>
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