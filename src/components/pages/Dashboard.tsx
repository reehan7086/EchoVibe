// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Search, MessageCircle, Users, User as UserIcon, Settings, Menu, X, LogOut 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ChatComponent from './ChatPage';
import ProfileComponent from './ProfilePage';
import MapComponent from '../map/SecureVibeMap';
import SettingsComponent from './SettingsPage';

type Page = 'home' | 'search' | 'chat' | 'profile' | 'settings';

const Dashboard: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState<Page>('home');
  const [user, setUser] = useState<any>(null);

  // Fetch logged-in user info
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // If signed in via Google, fetch extra info
        if (user.user_metadata?.provider === 'google') {
          const { age, gender, termsAccepted } = user.user_metadata;
          await supabase.from('profiles').upsert({
            id: user.id,
            age,
            gender,
            terms_accepted: termsAccepted,
          });
        }
      }
    };
    fetchUser();
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <MapComponent />;
      case 'chat':
        return <ChatComponent user={user} />;
      case 'profile':
        return <ProfileComponent user={user} />;
      case 'settings':
        return <SettingsComponent user={user} />;
      default:
        return <MapComponent />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gray-100">
      {/* Sidebar Menu */}
      <motion.div 
        animate={{ width: menuOpen ? 250 : 60 }} 
        className="bg-white shadow-md flex flex-col transition-width duration-300"
      >
        <div className="p-4 flex justify-between items-center">
          <span className="font-bold text-lg">{menuOpen ? 'Menu' : ''}</span>
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>

        <div className="flex flex-col mt-4 space-y-4">
          <button onClick={() => setActivePage('home')} className="flex items-center space-x-2">
            <Home />
            {menuOpen && <span>Home</span>}
          </button>
          <button onClick={() => setActivePage('search')} className="flex items-center space-x-2">
            <Search />
            {menuOpen && <span>Search</span>}
          </button>
          <button onClick={() => setActivePage('chat')} className="flex items-center space-x-2">
            <MessageCircle />
            {menuOpen && <span>Chat</span>}
          </button>
          <button onClick={() => setActivePage('profile')} className="flex items-center space-x-2">
            <UserIcon />
            {menuOpen && <span>Profile</span>}
          </button>
          <button onClick={() => setActivePage('settings')} className="flex items-center space-x-2">
            <Settings />
            {menuOpen && <span>Settings</span>}
          </button>
          <button onClick={() => supabase.auth.signOut()} className="flex items-center space-x-2 text-red-500">
            <LogOut />
            {menuOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto relative">
        {/* Show user online status */}
        {user && (
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="font-semibold">{user.user_metadata?.full_name || user.email}</span>
          </div>
        )}

        {/* Render active page */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;
