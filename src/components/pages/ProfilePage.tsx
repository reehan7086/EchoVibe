// src/pages/ProfilePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl">
          👤
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Profile</h1>
        <p className="text-white/70 mb-4">Your profile page is coming soon!</p>
        <Link 
          to="/dashboard" 
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg inline-block hover:shadow-lg transition-all"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default ProfilePage;
