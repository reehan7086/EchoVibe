// src/pages/NotificationsPage.tsx
import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from './LoadingSpinner';

interface Notification {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface NotificationsPageProps {
  user: User;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ user }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setNotifications(data);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (error) console.error(error);
    else fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
    .channel('public:notifications')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
      fetchNotifications(); // <-- call the correctly defined function
    })
    .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 max-w-md mx-auto">
      <h2 className="text-white text-2xl font-bold mb-4">Notifications</h2>
      <div className="space-y-2">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`p-3 rounded-lg ${n.read ? 'bg-white/10 text-gray-300' : 'bg-purple-600 text-white'} flex justify-between items-center`}
          >
            <span>{n.message}</span>
            {!n.read && <button onClick={() => markAsRead(n.id)} className="ml-2 underline text-sm">Mark read</button>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
