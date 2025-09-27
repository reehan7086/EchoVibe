// src/components/pages/NotificationsPage.tsx - Fixed to match Dashboard props
import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, Filter, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../utils';

interface Notification {
  id: string;
  user_id: string;
  related_user_id?: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  related_user_profile?: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface NotificationsPageProps {
  user: User;
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ 
  user, 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead 
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [loading, setLoading] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'read':
        return notification.read;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setLoading(true);
      await onMarkAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await onMarkAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      // Note: In a real app, you'd want to update the parent component's state here
      // For now, we'll just refresh the page or handle it in the parent
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleBulkMarkAsRead = async () => {
    try {
      setLoading(true);
      await Promise.all(
        selectedNotifications.map(id => onMarkAsRead(id))
      );
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error marking selected notifications as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
        return '👤';
      case 'friend_request':
        return '🤝';
      case 'mention':
        return '@';
      case 'match':
        return '⚡';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'like':
        return 'from-red-500/20 to-pink-500/20 border-red-500/30';
      case 'comment':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      case 'follow':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'friend_request':
        return 'from-purple-500/20 to-violet-500/20 border-purple-500/30';
      case 'match':
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
      default:
        return 'from-gray-500/20 to-slate-500/20 border-gray-500/30';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-white/60">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All Read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/60" />
          <span className="text-white/60 text-sm">Filter:</span>
        </div>
        
        {['all', 'unread', 'read'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption as any)}
            className={`px-3 py-1 rounded-full text-sm transition-all ${
              filter === filterOption
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            {filterOption === 'unread' && unreadCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-white">
              {selectedNotifications.length} notification{selectedNotifications.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkMarkAsRead}
                disabled={loading}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark Read
              </button>
              <button
                onClick={() => setSelectedNotifications([])}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          <AnimatePresence>
            {filteredNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`bg-gradient-to-r ${getNotificationColor(notification.type)} backdrop-blur-xl rounded-xl border p-4 transition-all hover:bg-white/5 ${
                  !notification.read ? 'ring-2 ring-purple-500/50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={() => toggleNotificationSelection(notification.id)}
                    className="mt-1 w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />

                  {/* Notification Icon */}
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-xl">
                    {notification.related_user_profile?.avatar_url ? (
                      <img
                        src={notification.related_user_profile.avatar_url}
                        alt={notification.related_user_profile.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getNotificationIcon(notification.type)
                    )}
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${
                      !notification.read ? 'text-white' : 'text-white/80'
                    }`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-white/40">
                        {formatDate(notification.created_at)}
                      </span>
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={loading}
                            className="px-2 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded text-xs transition-all disabled:opacity-50 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          disabled={loading}
                          className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Unread Indicator */}
                  {!notification.read && (
                    <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0 mt-1" />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-white/40" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {filter === 'unread' ? 'No unread notifications' : 
               filter === 'read' ? 'No read notifications' : 'No notifications yet'}
            </h3>
            <p className="text-white/60 max-w-md mx-auto">
              {filter === 'all' 
                ? "You'll see notifications here when people interact with your posts or send you messages."
                : `Switch to a different filter to see ${filter === 'unread' ? 'read' : 'unread'} notifications.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-white">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;