// src/components/MainDashboard.tsx
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

// Match schema: profiles(id PK, user_id FK)
interface UserProfile {
  id: string;           // profile row id
  user_id: string;      // auth.users.id
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
      user_id: userProfile.user_id,  // ✅ fixed
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
          .eq('user_id', user.id)  // ✅ schema uses user_id
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
          return;
        }

        if (data) {
          setUserProfile({
            id: data.id,
            user_id: data.user_id,  // ✅ include user_id
            full_name: data.full_name,
            username: data.username,
            avatar_url: data.avatar_url,
            is_online: data.is_online
          });
          
          // Update status to online
          await supabase
            .from('profiles')
            .update({ is_online: true, last_active: new Date().toISOString() })
            .eq('user_id', user.id);
        } else {
          // Create profile if it doesn't exist
          const newProfile = {
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
              user_id: insertedProfile.user_id, // ✅ fixed
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
        .eq('user_id', user.id);  // ✅ schema fixed
    };
  }, [user]);

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      // Set status to offline before signing out
      if (userProfile) {
        await supabase
          .from('profiles')
          .update({ is_online: false })
          .eq('user_id', user.id);  // ✅ schema fixed
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
        {/* Sidebar for desktop */}
        <div className="hidden lg:block lg:col-span-2 bg-black bg-opacity-20 backdrop-blur-lg p-4">
          <div className="flex flex-col h-full">
            <div className="flex items-center space-x-2 mb-8">
              <Users className="w-6 h-6 text-white" />
              <span className="text-white font-bold text-lg">SparkVibe</span>
            </div>
            <nav className="flex-1 space-y-2">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                    activeTab === item.id 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="mt-auto">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-300 hover:bg-white/10"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-black bg-opacity-30 backdrop-blur-lg z-50 p-4 flex justify-between items-center">
          <span className="text-white font-bold">SparkVibe</span>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white"
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black bg-opacity-70 backdrop-blur-lg z-40"
            >
              <div className="flex flex-col h-full p-8">
                <div className="flex-1 space-y-4">
                  {navItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-6 py-3 rounded-2xl text-lg ${
                        activeTab === item.id 
                          ? 'bg-purple-600 text-white' 
                          : 'text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <item.icon className="w-6 h-6" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-auto">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 px-6 py-3 rounded-2xl text-lg text-gray-300 hover:bg-white/10"
                  >
                    <LogOut className="w-6 h-6" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="col-span-12 lg:col-span-7 pt-16 lg:pt-0">
          <div className="h-screen overflow-y-auto p-4 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderActiveTab()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block lg:col-span-3 bg-black bg-opacity-20 backdrop-blur-lg p-6">
          <div className="space-y-6">
            {userProfile && (
              <div className="bg-white/10 rounded-2xl p-4 text-white">
                <div className="flex items-center space-x-4">
                  {userProfile.avatar_url ? (
                    <img 
                      src={userProfile.avatar_url} 
                      alt={userProfile.full_name} 
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                      <UserIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{userProfile.full_name}</h3>
                    <p className="text-sm text-gray-300">@{userProfile.username}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-300">Vibe Score</p>
                  <p className="text-2xl font-bold text-purple-400">{vibeScore}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
