// src/App.tsx - Enhanced routing with better auth flow
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import ErrorBoundary from './components/ErrorBoundary';


// Core components
import LandingPage from './components/LandingPage';
import SecureVibeMap from './components/map/SecureVibeMap';
import LoadingSpinner from './components/LoadingSpinner';

// Conditional imports with better fallbacks
let Login: React.ComponentType<any>;
let Register: React.ComponentType<any>;
let Dashboard: React.ComponentType<any>;

try {
  Login = require('./components/auth/Login').default;
  Register = require('./components/auth/Register').default;
} catch {
  try {
    Login = require('./components/LoginScreen').default;
    Register = require('./components/RegisterScreen').default;
  } catch {
    // Enhanced fallback components
    Login = () => (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Login Component Missing</h2>
          <p className="text-white/70 mb-6">Please create the Login component in /components/auth/</p>
          <a 
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
          >
            Back to Home
          </a>
        </div>
      </div>
    );

    Register = () => (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✨</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Register Component Missing</h2>
          <p className="text-white/70 mb-6">Please create the Register component in /components/auth/</p>
          <a 
            href="/login"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }
}

try {
  Dashboard = require('./components/Dashboard').default;
} catch {
  try {
    Dashboard = require('./components/MainDashboard').default;
  } catch {
    Dashboard = () => (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">EchoVibe Dashboard</h1>
          <p className="text-white/60 mb-8">Welcome to your secure social space</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <a
              href="/map"
              className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:scale-105 transition-all duration-300 block group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-xl">🗺️</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Secure Vibe Map</h3>
              <p className="text-white/70">Discover nearby vibes with enhanced security</p>
            </a>
            <a
              href="/profile"
              className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:scale-105 transition-all duration-300 block group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-xl">👤</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Your Profile</h3>
              <p className="text-white/70">Manage your profile and settings</p>
            </a>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 opacity-60">
              <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl">💬</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Chat (Coming Soon)</h3>
              <p className="text-white/70">Connect with other users securely</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Enhanced placeholder components
const PlaceholderPage: React.FC<{ title: string; description: string; icon: string }> = ({ title, description, icon }) => (
  <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center max-w-md">
      <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
        {icon}
      </div>
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      <p className="text-white/70 mb-6">{description}</p>
      <a 
        href="/dashboard"
        className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
      >
        Back to Dashboard
      </a>
    </div>
  </div>
);

const ProfilePage = () => <PlaceholderPage title="Profile" description="Your profile page is coming soon with enhanced features" icon="👤" />;
const ChatPage = () => <PlaceholderPage title="Secure Chat" description="End-to-end encrypted chat functionality coming soon" icon="💬" />;
const NotificationsPage = () => <PlaceholderPage title="Notifications" description="Smart notification center launching soon" icon="🔔" />;
const SettingsPage = () => <PlaceholderPage title="Settings" description="Advanced settings and preferences coming soon" icon="⚙️" />;

import './App.css';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
<Route path="/signup" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
      <Route path="/map" element={user ? <SecureVibeMap /> : <Navigate to="/login" replace />} />
      <Route path="/profile/:userId?" element={user ? <ProfilePage /> : <Navigate to="/login" replace />} />
      <Route path="/chat/:chatId?" element={user ? <ChatPage /> : <Navigate to="/login" replace />} />
      <Route path="/notifications" element={user ? <NotificationsPage /> : <Navigate to="/login" replace />} />
      <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/login" replace />} />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
    </Routes>
    </ErrorBoundary>
  );
};

export default App;