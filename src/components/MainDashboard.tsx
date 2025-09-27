// src/components/MainDashboard.tsx - Updated for Map-focused SparkVibe
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map, 
  MessageCircle, 
  Users, 
  User as UserIcon, 
  Settings, 
  Menu,
  X,
  LogOut,
  MapPin
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { Profile } from '../types';
import { supabase } from '../lib/supabase';

// Import page components
import MapPage from './pages/MapPage';
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
  location?: { lat: number; lng: number };
  city?: string;
  mood?: string;
}

type ActiveTab = 'map' | 'messages' | 'communities' | 'profile' | 'settings';

const navItems = [
  { id: 'map' as ActiveTab, icon: Map, label: 'Vibe Map' },
  { id: 'messages' as ActiveTab, icon: MessageCircle, label: 'Messages' },
  { id: 'communities' as ActiveTab, icon: Users, label: 'Communities' },
  { id: 'profile' as ActiveTab, icon: UserIcon, label: 'Profile' },
  { id: 'settings' as ActiveTab, icon: Settings, label: 'Settings' },
];

export const MainDashboard: React.FC<MainDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('map'); // Default to map
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<UserProfile[]>([]);

  // Convert UserProfile to Profile for component props
  const convertToProfile = (userProfile: UserProfile | null): Profile | null => {
    if (!userProfile) return null;
    
    return {
      id: userProfile.id,
      user_id: userProfile.user_id,
      username: userProfile.username,
      full_name: userProfile.full_name,
      bio: '',
      avatar_url: userProfile.avatar_url,
      location: userProfile.location ? `${userProfile.location.lat},${userProfile.location.lng}` : undefined,
      city: userProfile.city || '',
      is_online: userProfile.is_online || false,
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

  // Fetch user profile and set up location
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
          return;
        }

        if (data) {
          setUserProfile({
            id: data.id,
            user_id: data.user_id,
            full_name: data.full_name,
            username: data.username,
            avatar_url: data.avatar_url,
            is_online: data.is_online,
            location: data.location ? JSON.parse(data.location) : null,
            city: data.city,
            mood: data.mood
          });
          
          // Update status to online
          await supabase
            .from('profiles')
            .update({ 
              is_online: true, 
              last_active: new Date().toISOString() 
            })
            .eq('user_id', user.id);
        } else {
          // Create profile if it doesn't exist
          const newProfile = {
            user_id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
            avatar_url: user.user_metadata?.avatar_url,
            is_online: true,
            last_active: new Date().toISOString(),
            mood: 'happy'
          };

          const { data: insertedProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();

          if (!insertError && insertedProfile) {
            setUserProfile({
              id: insertedProfile.id,
              user_id: insertedProfile.user_id,
              full_name: insertedProfile.full_name,
              username: insertedProfile.username,
              avatar_url: insertedProfile.avatar_url,
              is_online: insertedProfile.is_online,
              location: insertedProfile.location ? JSON.parse(insertedProfile.location) : undefined,
              city: insertedProfile.city,
              mood: insertedProfile.mood
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
        .eq('user_id', user.id);
    };
  }, [user]);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };
          
          // Update user's location in database
          await supabase
            .from('profiles')
            .update({ 
              location: JSON.stringify(location),
              last_active: new Date().toISOString()
            })
            .eq('user_id', user.id);

          setUserProfile(prev => prev ? { ...prev, location } : null);
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Use default location (Dubai) if permission denied
          const defaultLocation = { lat: 25.276987, lng: 55.296249 };
          setUserProfile(prev => prev ? { ...prev, location: defaultLocation } : null);
        }
      );
    }
  }, [user]);

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      // Set status to offline before signing out
      if (userProfile) {
        await supabase
          .from('profiles')
          .update({ is_online: false })
          .eq('user_id', user.id);
      }
      
      await supabase.auth.signOut();
    }
  };

  const renderActiveTab = () => {
    const profileData = convertToProfile(userProfile);
    
    switch (activeTab) {
      case 'map':
        return <MapPage />;
      case 'messages':
        return <MessagesPage user={user} />;
      case 'communities':
        return <CommunitiesPage user={user} />;
      case 'profile':
        return <ProfilePage user={user} />;
      case 'settings':
        return <SettingsPage user={user} profile={profileData} updateProfile={handleProfileUpdate} />;
      default:
        return <MapPage />; // Always default to map
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-12 lg:gap-8 h-screen">
        {/* Sidebar for desktop */}
        <div className="hidden lg:block lg:col-span-2 bg-black bg-opacity-20 backdrop-blur-lg p-4">
          <div className="flex flex-col h-full">
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
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-white" />
            <span className="text-white font-bold">SparkVibe</span>
          </div>
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
                <div className="flex-1 space-y-4 mt-16">
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
        <div className="col-span-12 lg:col-span-10 pt-16 lg:pt-0">
          <div className="h-screen overflow-y-auto">
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
      </div>
    </div>
  );
};

export default MainDashboard;