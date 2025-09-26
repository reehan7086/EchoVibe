import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, LogOut, MessageSquare, Users, Search, Settings, User as UserIcon, Home 
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
    const pathToTab: Record<string, string> = {
      '/dashboard': 'feed',
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
          .select('*, profiles!related_user_id(username, full_name, avatar_url)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
  
        if (error) throw error;
        setNotifications(data || []);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
  
    fetchNotifications(); // call async function here
  
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        async (payload: any) => {
          if (payload.new.user_id === user.id) {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('username, full_name, avatar_url')
                .eq('id', payload.new.related_user_id)
                .single();
  
              const newNotification: Notification = {
                id: payload.new.id,
                user_id: payload.new.user_id,
                type: payload.new.type,
                content: payload.new.content,
                created_at: payload.new.created_at,
                is_read: payload.new.is_read,
                related_user_profile: profileData || undefined,
              };
  
              setNotifications(prev => [newNotification, ...prev]);
            } catch (err) {
              console.error('Error fetching related profile:', err);
            }
          }
        }
      )
      .subscribe();
  
    // CLEANUP: synchronous
    return () => {
      subscription.unsubscribe();
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

  // Mark a single notification as read
  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
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
            <Route path="" element={<FeedPage user={user} profile={profile} />} />
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
            </div>
          </div>
        </aside>
      </main>

      {/* Mobile nav and side menu */}
      {/* ...same as original, omitted for brevity */}
    </div>
  );
};

export default MainDashboard;
