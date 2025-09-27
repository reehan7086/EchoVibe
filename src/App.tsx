// src/App.tsx - Flexible routing that works with your existing structure
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

// Core components that should exist
import LandingPage from './components/LandingPage';
import SecureVibeMap from './components/map/SecureVibeMap';
import LoadingSpinner from './components/LoadingSpinner';

// Conditional imports with fallbacks
let Login: React.ComponentType<any>;
let Dashboard: React.ComponentType<any>;

try {
  Login = require('./components/Login').default;
} catch {
  try {
    Login = require('./components/auth/Login').default;
  } catch {
    try {
      Login = require('./components/LoginScreen').default;
    } catch {
      Login = () => (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Login Coming Soon</h2>
            <p className="text-white/70">Please create the Login component</p>
          </div>
        </div>
      );
    }
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">EchoVibe Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <a
              href="/map"
              className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:scale-105 transition-all duration-300 block"
            >
              <h3 className="text-xl font-bold text-white mb-2">🗺️ Secure Vibe Map</h3>
              <p className="text-white/70">Discover nearby vibes with enhanced security</p>
            </a>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h3 className="text-xl font-bold text-white mb-2">💬 Chat (Coming Soon)</h3>
              <p className="text-white/70">Connect with other users</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h3 className="text-xl font-bold text-white mb-2">👤 Profile (Coming Soon)</h3>
              <p className="text-white/70">Manage your profile</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Placeholder components for missing pages
const PlaceholderPage: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center max-w-md">
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

const ProfilePage = () => <PlaceholderPage title="Profile Coming Soon" description="Your profile page will be available soon" />;
const ChatPage = () => <PlaceholderPage title="Chat Coming Soon" description="Chat functionality will be available soon" />;
const NotificationsPage = () => <PlaceholderPage title="Notifications Coming Soon" description="Notification center will be available soon" />;
const SettingsPage = () => <PlaceholderPage title="Settings Coming Soon" description="Settings page will be available soon" />;

import './App.css';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
      <Routes>
        {/* Public routes */}
        <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
        
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
  );
};

export default App;