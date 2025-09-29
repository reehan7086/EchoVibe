// src/components/pages/FriendsPage.tsx
import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, MessageCircle, UserMinus, Search, Filter, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types';

interface Friend extends Profile {
  connection_status: 'connected' | 'pending' | 'blocked';
  connected_at: string;
  distance?: number;
  status?: 'online' | 'away' | 'offline';
}

interface FriendsPageProps {
  user: User;
  onStartChat: (friend: Friend) => void;
}

const FriendsPage: React.FC<FriendsPageProps> = ({ user, onStartChat }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'online' | 'nearby'>('all');

  useEffect(() => {
    fetchFriends();
  }, [user.id]);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      // Get connected friends
      const { data: connections, error } = await supabase
        .from('user_connections')
        .select(`
          *,
          connected_user:profiles!user_connections_connected_user_id_fkey(
            id,
            user_id,
            full_name,
            username,
            bio,
            avatar_url,
            latitude,
            longitude,
            current_mood,
            last_active,
            vibe_score
          ),
          requester:profiles!user_connections_user_id_fkey(
            id,
            user_id,
            full_name,
            username,
            bio,
            avatar_url,
            latitude,
            longitude,
            current_mood,
            last_active,
            vibe_score
          )
        `)
        .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`)
        .eq('status', 'connected');

      if (error) {
        console.error('Error fetching friends:', error);
        return;
      }

      // Get current user's location for distance calculation
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('user_id', user.id)
        .single();

      const friendsList: Friend[] = connections?.map(connection => {
        // Determine which profile is the friend (not the current user)
        const friendProfile = connection.user_id === user.id 
          ? connection.connected_user 
          : connection.requester;

        let distance: number | undefined;
        if (currentUserProfile?.latitude && currentUserProfile?.longitude && 
            friendProfile?.latitude && friendProfile?.longitude) {
          distance = calculateDistance(
            currentUserProfile.latitude,
            currentUserProfile.longitude,
            friendProfile.latitude,
            friendProfile.longitude
          );
        }

        const status = getStatusFromLastActive(friendProfile?.last_active || new Date().toISOString());

        return {
          ...friendProfile,
          connection_status: 'connected' as const,
          connected_at: connection.created_at,
          distance,
          status
        };
      }) || [];

      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getStatusFromLastActive = (lastActive: string): 'online' | 'away' | 'offline' => {
    const now = new Date();
    const last = new Date(lastActive);
    const diffMinutes = (now.getTime() - last.getTime()) / (1000 * 60);
    
    if (diffMinutes < 5) return 'online';
    if (diffMinutes < 30) return 'away';
    return 'offline';
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from('user_connections')
        .delete()
        .or(`and(user_id.eq.${user.id},connected_user_id.eq.${friendId}),and(user_id.eq.${friendId},connected_user_id.eq.${user.id})`);

      if (error) {
        console.error('Error removing friend:', error);
        return;
      }

      // Remove from local state
      setFriends(prev => prev.filter(friend => friend.user_id !== friendId));
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const filteredFriends = friends.filter(friend => {
    // Search filter
    const matchesSearch = !searchTerm || 
      friend.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      friend.username?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesFilter = filter === 'all' || 
      (filter === 'online' && friend.status === 'online') ||
      (filter === 'nearby' && friend.distance && friend.distance <= 10);

    return matchesSearch && matchesFilter;
  });

  const getActivityEmoji = (mood: string): string => {
    const moodLower = mood?.toLowerCase() || '';
    
    if (moodLower.includes('coffee')) return '☕';
    if (moodLower.includes('work')) return '💼';
    if (moodLower.includes('gym')) return '💪';
    if (moodLower.includes('food')) return '🍽️';
    if (moodLower.includes('music')) return '🎵';
    if (moodLower.includes('study')) return '📚';
    
    return '😊';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
          <p>Loading friends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Friends</h1>
          <p className="text-white/60">
            {friends.length} {friends.length === 1 ? 'friend' : 'friends'} connected
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-400" />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/60" />
          {['all', 'online', 'nearby'].map((filterOption) => (
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
            </button>
          ))}
        </div>
      </div>

      {/* Friends List */}
      <div className="space-y-3">
        {filteredFriends.length > 0 ? (
          <AnimatePresence>
            {filteredFriends.map((friend) => (
              <motion.div
                key={friend.user_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4 hover:bg-white/15 transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-xl">
                      {friend.avatar_url ? (
                        <img
                          src={friend.avatar_url}
                          alt={friend.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getActivityEmoji(friend.current_mood || '')
                      )}
                    </div>
                    {/* Status indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-gray-800 rounded-full ${
                      friend.status === 'online' ? 'bg-green-400' : 
                      friend.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                    }`} />
                  </div>

                  {/* Friend Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold truncate">
                        {friend.full_name || friend.username}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        friend.status === 'online' ? 'bg-green-600/20 text-green-400' :
                        friend.status === 'away' ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-gray-600/20 text-gray-400'
                      }`}>
                        {friend.status}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm truncate">
                      @{friend.username}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-white/40">
                      {friend.current_mood && (
                        <span>🎭 {friend.current_mood}</span>
                      )}
                      {friend.distance && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {friend.distance.toFixed(1)} km away
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onStartChat(friend)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                      title="Start chat"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(friend.user_id)}
                      className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-all"
                      title="Remove friend"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white/40" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm || filter !== 'all' ? 'No friends found' : 'No friends yet'}
            </h3>
            <p className="text-white/60 max-w-md mx-auto">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Start connecting with people on the map to build your friends list!'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;