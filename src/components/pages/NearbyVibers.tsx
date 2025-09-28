import React, { useState } from 'react';
import { Heart, MessageCircle, User, MapPin } from 'lucide-react';

const NearbyVibers = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [seenUsers, setSeenUsers] = useState(new Set());

  // Mock realistic users data
  const mockUsers = [
    {
      id: 1,
      name: "Alex",
      age: 24,
      gender: "♂",
      distance: "0.8KM",
      mood: "Coffee lover ☕",
      avatar: "🧑‍💼",
      isOnline: true
    },
    {
      id: 2,
      name: "Maya",
      age: 28,
      gender: "♀",
      distance: "1.2KM",
      mood: "Looking for adventure",
      avatar: "👩‍🎨",
      isOnline: true
    },
    {
      id: 3,
      name: "Jordan",
      age: 26,
      gender: "♂",
      distance: "2.1KM",
      mood: "Gym enthusiast 💪",
      avatar: "🧑‍🚀",
      isOnline: false
    },
    {
      id: 4,
      name: "Sofia",
      age: 22,
      gender: "♀",
      distance: "0.5KM",
      mood: "Book worm 📚",
      avatar: "👩‍🎓",
      isOnline: true
    },
    {
      id: 5,
      name: "Chris",
      age: 30,
      gender: "♂",
      distance: "3.2KM",
      mood: "Foodie exploring",
      avatar: "👨‍🍳",
      isOnline: true
    },
    {
      id: 6,
      name: "Luna",
      age: 25,
      gender: "♀",
      distance: "1.8KM",
      mood: "Music lover 🎵",
      avatar: "👩‍🎤",
      isOnline: false
    },
    {
      id: 7,
      name: "Sam",
      age: 27,
      gender: "♂",
      distance: "4.1KM",
      mood: "Tech geek",
      avatar: "👨‍💻",
      isOnline: true
    },
    {
      id: 8,
      name: "Aria",
      age: 23,
      gender: "♀",
      distance: "2.7KM",
      mood: "Nature enthusiast 🌿",
      avatar: "👩‍🌾",
      isOnline: true
    }
  ];

  const availableUsers = mockUsers.filter(user => !seenUsers.has(user.id));
  const currentUser = availableUsers[currentIndex];

  const handleSwipeLeft = () => {
    if (currentUser) {
      setSeenUsers(prev => new Set([...prev, currentUser.id]));
      setCurrentIndex(0); // Reset to first available user
    }
  };

  const handleSwipeRight = () => {
    if (currentUser) {
      // Handle friend request logic here
      setSeenUsers(prev => new Set([...prev, currentUser.id]));
      setCurrentIndex(0); // Reset to first available user
    }
  };

  const handleAddFriend = () => {
    handleSwipeRight();
  };

  const handleChat = () => {
    // Handle chat logic here
    console.log(`Starting chat with ${currentUser?.name}`);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white p-8">
          <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">No more vibers nearby</h2>
          <p className="text-gray-300">Check back later or expand your search radius</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Nearby Vibers</h1>
          <div className="flex items-center justify-center text-gray-300">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="text-sm">{availableUsers.length} people nearby</span>
          </div>
        </div>

        {/* User Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden relative">
          {/* Online Indicator */}
          {currentUser.isOnline && (
            <div className="absolute top-4 right-4 z-10">
              <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
          )}

          {/* Top Section with Gender, Age, and Distance */}
          <div className="flex justify-between items-start p-6 pb-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-700">{currentUser.gender}</span>
              <span className="text-xl font-semibold text-gray-800">{currentUser.age}</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-medium text-gray-600">
                &lt; {currentUser.distance}
              </span>
            </div>
          </div>

          {/* Avatar Section */}
          <div className="flex justify-center py-8">
            <div className="relative">
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center text-6xl">
                {currentUser.avatar}
              </div>
              {/* Add Friend Button */}
              <button 
                onClick={handleAddFriend}
                className="absolute -top-2 -right-2 w-10 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
              >
                <span className="text-xl font-light">+</span>
              </button>
            </div>
          </div>

          {/* Name */}
          <div className="text-center pb-4">
            <h2 className="text-2xl font-bold text-gray-800">{currentUser.name}</h2>
          </div>

          {/* Bottom Section with Mood and Chat */}
          <div className="flex items-center justify-between p-6 pt-2">
            <div className="flex-1">
              <div className="bg-gray-100 rounded-full px-4 py-2">
                <span className="text-gray-700 text-sm font-medium">{currentUser.mood}</span>
              </div>
            </div>
            <button 
              onClick={handleChat}
              className="ml-4 w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Swipe Actions */}
        <div className="flex justify-center space-x-8 mt-8">
          <button 
            onClick={handleSwipeLeft}
            className="w-14 h-14 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
          >
            <span className="text-2xl">×</span>
          </button>
          <button 
            onClick={handleSwipeRight}
            className="w-14 h-14 bg-pink-500 hover:bg-pink-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
          >
            <Heart className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="text-center mt-6">
          <span className="text-white text-sm opacity-75">
            {mockUsers.length - availableUsers.length} of {mockUsers.length} viewed
          </span>
        </div>
      </div>
    </div>
  );
};

export default NearbyVibers;