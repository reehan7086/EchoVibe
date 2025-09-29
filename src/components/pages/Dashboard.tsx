// src/components/pages/Dashboard.tsx - MOBILE-FIRST REDESIGN
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, MessageCircle, Users, Menu, X, LogOut, Bell, MapPin, Settings
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

type Page = 'map' | 'messages' | 'profile' | 'notifications' | 'friends' | 'settings';

interface DashboardProps {
  user?: User;
}

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
      case 'map':
        return <MapComponent />;
      case 'messages':
        return <MessagesPage user={user} />;
      case 'friends':
        return <FriendsPage user={user} onStartChat={(friend) => {
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

  const navItems: Array<{ 
    key: string; 
    icon: any; 
    label: string; 
    badge?: number;
  }> = [
    { key: 'map', icon: MapPin, label: 'Map' },
    { key: 'messages', icon: MessageCircle, label: 'Chat' },
    { key: 'friends', icon: Users, label: 'Friends' },
    { key: 'notifications', icon: Bell, label: 'Alerts', badge: unreadCount },
    { key: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* MOBILE: Top Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10 px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between">
          {/* Profile Avatar */}
          <button 
            onClick={handleProfileClick}
            className="relative group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-sm font-bold border-2 border-purple-400 shadow-lg">
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
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
          </button>

          {/* Page Title */}
          <h1 className="text-white font-semibold text-lg">
            {navItems.find(item => item.key === activePage)?.label || 'SparkVibe'}
          </h1>

          {/* Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg bg-white/10 text-white"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* DESKTOP: Sidebar (hidden on mobile) */}
      <div className="hidden lg:flex fixed left-0 top-0 bottom-0 z-50 w-20 bg-black/40 backdrop-blur-xl border-r border-white/10 flex-col items-center py-4 gap-4">
        {/* Profile Avatar */}
        <button 
          onClick={handleProfileClick}
          className="relative group"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-sm font-bold border-2 border-purple-400 shadow-lg">
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
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
        </button>

        {/* Navigation Icons */}
        <nav className="flex-1 flex flex-col gap-3 w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.key;
            
            return (
              <button
                key={item.key}
                onClick={() => handlePageChange(item.key as Page)}
                className={`relative p-3 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={24} />
                
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="p-3 rounded-xl text-white/60 hover:text-red-400 hover:bg-white/10 transition-all"
        >
          <LogOut size={24} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden pt-16 lg:pt-0 pb-20 lg:pb-0 lg:ml-20">
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

      {/* MOBILE: Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-t border-white/10 pb-safe safe-area-bottom">
        <nav className="flex justify-around items-center px-2 py-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.key;
            
            return (
              <button
                key={item.key}
                onClick={() => handlePageChange(item.key as Page)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all min-w-[60px] ${
                  isActive ? 'text-purple-400' : 'text-white/60'
                }`}
              >
                <div className="relative">
                  <Icon size={24} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {item.badge > 9 ? '9' : item.badge}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-white">Menu</h2>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="p-2 rounded-lg bg-white/10 text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <nav className="space-y-2">
                  {navItems.map((item) => {
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

                <div className="mt-8 pt-8 border-t border-white/10">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                  </button>
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