import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Menu, X, LogOut, MessageSquare, Users, Search, Settings, User as UserIcon, Home 
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

  // Set active tab based on route
  useEffect(() => {
    const pathToTab = {
      '/dashboard': 'feed',
      '/dashboard/search': 'search', 
      '/dashboard/messages': 'messages',
      '/dashboard/communities': 'communities',
      '/dashboard/profile': 'profile',
      '/dashboard/settings': 'settings'
    } as const;
    setActiveTab(pathToTab[location.pathname as keyof typeof pathToTab] || 'feed');
  }, [location.pathname]);

  // Fetch notifications and subscribe to changes
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*, profiles!related_user_id(username, full_name, avatar_url)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
  
        if (error) throw error;
        setNotifications(data || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications(); // ✅ call async function

    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        async (payload: any) => {
          if (payload.new.user_id === user?.id) {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('username, full_name, avatar_url')
                .eq('user_id', payload.new.related_user_id)
                .single();

              setNotifications(prev => [
                { ...payload.new, related_user_profile: profileData || null } as Notification,
                ...prev,
              ]);
            } catch (err) {
              console.error('Error fetching related user profile:', err);
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe(); // ✅ cleanup
    };
  }, [user.id]);

  // Logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Notifications handlers
  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id);
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
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
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all lg:hidden"
            aria-label="Open menu"
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
          </nav>
        </aside>

        {/* Main content */}
        <section className="lg:col-span-6">
          <Routes>
            <Route path="/" element={<FeedPage user={user} profile={profile} />} />
            <Route path="/search" element={<SearchPage user={user} profile={profile} />} />
            <Route path="/messages" element={<MessagesPage user={user} />} />
            <Route path="/communities" element={<CommunitiesPage user={user} />} />
            <Route path="/profile" element={<ProfilePage user={user} profile={profile} onLogout={handleLogout} />} />
            <Route path="/settings" element={<SettingsPage user={user} profile={profile} updateProfile={updateProfile} />} />
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
              <div className="flex justify-between text-center">
                <div>
                  <div className="text-lg font-bold text-purple-400">0</div>
                  <div className="text-xs text-white/60">Posts</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-400">0</div>
                  <div className="text-xs text-white/60">Followers</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-400">0</div>
                  <div className="text-xs text-white/60">Following</div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Mobile nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-t border-white/10 lg:hidden">
        <div className="flex items-center justify-around py-2">
          {navigationItems.slice(0, 4).map(item => (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                activeTab === item.id ? 'text-purple-400 bg-purple-500/10' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setSideMenuOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all text-white/60 hover:text-white hover:bg-white/5"
          >
            <UserIcon className="w-6 h-6" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile Side Menu */}
      <AnimatePresence>
        {sideMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-60 lg:hidden"
              onClick={() => setSideMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed top-0 left-0 h-full w-80 bg-black/90 backdrop-blur-xl z-70 p-6 lg:hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center font-bold text-xl">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name || 'User'} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    profile?.full_name?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{profile?.full_name || 'User'}</h2>
                  <p className="text-white/60">@{profile?.username || 'user'}</p>
                </div>
              </div>
              <nav className="space-y-2">
                <Link to="/dashboard/profile" onClick={() => setSideMenuOpen(false)} className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition-all text-left">
                  <UserIcon className="w-6 h-6" /> Profile
                </Link>
                <Link to="/dashboard/settings" onClick={() => setSideMenuOpen(false)} className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition-all text-left">
                  <Settings className="w-6 h-6" /> Settings
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-red-500/10 text-red-400 transition-all text-left mt-8">
                  <LogOut className="w-6 h-6" /> Sign Out
                </button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainDashboard;
