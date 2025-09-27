// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

// Core components
import LandingPage from './components/LandingPage';
import SecureVibeMap from './components/map/SecureVibeMap';
import LoadingSpinner from './components/LoadingSpinner';
import Login from './components/auth/Login';
import Signup from './components/SignUpPage'; // fixed path
import Dashboard from './components/Dashboard'; // make sure Dashboard.tsx exists and expects 'user' prop

// Placeholder components
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
        if (error) console.error('Error getting session:', error);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/dashboard" replace />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" replace />} />
      <Route path="/map" element={user ? <SecureVibeMap /> : <Navigate to="/login" replace />} />
      <Route path="/profile/:userId?" element={user ? <ProfilePage /> : <Navigate to="/login" replace />} />
      <Route path="/chat/:chatId?" element={user ? <ChatPage /> : <Navigate to="/login" replace />} />
      <Route path="/notifications" element={user ? <NotificationsPage /> : <Navigate to="/login" replace />} />
      <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/login" replace />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
};

export default App;