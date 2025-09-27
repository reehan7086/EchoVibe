// src/components/MainDashboard.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Search, 
  MessageCircle, 
  Users, 
  User as UserIcon, 
  Settings, 
  Menu,
  X,
  LogOut 
} from 'lucide-react';
import { User, Profile } from '../types';
import { supabase } from '../lib/supabase';

// Import page components
import FeedPage from './pages/FeedPage';
import SearchPage from './pages/SearchPage';
import MessagesPage from './pages/MessagesPage';
import CommunitiesPage from './pages/CommunitiesPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

interface MainDashboardProps {
  user: User;
}

interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  is_online?: boolean;
}

type ActiveTab = 'feed' | 'search' | 'messages' | 'communities' | 'profile' | 'settings';

const navItems = [
  { id: 'feed' as ActiveTab, icon: Home, label: 'Feed' },
  { id: 'search' as ActiveTab, icon: Search, label: 'Search' },
  { id: 'messages' as ActiveTab, icon: MessageCircle, label: 'Messages' },
  { id: 'communities' as ActiveTab, icon: Users, label: 'Communities' },
  { id: 'profile' as ActiveTab, icon: UserIcon, label: 'Profile' },
  { id: 'settings' as ActiveTab, icon: Settings, label: 'Settings' },
];

export const MainDashboard: React.FC<MainDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [vibeScore] = useState(0);

  // Convert UserProfile to Profile for component props
  const convertToProfile = (userProfile: UserProfile | null): Profile | null => {
    if (!userProfile) return null;
    
    return {
      id: userProfile.id,
      user_id: userProfile.id,
      username: userProfile.username,
      full_name: userProfile.full_name,
      bio: '',
      avatar_url: userProfile.avatar_url,
      location: null,
      city: '',
      vibe_score: 0,
      is_online: userProfile.is_online || false,
      last_active: new Date().toISOString(),
      cards_generated: 0,
      cards_shared: 0,
      viral_score: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  };

  // Helper function for profile updates
  const handleProfileUpdate = (updates: Partial<Profile>) => {
    if (!userProfile) return;
    
    setUserProfile(prev => prev ? {
      ...prev,
      full_name: updates.full_name || prev.full_name,
      username: updates.username || prev.username,
      avatar_url: updates.avatar_url || prev.avatar_url,
      is_online: updates.is_online !== undefined ? updates.is_online : prev.is_online
    } : null);
  };

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
          return;
        }

        if (data) {
          setUserProfile({
            id: data.id,
            full_name: data.full_name,
            username: data.username,
            avatar_url: data.avatar_url,
            is_online: data.is_online
          });
          
          // Update status to online
          await supabase
            .from('profiles')
            .update({ is_online: true, last_active: new Date().toISOString() })
            .eq('id', user.id);
        } else {
          // Create profile if it doesn't exist
          const newProfile = {
            id: user.id,
            user_id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
            avatar_url: user.user_metadata?.avatar_url,
            is_online: true,
            last_active: new Date().toISOString()
          };

          const { data: insertedProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();

          if (!insertError && insertedProfile) {
            setUserProfile({
              id: insertedProfile.id,
              full_name: insertedProfile.full_name,
              username: insertedProfile.username,
              avatar_url: insertedProfile.avatar_url,
              is_online: insertedProfile.is_online
            });
          }
        }
      } catch (error) {
        console.error('Error in fetchUserProfile:', error);
      }
    };

    fetchUserProfile();

    // Set status to offline when component unmounts
    return () => {
      supabase
        .from('profiles')
        .update({ is_online: false })
        .eq('id', user.id);
    };
  }, [user]);

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      // Set status to offline before signing out
      if (userProfile) {
        await supabase
          .from('profiles')
          .update({ is_online: false })
          .eq('id', user.id);
      }
      
      await supabase.auth.signOut();
    }
  };

  const renderActiveTab = () => {
    const profileData = convertToProfile(userProfile);
    
    switch (activeTab) {
      case 'feed':
        return <FeedPage user={user} />;
      case 'search':
        return <SearchPage user={user} profile={profileData} />;
      case 'messages':
        return <MessagesPage user={user} />;
      case 'communities':
        return <CommunitiesPage user={user} />;
      case 'profile':
        return <ProfilePage user={user} />;
      case 'settings':
        return <SettingsPage user={user} profile={profileData} updateProfile={handleProfileUpdate} />;
      default:
        return <FeedPage user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-12 lg:gap-8 h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white/10 backdrop-blur-xl border-b border-white/10 p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            SparkVibe
          </h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-white hover:bg-white/10 rounded-lg"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className={`lg:col-span-3 xl:col-span-2 ${
          isMobileMenuOpen ? 'block' : 'hidden'
        } lg:block bg-white/5 backdrop-blur-xl border-r border-white/10 p-6 overflow-y-auto`}>
          {/* Logo */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              SparkVibe
            </h1>
          </div>

          {/* User Profile */}
          <div className="mb-8 p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center font-bold">
                  {userProfile?.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt="Your avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    userProfile?.full_name?.[0]?.toUpperCase() || 
                    user?.email?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 ${
                  userProfile?.is_online ? 'bg-green-400' : 'bg-gray-400'
                }`}></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">
                  {userProfile?.full_name || user?.user_metadata?.full_name || 'User'}
                </h3>
                <p className="text-sm text-white/60 truncate">
                  @{userProfile?.username || 'user'}
                </p>
              </div>
            </div>
            <div className="text-xs text-white/60">
              <div className="flex justify-between items-center">
                <span>Vibe Score</span>
                <span className="font-bold text-purple-400">{vibeScore}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Status</span>
                <span className={`capitalize font-medium ${
                  userProfile?.is_online ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {userProfile?.is_online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="space-y-2 mb-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </nav>

        {/* Main Content */}
        <main className="lg:col-span-9 xl:col-span-7 p-4 lg:p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderActiveTab()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Right Sidebar - Profile Summary */}
        <aside className="hidden xl:block xl:col-span-3 p-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sticky top-6">
            <h2 className="font-semibold text-white mb-4">Profile Summary</h2>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center font-bold">
                {userProfile?.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt="Your avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  userProfile?.full_name?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <div>
                <h3 className="font-medium text-white">
                  {userProfile?.full_name || 'User'}
                </h3>
                <p className="text-sm text-white/60">
                  @{userProfile?.username || 'user'}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Vibe Score</span>
                <span className="font-bold text-purple-400">{vibeScore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Status</span>
                <span className={`capitalize font-medium ${
                  userProfile?.is_online ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {userProfile?.is_online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MainDashboard;