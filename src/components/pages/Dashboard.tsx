// src/components/pages/Dashboard.tsx - ENHANCED VERSION (No Sidebar)
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, MessageCircle, Users, Menu, X, LogOut, Bell, MapPin, Settings,
  Activity, Compass, Zap as ZapIcon, Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

import MessagesPage from './MessagesPage';
import ProfilePage from './ProfilePage';
import MapComponent from '../map/SecureVibeMap';
import SettingsPage from './SettingsPage';
import NotificationsPage from './NotificationsPage';
import FriendsPage from './FriendsPage';
import LoadingSpinner from './LoadingSpinner';

type Page = 'feed' | 'explore' | 'map' | 'messages' | 'friends' | 'profile' | 'notifications' | 'settings';

interface DashboardProps {
  user?: User;
}

// Placeholder components for new features
const FeedPage: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6">
      <Activity className="w-10 h-10 text-white" />
    </div>
    <h2 className="text-2xl font-bold text-white mb-3">Activity Feed</h2>
    <p className="text-white/70 max-w-md mb-6">
      See what's happening around you. Check out nearby user activities, vibes, and moments.
    </p>
    <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4 text-left w-full max-w-md">
      <p className="text-white/80 text-sm mb-2">✨ Coming soon features:</p>
      <ul className="text-white/60 text-sm space-y-1 list-disc list-inside">
        <li>Real-time activity updates</li>
        <li>Nearby user vibes</li>
        <li>Community moments</li>
        <li>Trending topics</li>
      </ul>
    </div>
  </div>
);

const ExplorePage: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-6">
      <Compass className="w-10 h-10 text-white" />
    </div>
    <h2 className="text-2xl font-bold text-white mb-3">Explore</h2>
    <p className="text-white/70 max-w-md mb-6">
      Discover new communities, events, and places around you.
    </p>
    <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4 text-left w-full max-w-md">
      <p className="text-white/80 text-sm mb-2">🎯 Explore features:</p>
      <ul className="text-white/60 text-sm space-y-1 list-disc list-inside">
        <li>Local communities</li>
        <li>Upcoming events</li>
        <li>Popular hangout spots</li>
        <li>Interest-based groups</li>
      </ul>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ user: propUser }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState<Page>('map');
  const [user, setUser] = useState<User | null>(propUser || null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!user) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            setUser(authUser);
            await fetchProfile(authUser.id);
          }
        } else {
          await fetchProfile(user.id);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
        await supabase
          .from('profiles')
          .update({ 
            is_online: true, 
            last_active: new Date().toISOString() 
          })
          .eq('user_id', userId);
      } else {
        const defaultProfile = {
          user_id: userId,
          username: 'user_' + userId.slice(-8),
          full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'SparkVibe User',
          bio: '',
          avatar_url: user?.user_metadata?.avatar_url || null,
          is_online: true,
          reputation_score: 50,
          vibe_score: 50,
          privacy_level: 'public',
          created_at: new Date().toISOString()
        };
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(defaultProfile);
          
        if (!insertError) {
          setProfile(defaultProfile);
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching notifications:', error);
          return;
        }

        setNotifications(data || []);
        setUnreadCount((data || []).filter(n => !n.read).length);
      } catch (error) {
        console.error('Error in fetchNotifications:', error);
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new as any, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      if (user) {
        await supabase
          .from('profiles')
          .update({ 
            is_online: false,
            last_active: new Date().toISOString() 
          })
          .eq('user_id', user.id);
      }
      
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handlePageChange = (page: Page) => {
    setActivePage(page);
    setMenuOpen(false);
  };

  const handleProfileClick = () => {
    setActivePage('profile');
    setMenuOpen(false);
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const renderPage = () => {
    if (!user) return <LoadingSpinner message="Loading user data..." />;

    switch (activePage) {
      case 'feed':
        return <FeedPage />;
      case 'explore':
        return <ExplorePage />;
      case 'map':
        return <MapComponent />;
      case 'messages':
        return <MessagesPage user={user} />;
      case 'friends':
        return <FriendsPage user={user} onStartChat={(friend: import('./FriendsPage').FriendWithProfile) => {
          setActivePage('messages');
        }} />;
      case 'profile':
        return <ProfilePage user={user} />;
      case 'notifications':
        return (
          <NotificationsPage 
            user={user}
            notifications={notifications}
            onMarkAsRead={markNotificationAsRead}
            onMarkAllAsRead={markAllNotificationsAsRead}
          />
        );
      case 'settings':
        return <SettingsPage user={user} />;
      default:
        return <MapComponent />;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-4">Please log in to access the dashboard.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Main navigation items for bottom nav (5 items max for mobile)
  type NavItem = {
    key: string;
    icon: React.ForwardRefExoticComponent<any>;
    label: string;
    badge?: number;
  };

  const mainNavItems: NavItem[] = [
    { key: 'feed', icon: Activity, label: 'Feed' },
    { key: 'explore', icon: Compass, label: 'Explore' },
    { key: 'map', icon: MapPin, label: 'Map' },
    { key: 'messages', icon: MessageCircle, label: 'Chat' },
    { key: 'friends', icon: Users, label: 'Friends' },
  ];

  // Additional menu items (accessible via menu)
  const menuItems = [
    ...mainNavItems,
    { key: 'notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
    { key: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Top Header - Clean and Simple */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10 px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <ZapIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg hidden sm:inline">SparkVibe</span>
          </div>

          {/* Center - Page Title (Mobile) */}
          <div className="absolute left-1/2 -translate-x-1/2 sm:hidden">
            <h1 className="text-white font-semibold text-base">
              {mainNavItems.find(item => item.key === activePage)?.label || 'SparkVibe'}
            </h1>
          </div>

          {/* Right Side - Profile & Menu */}
          <div className="flex items-center gap-3">
            {/* Notifications Quick Access */}
            <button
              onClick={() => handlePageChange('notifications')}
              className="relative p-2 rounded-lg hover:bg-white/10 transition-all"
            >
              <Bell className="w-5 h-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Profile Avatar with Online Status */}
            <button 
              onClick={handleProfileClick}
              className="relative group"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-sm font-bold border-2 border-purple-400 shadow-lg transition-transform group-hover:scale-105">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile?.full_name || 'User'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  profile?.full_name?.[0]?.toUpperCase() || 
                  user.email?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              {/* Online Status Indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
            </button>

            {/* Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden pt-16 pb-20 max-w-screen-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation Bar - 5 Main Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-t border-white/10 pb-safe">
        <nav className="flex justify-around items-center px-2 py-2 max-w-screen-2xl mx-auto">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.key;
            
            return (
              <button
                key={item.key}
                onClick={() => handlePageChange(item.key as Page)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all min-w-[60px] touch-target ${
                  isActive ? 'text-purple-400' : 'text-white/60'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute bottom-0 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" 
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Slide-out Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-white">Menu</h2>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* User Info */}
                <div className="bg-white/5 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-sm font-bold">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile?.full_name || 'User'}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          profile?.full_name?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">{profile?.full_name || 'User'}</p>
                      <p className="text-white/60 text-sm truncate">@{profile?.username || 'username'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Vibe Score</span>
                    <span className="text-purple-400 font-bold">{profile?.vibe_score || 50}/100</span>
                  </div>
                </div>

                {/* Menu Navigation */}
                <nav className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.key;
                    
                    return (
                      <button
                        key={item.key}
                        onClick={() => handlePageChange(item.key as Page)}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Icon size={20} />
                        <span className="font-medium flex-1 text-left">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-bold">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>

                {/* Logout */}
                <div className="mt-8 pt-8 border-t border-white/10">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>

                {/* App Version */}
                <div className="mt-6 text-center text-white/40 text-xs">
                  SparkVibe v1.0.0
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;