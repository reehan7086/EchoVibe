// src/components/pages/Dashboard.tsx - Fixed Navigation and Profile Click
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, MessageCircle, Users, Menu, X, LogOut, Bell, MapPin
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

// Import all necessary components
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

  // Fetch user and profile data
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

  // Fetch user profile
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
        // Update online status
        await supabase
          .from('profiles')
          .update({ 
            is_online: true, 
            last_active: new Date().toISOString() 
          })
          .eq('user_id', userId);
      } else {
        // Create default profile if none exists
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
        
        // Try to create the profile
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

  // Fetch notifications
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

    // Subscribe to real-time notifications
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

  // Handle user logout
  const handleLogout = async () => {
    try {
      if (user) {
        // Update online status before logout
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

  // Handle page navigation
  const handlePageChange = (page: Page) => {
    setActivePage(page);
    setMenuOpen(false);
  };

  // Handle profile click - open profile page
  const handleProfileClick = () => {
    setActivePage('profile');
    setMenuOpen(false);
  };

  // Mark notification as read
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

  // Mark all notifications as read
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

  // Render page content based on active page
  const renderPage = () => {
    if (!user) return <LoadingSpinner message="Loading user data..." />;

    switch (activePage) {
      case 'map':
        return <MapComponent />;
      case 'messages':
        return <MessagesPage user={user} />;
      case 'friends':
        return <FriendsPage user={user} onStartChat={(friend) => {
          // Switch to messages page when starting a chat
          setActivePage('messages');
          // You can add additional logic here to open specific chat
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
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

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Sidebar Menu */}
      <motion.div 
        animate={{ width: menuOpen ? 280 : 80 }} 
        className="bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300 relative z-10"
      >
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b border-white/10">
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg text-white">SparkVibe</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-all text-white"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* User Profile Section - Clickable */}
        <div className="p-4 border-b border-white/10">
          <button 
            onClick={handleProfileClick}
            className="w-full flex items-center gap-3 hover:bg-white/10 rounded-lg p-2 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
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
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 min-w-0 text-left"
                >
                  <h3 className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                    {profile?.full_name || user.email}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-white/60">Online • Click to view profile</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {[
              { key: 'map', icon: MapPin, label: 'Vibe Map', description: 'Discover nearby vibes' },
              { key: 'messages', icon: MessageCircle, label: 'Messages', description: 'Chat with connections' },
              { key: 'friends', icon: Users, label: 'Friends', description: 'Your connections' },
              { key: 'notifications', icon: Bell, label: 'Notifications', description: 'Your alerts', badge: unreadCount > 0 ? unreadCount : undefined },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.key;
              
              return (
                <button
                  key={item.key}
                  onClick={() => handlePageChange(item.key as Page)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-purple-400' : ''
                  }`} />
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.label}</span>
                          {item.badge && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/50">{item.description}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-r-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Settings Section */}
          <div className="mt-8 pt-4 border-t border-white/10">
            <button
              onClick={() => handlePageChange('settings')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative ${
                activePage === 'settings'
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                activePage === 'settings' ? 'text-purple-400' : ''
              }`} />
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 text-left"
                  >
                    <span className="font-medium">Settings</span>
                    <p className="text-xs text-white/50">App preferences</p>
                  </motion.div>
                )}
              </AnimatePresence>
              {activePage === 'settings' && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-r-full" />
              )}
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <AnimatePresence>
              {menuOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="font-medium"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {/* Page Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full overflow-auto"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile overlay when menu is open */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-5 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;