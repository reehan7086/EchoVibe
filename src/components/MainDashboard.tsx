import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, LogOut, MessageSquare, Users, Search, Settings, User as UserIcon, Home, X 
} from 'lucide-react';

// Pages
import FeedPage from './pages/FeedPage';
import SearchPage from './pages/SearchPage';
import MessagesPage from './pages/MessagesPage';
import CommunitiesPage from './pages/CommunitiesPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

// Components
import NotificationBell from './common/NotificationBell';

import { Profile, Notification } from '../types';
import { supabase } from '../lib/supabase';

interface MainDashboardProps {
  user: User;
  profile: Profile | null;
}

const MainDashboard: React.FC<MainDashboardProps> = ({ user, profile }) => {
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to create complete profile from partial data
  const createCompleteProfile = (partialProfile: any): Profile | undefined => {
    if (!partialProfile) return undefined;
    
    return {
      id: partialProfile.id || '',
      user_id: partialProfile.user_id || '',
      username: partialProfile.username || '',
      full_name: partialProfile.full_name || '',
      bio: partialProfile.bio,
      avatar_url: partialProfile.avatar_url,
      location: partialProfile.location,
      city: partialProfile.city,
      created_at: partialProfile.created_at || new Date().toISOString(),
      updated_at: partialProfile.updated_at,
      vibe_score: partialProfile.vibe_score || 0,
      is_online: partialProfile.is_online || false,
      last_active: partialProfile.last_active
    };
  };

  // Set active tab based on route
  useEffect(() => {
    const pathToTab: Record<string, string> = {
      '/dashboard': 'feed',
      '/dashboard/': 'feed',
      '/dashboard/search': 'search', 
      '/dashboard/messages': 'messages',
      '/dashboard/communities': 'communities',
      '/dashboard/profile': 'profile',
      '/dashboard/settings': 'settings',
    };
    setActiveTab(pathToTab[location.pathname] || 'feed');
  }, [location.pathname]);

  // Fetch notifications and subscribe to real-time changes
  useEffect(() => {
    if (!user?.id) return;
  
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select(`
            id,
            user_id,
            related_user_id,
            type,
            message,
            created_at,
            read,
            profiles!related_user_id(
              id,
              user_id,
              username,
              full_name,
              avatar_url,
              vibe_score,
              is_online,
              created_at,
              updated_at,
              bio,
              location,
              city,
              last_active
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
  
        if (error) throw error;

        const mappedNotifications = data?.map(notification => ({
          ...notification,
          content: notification.message,
          is_read: notification.read,
          related_user_profile: createCompleteProfile(notification.profiles)
        })) || [];

        setNotifications(mappedNotifications);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
  
    fetchNotifications();
  
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, async (payload: any) => {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select(`
              id,
              user_id,
              username,
              full_name,
              avatar_url,
              vibe_score,
              is_online,
              created_at,
              updated_at,
              bio,
              location,
              city,
              last_active
            `)
            .eq('user_id', payload.new.related_user_id)
            .single();

          const newNotification = {
            ...payload.new,
            content: payload.new.message,
            is_read: payload.new.read,
            related_user_profile: createCompleteProfile(profileData)
          };

          setNotifications(prev => [newNotification, ...prev]);
        } catch (err) {
          console.error('Error fetching related profile:', err);
        }
      })
      .subscribe();
  
    return () => {
      subscription.unsubscribe();
    };
  }, [user.id]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
        
      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true, is_read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const navigationItems = [
    { id: 'feed', label: 'Feed', icon: Home, path: '/dashboard' },
    { id: 'search', label: 'Search', icon: Search, path: '/dashboard/search' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/dashboard/messages' },
    { id: 'communities', label: 'Communities', icon: Users, path: '/dashboard/communities' },
    { id: 'profile', label: 'Profile', icon: UserIcon, path: '/dashboard/profile' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSideMenuOpen(true)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 transition-all lg:hidden"
            aria-label="Open menu"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              minHeight: '44px',
              minWidth: '44px'
            }}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            SparkVibe
          </h1>
          <NotificationBell
            notifications={notifications}
            onMarkAsRead={handleMarkNotificationAsRead}
            onMarkAllAsRead={handleMarkAllNotificationsAsRead}
          />
        </div>
      </header>

      {/* Main layout */}
      <main className="pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-3">
          <nav className="space-y-2 sticky top-24">
            {navigationItems.map(item => (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                  activeTab === item.id ? 'text-purple-400 bg-purple-500/10' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-6 h-6" />
                {item.label}
              </Link>
            ))}
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 p-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all mt-8"
            >
              <LogOut className="w-6 h-6" />
              Logout
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <section className="lg:col-span-6">
          <Routes>
            {/* Fixed: Use relative paths for nested routes */}
            <Route index element={<FeedPage user={user} profile={profile} />} />
            <Route path="search" element={<SearchPage user={user} profile={profile} />} />
            <Route path="messages" element={<MessagesPage user={user} />} />
            <Route path="communities" element={<CommunitiesPage user={user} />} />
            <Route path="profile" element={<ProfilePage user={user} profile={profile} onLogout={handleLogout} />} />
            <Route path="settings" element={<SettingsPage user={user} profile={profile} updateProfile={updateProfile} />} />
          </Routes>
        </section>

        {/* Right sidebar */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="space-y-6 sticky top-24">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
              <h3 className="font-semibold text-lg mb-4">Profile Summary</h3>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center font-bold text-lg">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name || 'User'} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    profile?.full_name?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <h4 className="font-medium">{profile?.full_name || 'User'}</h4>
                  <p className="text-sm text-white/60">@{profile?.username || 'user'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-400">{profile?.vibe_score || 0}</div>
                  <div className="text-xs text-white/60">Vibe Score</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-400">
                    {profile?.is_online ? 'Online' : 'Offline'}
                  </div>
                  <div className="text-xs text-white/60">Status</div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Mobile side menu */}
      <AnimatePresence>
        {sideMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSideMenuOpen(false)}
            />
            
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed left-0 top-0 h-full w-64 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 z-50 lg:hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-white">SparkVibe</h2>
                  <button
                    onClick={() => setSideMenuOpen(false)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 transition-all"
                    style={{ 
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation',
                      minHeight: '44px',
                      minWidth: '44px'
                    }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center space-x-3 mb-6 p-3 rounded-lg bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center font-bold">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name || 'User'} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      profile?.full_name?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{profile?.full_name || 'User'}</h4>
                    <p className="text-sm text-white/60">@{profile?.username || 'user'}</p>
                  </div>
                </div>
                
                <nav className="space-y-2">
                  {navigationItems.map(item => (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSideMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        activeTab === item.id ? 'text-purple-400 bg-purple-500/10' : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation'
                      }}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  ))}
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      setSideMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 active:bg-red-500/20 transition-all mt-6"
                    style={{ 
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation',
                      minHeight: '44px'
                    }}
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainDashboard;