import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  MapPin, 
  MessageCircle, 
  Bell, 
  Users, 
  Settings,
  Heart,
  User,
  Plus,
  Minus,
  ArrowLeft,
  Sliders,
  X,
  UserPlus,
  Eye
} from 'lucide-react';

// Type definitions
interface Position {
  x: number;
  y: number;
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

interface LoggedInUser {
  id: string;
  name: string;
  position: Position;
  isLoggedIn: boolean;
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

type PageType = 'map' | 'nearby' | 'messages' | 'login' | 'signup';

const SecureVibeMap: React.FC = () => {
  // State management
  const [currentPage, setCurrentPage] = useState<PageType>('map');
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [blinkingMarkers, setBlinkingMarkers] = useState<Record<number, boolean>>({});
  const [chatBubbles, setChatBubbles] = useState<Record<number, boolean>>({});
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [seenUsers, setSeenUsers] = useState<Set<number>>(new Set());
  const [currentUserIndex, setCurrentUserIndex] = useState<number>(0);
  const [searchRadius, setSearchRadius] = useState<number>(25);
  const [showRadiusControls, setShowRadiusControls] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<GlobalUser | null>(null);
  const [showProfileCard, setShowProfileCard] = useState<boolean>(false);
  const [liveUsersCount, setLiveUsersCount] = useState<number>(8);

  // Logged in user (you) - Dubai location
  const loggedInUser: LoggedInUser = {
    id: 'me',
    name: 'You',
    position: { x: 50, y: 50 },
    isLoggedIn: true,
    country: 'UAE',
    city: 'Dubai'
  };

  // Global users data
  const globalUsers: GlobalUser[] = [
    {
      id: 1, name: "Ahmed Al Mansouri", age: 28, gender: "male", distance: "2.3KM",
      mood: "Coffee enthusiast ☕", vibe: "Best shawarma in town!", avatar: "👨‍💼",
      status: "away", position: { x: 51, y: 49 }, country: "UAE", city: "Dubai",
      lastSeen: "5 min ago", profession: "Business Analyst"
    },
    {
      id: 2, name: "Fatima Al Zahra", age: 25, gender: "female", distance: "1.8KM",
      mood: "Art lover 🎨", vibe: "Exhibition at DIFC tonight", avatar: "👩‍🎨",
      status: "online", position: { x: 49, y: 51 }, country: "UAE", city: "Dubai",
      lastSeen: "now", profession: "Graphic Designer"
    },
    {
      id: 3, name: "Omar bin Rashid", age: 32, gender: "male", distance: "4.1KM",
      mood: "Tech innovator 💻", vibe: "Working on new startup", avatar: "👨‍💻",
      status: "away", position: { x: 53, y: 48 }, country: "UAE", city: "Abu Dhabi",
      lastSeen: "2 hours ago", profession: "Software Engineer"
    },
    {
      id: 4, name: "Sarah Al Qasimi", age: 26, gender: "female", distance: "3.5KM",
      mood: "Adventure seeker ⛰️", vibe: "Hiking Jebel Jais this weekend", avatar: "👩‍🚀",
      status: "online", position: { x: 52, y: 52 }, country: "UAE", city: "Ras Al Khaimah",
      lastSeen: "now", profession: "Travel Blogger"
    },
    {
      id: 5, name: "Khalid Al Thani", age: 30, gender: "male", distance: "315KM",
      mood: "Sports fanatic ⚽", vibe: "World Cup memories", avatar: "👨‍⚽",
      status: "away", position: { x: 48, y: 45 }, country: "Qatar", city: "Doha",
      lastSeen: "1 hour ago", profession: "Sports Journalist"
    },
    {
      id: 6, name: "Noura Al Sabah", age: 27, gender: "female", distance: "420KM",
      mood: "Foodie explorer 🍽️", vibe: "Traditional Kuwaiti cuisine", avatar: "👩‍🍳",
      status: "online", position: { x: 47, y: 44 }, country: "Kuwait", city: "Kuwait City",
      lastSeen: "now", profession: "Food Critic"
    },
    {
      id: 7, name: "Faisal Al Saud", age: 29, gender: "male", distance: "870KM",
      mood: "History buff 📚", vibe: "Exploring Al-Ula heritage", avatar: "👨‍🎓",
      status: "away", position: { x: 45, y: 47 }, country: "Saudi Arabia", city: "Riyadh",
      lastSeen: "3 hours ago", profession: "Archaeologist"
    },
    {
      id: 8, name: "Amira Al Rashid", age: 24, gender: "female", distance: "640KM",
      mood: "Music producer 🎵", vibe: "New track dropping soon", avatar: "👩‍🎤",
      status: "online", position: { x: 46, y: 46 }, country: "Bahrain", city: "Manama",
      lastSeen: "now", profession: "Music Producer"
    },
    {
      id: 9, name: "Arjun Sharma", age: 26, gender: "male", distance: "1,850KM",
      mood: "Bollywood dancer 💃", vibe: "Teaching dance classes", avatar: "👨‍🎭",
      status: "away", position: { x: 65, y: 55 }, country: "India", city: "Mumbai",
      lastSeen: "45 min ago", profession: "Dance Instructor"
    },
    {
      id: 10, name: "Priya Patel", age: 28, gender: "female", distance: "1,720KM",
      mood: "Tech entrepreneur 🚀", vibe: "Building the future", avatar: "👩‍💼",
      status: "online", position: { x: 66, y: 53 }, country: "India", city: "Bangalore",
      lastSeen: "now", profession: "CEO & Founder"
    }
  ];

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
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setMapZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
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
              className="w-3 h-3 text-white absolute top-0.5 left-0.5 transform scale-110 animate-bounce" 
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
              onClick={() => {
                setCurrentPage('messages');
                onClose();
              }}
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

  // Sidebar Component
  const Sidebar: React.FC = () => (
    <div className="w-16 bg-gradient-to-b from-purple-700 to-purple-900 flex flex-col items-center py-4 space-y-6">
      <button className="text-white hover:text-purple-200 transition-colors">
        <Menu className="w-6 h-6" />
      </button>
      
      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold border-2 border-yellow-300 shadow-lg">
        D
      </div>
      
      <button 
        onClick={() => setCurrentPage('map')}
        className={`p-2 rounded-lg transition-colors ${currentPage === 'map' ? 'bg-purple-600 shadow-lg' : 'hover:bg-purple-600'}`}
      >
        <MapPin className="w-6 h-6 text-white" />
      </button>
      
      <button 
        onClick={() => setCurrentPage('messages')}
        className={`p-2 rounded-lg transition-colors ${currentPage === 'messages' ? 'bg-purple-600 shadow-lg' : 'hover:bg-purple-600'}`}
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>
      
      <button className="text-white hover:text-purple-200 transition-colors">
        <Bell className="w-6 h-6" />
      </button>
      
      <button 
        onClick={() => setCurrentPage('nearby')}
        className={`p-2 rounded-lg transition-colors ${currentPage === 'nearby' ? 'bg-purple-600 shadow-lg' : 'hover:bg-purple-600'}`}
      >
        <Users className="w-6 h-6 text-white" />
      </button>
      
      <button 
        onClick={() => setCurrentPage('login')}
        className={`p-2 rounded-lg transition-colors ${currentPage === 'login' ? 'bg-purple-600 shadow-lg' : 'hover:bg-purple-600'}`}
      >
        <User className="w-6 h-6 text-white" />
      </button>
      
      <button className="text-white hover:text-purple-200 transition-colors">
        <Settings className="w-6 h-6" />
      </button>
    </div>
  );

  // Messages Page Component
  const MessagesPage: React.FC = () => (
    <div className="flex-1 bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col">
      <div className="bg-white shadow-sm p-4 flex items-center space-x-4 border-b border-gray-100">
        <button 
          onClick={() => setCurrentPage('map')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Messages</h1>
        <div className="flex-1 text-right">
          <span className="text-sm text-gray-600">
            {globalUsers.filter((user: GlobalUser) => user.status === 'online').length} online
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {globalUsers.slice(0, 8).map((user: GlobalUser) => (
          <div key={user.id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center text-2xl">
                  {user.avatar}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  user.status === 'online' ? 'bg-green-400' : 'bg-gray-400'
                }`}></div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-800">{user.name}</h3>
                  <span className="text-xs text-gray-500">{user.lastSeen}</span>
                </div>
                <p className="text-sm text-gray-600">{user.vibe}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-purple-600">{user.city}, {user.country}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{user.distance}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Nearby Vibers Component
  const NearbyVibers: React.FC = () => {
    const availableUsers = globalUsers.filter((user: GlobalUser) => !seenUsers.has(user.id));
    const currentUser = availableUsers[currentUserIndex];

    const handleSwipeLeft = () => {
      if (currentUser) {
        setSeenUsers(prev => new Set([...prev, currentUser.id]));
        setCurrentUserIndex(0);
      }
    };

    const handleSwipeRight = () => {
      if (currentUser) {
        setSeenUsers(prev => new Set([...prev, currentUser.id]));
        setCurrentUserIndex(0);
      }
    };

    if (!currentUser) {
      return (
        <div className="flex-1 bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col">
          <div className="bg-white shadow-sm p-4 flex items-center space-x-4 border-b border-gray-100">
            <button 
              onClick={() => setCurrentPage('map')}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Nearby Vibers</h1>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">No more vibers nearby</h2>
              <p className="text-gray-600">Check back later or expand your search radius</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col">
        <div className="bg-white shadow-sm p-4 flex items-center space-x-4 border-b border-gray-100">
          <button 
            onClick={() => setCurrentPage('map')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Nearby Vibers</h1>
          <div className="flex-1 text-right">
            <span className="text-sm text-gray-600">{availableUsers.length} people nearby</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden relative border border-gray-100">
              <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${currentUser.status === 'online' ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-xs font-medium text-gray-600">
                  {currentUser.status === 'online' ? 'Online' : currentUser.lastSeen}
                </span>
              </div>

              <div className="flex justify-between items-start p-6 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-gray-700">
                    {currentUser.gender === 'male' ? '♂' : '♀'}
                  </span>
                  <span className="text-xl font-semibold text-gray-800">{currentUser.age}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-medium text-gray-600">{currentUser.distance}</span>
                  <div className="text-xs text-gray-500">{currentUser.city}, {currentUser.country}</div>
                </div>
              </div>

              <div className="flex justify-center py-8">
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-6xl shadow-lg">
                    {currentUser.avatar}
                  </div>
                  <button 
                    onClick={handleSwipeRight}
                    className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="text-center pb-4">
                <h2 className="text-2xl font-bold text-gray-800">{currentUser.name}</h2>
                <p className="text-sm text-purple-600 font-medium mt-1">{currentUser.profession}</p>
                <p className="text-sm text-gray-600 mt-1 italic">"{currentUser.vibe}"</p>
              </div>

              <div className="flex items-center justify-between p-6 pt-2">
                <div className="flex-1">
                  <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-full px-4 py-2 border border-purple-200">
                    <span className="text-gray-700 text-sm font-medium">{currentUser.mood}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setCurrentPage('messages')}
                  className="ml-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex justify-center space-x-8 mt-8">
              <button 
                onClick={handleSwipeLeft}
                className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110"
              >
                <X className="w-6 h-6" />
              </button>
              <button 
                onClick={handleSwipeRight}
                className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110"
              >
                <Heart className="w-6 h-6" />
              </button>
            </div>

            <div className="text-center mt-6">
              <span className="text-gray-600 text-sm font-medium">
                {globalUsers.length - availableUsers.length} of {globalUsers.length} viewed
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Map Component
  const VibeMap: React.FC = () => (
    <div 
      className="flex-1 relative bg-gray-100 overflow-hidden"
      onWheel={handleWheel}
      style={{ cursor: 'grab' }}
    >
      {/* Real Map Background */}
      <div className="absolute inset-0">
        <div 
          className="w-full h-full bg-cover bg-center transition-transform duration-300"
          style={{ 
            backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><pattern id="water" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse"><rect width="100" height="100" fill="%23a7c7e7"/></pattern><pattern id="land" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse"><rect width="50" height="50" fill="%23f5f5dc"/></pattern></defs><rect width="1000" height="1000" fill="url(%23water)"/><path d="M100,200 Q300,100 500,200 Q700,300 900,200 L900,800 Q700,700 500,800 Q300,900 100,800 Z" fill="url(%23land)"/></svg>')`,
            transform: `scale(${mapZoom})`,
            transformOrigin: '50% 50%'
          }}
        />
        
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            transform: `scale(${mapZoom})`,
            transformOrigin: '50% 50%'
          }}
        >
          <svg className="absolute inset-0 w-full h-full">
            <path d="M0,300 L1000,320" stroke="#999" strokeWidth="2" opacity="0.6" />
            <path d="M0,500 L1000,480" stroke="#999" strokeWidth="2" opacity="0.6" />
            <path d="M200,0 L220,1000" stroke="#999" strokeWidth="2" opacity="0.6" />
            <path d="M500,0 L480,1000" stroke="#999" strokeWidth="2" opacity="0.6" />
            <path d="M800,0 L820,1000" stroke="#999" strokeWidth="2" opacity="0.6" />
            
            <path d="M0,150 L1000,160" stroke="#bbb" strokeWidth="1" opacity="0.4" />
            <path d="M0,650 L1000,640" stroke="#bbb" strokeWidth="1" opacity="0.4" />
            <path d="M350,0 L360,1000" stroke="#bbb" strokeWidth="1" opacity="0.4" />
            <path d="M650,0 L640,1000" stroke="#bbb" strokeWidth="1" opacity="0.4" />
          </svg>
        </div>
      </div>
      
      {/* Search radius circle */}
      <div
        className="absolute border-3 border-purple-400 border-dashed rounded-full opacity-30 pointer-events-none"
        style={{
          left: `${loggedInUser.position.x}%`,
          top: `${loggedInUser.position.y}%`,
          width: `${searchRadius * 8}px`,
          height: `${searchRadius * 8}px`,
          transform: `translate(-50%, -50%) scale(${mapZoom})`,
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.08) 0%, rgba(59, 130, 246, 0.03) 50%, transparent 100%)',
          animation: 'pulse 4s ease-in-out infinite'
        }}
      />
      
      {/* Your location marker */}
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30"
        style={{
          left: `${loggedInUser.position.x}%`,
          top: `${loggedInUser.position.y}%`,
          transform: `scale(${mapZoom})`
        }}
      >
        <div className="absolute inset-0 w-16 h-16 bg-yellow-400 rounded-full animate-ping opacity-40"></div>
        <div className="absolute inset-0 w-12 h-12 bg-yellow-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute inset-0 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-3 border-white shadow-xl flex items-center justify-center">
          <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-yellow-400">
          <div className="animate-bounce">👑</div>
        </div>
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 rounded-full shadow-lg">
          <span className="text-xs font-bold text-white">YOU</span>
        </div>
      </div>
      
      {/* Global user markers */}
      {globalUsers.map((user: GlobalUser) => {
        const isVisible = user.status === 'online' ? blinkingMarkers[user.id] !== false : true;
        const showChatBubble = chatBubbles[user.id];
        
        return (
          <div
            key={user.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 cursor-pointer hover:scale-110 ${
              isVisible ? 'opacity-100' : 'opacity-50'
            }`}
            style={{
              left: `${user.position.x}%`,
              top: `${user.position.y}%`,
              transform: `scale(${mapZoom})`,
              zIndex: showChatBubble ? 20 : 10
            }}
            onClick={() => {
              setSelectedUser(user);
              setShowProfileCard(true);
            }}
          >
            {/* Enhanced floating chat bubble */}
            {showChatBubble && (
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-30">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl px-4 py-2 max-w-44 relative shadow-2xl animate-bounce">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium truncate">{user.vibe}</span>
                  </div>
                  
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                    <svg width="12" height="8" viewBox="0 0 12 8" className="text-purple-500">
                      <path d="M6 8L0 0h12z" fill="currentColor"/>
                    </svg>
                  </div>
                  
                  <div className="absolute -top-1 -right-1 text-yellow-300 text-xs animate-ping">✨</div>
                </div>
              </div>
            )}
            
            {/* Beautiful heart-shaped marker */}
            <div className="relative group">
              <div className={`absolute inset-0 w-14 h-14 opacity-20 blur-md scale-150 group-hover:opacity-40 transition-all duration-300`}
                   style={{
                     background: user.gender === 'female' ? 'radial-gradient(circle, #ec4899, #f472b6)' : 'radial-gradient(circle, #3b82f6, #60a5fa)'
                   }}></div>
              
              <div className="relative w-12 h-12 group-hover:scale-110 transition-all duration-300 cursor-pointer">
                <svg 
                  width="48" 
                  height="48" 
                  viewBox="0 0 24 24" 
                  className="drop-shadow-lg group-hover:drop-shadow-2xl transition-all duration-300"
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
                    <filter id={`shadow-${user.id}`}>
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.3)"/>
                    </filter>
                  </defs>
                  
                  <path
                    d="M12,21.35l-1.45-1.32C5.4,15.36,2,12.28,2,8.5 C2,5.42,4.42,3,7.5,3c1.74,0,3.41,0.81,4.5,2.09C13.09,3.81,14.76,3,16.5,3 C19.58,3,22,5.42,22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z"
                    fill={`url(#heartGradient-${user.id})`}
                    filter={`url(#shadow-${user.id})`}
                    className={user.status === 'online' ? 'animate-pulse' : ''}
                  />
                </svg>
                
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-sm font-bold">
                  {user.avatar}
                </div>
              </div>
              
              {/* Animated status indicator */}
              <div className="absolute -top-1 -right-1">
                {user.status === 'online' ? (
                  <div className="relative">
                    <div className="w-5 h-5 bg-green-400 border-2 border-white rounded-full shadow-lg"></div>
                    <div className="absolute inset-0 w-5 h-5 bg-green-400 rounded-full animate-ping opacity-60"></div>
                    <div className="absolute inset-1 w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
                  </div>
                ) : (
                  <div className="w-5 h-5 bg-gray-400 border-2 border-white rounded-full relative shadow-lg">
                    <div className="absolute inset-1 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
              
              {/* Country flag badge */}
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center text-xs shadow-lg">
                {user.country === 'UAE' && '🇦🇪'}
                {user.country === 'India' && '🇮🇳'}
                {user.country === 'Qatar' && '🇶🇦'}
                {user.country === 'Kuwait' && '🇰🇼'}
                {user.country === 'Saudi Arabia' && '🇸🇦'}
                {user.country === 'Bahrain' && '🇧🇭'}
                {!['UAE', 'India', 'Qatar', 'Kuwait', 'Saudi Arabia', 'Bahrain'].includes(user.country) && '🌍'}
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Enhanced map controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <button 
          onClick={() => setMapZoom(prev => Math.min(prev + 0.2, 3))}
          className="w-10 h-10 bg-white bg-opacity-95 backdrop-blur-sm shadow-lg rounded-lg flex items-center justify-center hover:bg-gray-50 transition-all duration-300 hover:scale-105 border border-gray-200"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setMapZoom(prev => Math.max(prev - 0.2, 0.5))}
          className="w-10 h-10 bg-white bg-opacity-95 backdrop-blur-sm shadow-lg rounded-lg flex items-center justify-center hover:bg-gray-50 transition-all duration-300 hover:scale-105 border border-gray-200"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setShowRadiusControls(!showRadiusControls)}
          className="w-10 h-10 bg-purple-600 bg-opacity-95 backdrop-blur-sm shadow-lg rounded-lg flex items-center justify-center hover:bg-purple-700 transition-all duration-300 hover:scale-105"
        >
          <Sliders className="w-4 h-4 text-white" />
        </button>
      </div>
      
      {/* Enhanced radius controls */}
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
      
      {/* Compact live users stats */}
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
      
      {/* Simple terms checkbox */}
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
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      {currentPage === 'map' && <VibeMap />}
      {currentPage === 'nearby' && <NearbyVibers />}
      {currentPage === 'messages' && <MessagesPage />}
      
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