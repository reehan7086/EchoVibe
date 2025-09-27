// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, MessageCircle, Users, User as UserIcon, Settings, Menu, X, LogOut 
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import SecureVibeMap from './map/SecureVibeMap';

// Placeholder pages
const PlaceholderPage: React.FC<{ title: string; description: string; icon: string }> = ({ title, description, icon }) => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center max-w-md">
      <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
        {icon}
      </div>
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      <p className="text-white/70 mb-6">{description}</p>
    </div>
  </div>
);

interface DashboardProps {
  user: User;
}

type ActiveTab = 'map' | 'chat' | 'communities' | 'profile' | 'settings';

const navItems: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
  { id: 'map', label: 'Vibe Map', icon: MapPin },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'communities', label: 'Communities', icon: Users },
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    if (confirm('Sign out?')) {
      await supabase.auth.signOut();
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'map':
        return <SecureVibeMap />;
      case 'chat':
        return <PlaceholderPage title="Secure Chat" description="Encrypted chat coming soon" icon="💬" />;
      case 'communities':
        return <PlaceholderPage title="Communities" description="Join vibrant communities soon" icon="👥" />;
      case 'profile':
        return <PlaceholderPage title="Profile" description="Your profile features coming soon" icon="👤" />;
      case 'settings':
        return <PlaceholderPage title="Settings" description="Manage your preferences soon" icon="⚙️" />;
      default:
        return <SecureVibeMap />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-60 bg-black bg-opacity-20 backdrop-blur-lg p-4">
        <div className="flex items-center space-x-2 mb-8">
          <MapPin className="w-6 h-6 text-white" />
          <span className="text-white font-bold text-lg">SparkVibe</span>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                activeTab === item.id ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button
          onClick={handleSignOut}
          className="mt-auto w-full flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-300 hover:bg-white/10"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black bg-opacity-30 backdrop-blur-lg p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-white" />
          <span className="text-white font-bold">SparkVibe</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black bg-opacity-70 backdrop-blur-lg z-40"
          >
            <div className="flex flex-col h-full p-8">
              <div className="flex-1 space-y-4 mt-16">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-6 py-3 rounded-2xl text-lg ${
                      activeTab === item.id ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <item.icon className="w-6 h-6" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={handleSignOut}
                className="mt-auto w-full flex items-center space-x-3 px-6 py-3 rounded-2xl text-lg text-gray-300 hover:bg-white/10"
              >
                <LogOut className="w-6 h-6" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="lg:pl-60 pt-16 lg:pt-0 h-screen overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {renderActiveTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;
