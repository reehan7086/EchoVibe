import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Users, Menu, X, LogOut, Bell, MapPin, Settings,
  Zap as ZapIcon
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

type Page = 'map' | 'messages' | 'friends' | 'notifications' | 'settings' | 'profile';

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

  // Heartbeat to keep user online
  useEffect(() => {
    if (!user) return;

    const updateOnlineStatus = async () => {
      await supabase
        .from('profiles')
        .update({ 
          is_online: true, 
          last_active: new Date().toISOString(),
          last_ping: new Date().toISOString()
        })
        .eq('user_id', user.id);
    };

    updateOnlineStatus();
    const interval = setInterval(updateOnlineStatus, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

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
            last_active: new Date().toISOString(),
            last_ping: new Date().toISOString()
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
        return <FriendsPage user={user} onStartChat={(friend: any) => {
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

  const mainNavItems = [
    { key: 'map', icon: MapPin, label: 'Vibe Map' },
    { key: 'messages', icon: MessageCircle, label: 'Chat' },
    { key: 'friends', icon: Users, label: 'Friends' },
    { key: 'notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
    { key: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Top Header */}
      <div className="flex-shrink-0 bg-black/40 backdrop-blur-xl border-b border-white/10 px-4 py-3 z-40">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <ZapIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg hidden sm:inline">SparkVibe</span>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 sm:hidden">
            <h1 className="text-white font-semibold text-base">
              {mainNavItems.find(item => item.key === activePage)?.label || 'SparkVibe'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
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
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
            </button>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Full height minus header and bottom nav */}
      <div className="flex-1 overflow-hidden">
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

      {/* Bottom Navigation */}
      <div className="flex-shrink-0 bg-black/40 backdrop-blur-xl border-t border-white/10 z-40">
        <nav className="flex justify-around items-center px-2 py-3 max-w-screen-2xl mx-auto">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.key;
            
            return (
              <button
                key={item.key}
                onClick={() => handlePageChange(item.key as Page)}
                className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all min-w-[60px] ${
                  isActive ? 'text-purple-400' : 'text-white/60'
                }`}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
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

                <div className="space-y-2 mb-6">
                  <button
                    onClick={handleProfileClick}
                    className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg transition-all"
                  >
                    View Profile
                  </button>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>

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