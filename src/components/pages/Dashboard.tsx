// src/components/pages/Dashboard.tsx - Optimized with NO wasted space
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, MessageCircle, Users, Menu, X, LogOut, Bell, MapPin, Settings
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

  const navItems: Array<{ 
    key: string; 
    icon: any; 
    label: string; 
    badge?: number;
  }> = [
    { key: 'map', icon: MapPin, label: 'Vibe Map' },
    { key: 'messages', icon: MessageCircle, label: 'Messages' },
    { key: 'friends', icon: Users, label: 'Friends' },
    { key: 'notifications', icon: Bell, label: 'Alerts', badge: unreadCount },
    { key: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* COMPACT SIDEBAR - Only 80px wide, NO wasted space */}
      <div className={`
        fixed md:relative z-50 h-full
        ${menuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        transition-transform duration-300 ease-in-out
        w-20 bg-black/40 backdrop-blur-xl border-r border-white/10
        flex flex-col items-center py-4 gap-4
      `}>
        {/* Profile Avatar - Clickable */}
        <button 
          onClick={handleProfileClick}
          className="relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-full"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-sm font-bold border-2 border-purple-400 shadow-lg shadow-purple-500/50">
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
          
          {/* Tooltip */}
          <span className="absolute left-full ml-4 px-3 py-2 bg-black/90 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {profile?.full_name || 'Profile'}
          </span>
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
                className={`
                  relative p-3 rounded-xl transition-all group
                  ${isActive 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'}
                `}
              >
                <Icon size={24} />
                
                {/* Badge for notifications */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
                
                {/* Tooltip */}
                <span className="absolute left-full ml-4 px-3 py-2 bg-black/90 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="p-3 rounded-xl text-white/60 hover:text-red-400 hover:bg-white/10 transition-all relative group"
        >
          <LogOut size={24} />
          <span className="absolute left-full ml-4 px-3 py-2 bg-black/90 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            Logout
          </span>
        </button>
      </div>

      {/* Mobile Menu Button - Top Left */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-black/40 backdrop-blur-xl rounded-xl text-white border border-white/10 shadow-lg"
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Main Content - FULL SCREEN, NO MARGINS */}
      <div className="flex-1 h-full overflow-hidden">
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

      {/* Mobile overlay */}
      {menuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;