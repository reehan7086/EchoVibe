import React, { useState, useEffect } from 'react';
import { Users, UserPlus, UserMinus, MessageCircle, Loader2, UserCheck, UserX, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';

const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setCurrentUser(profile);
      }
      setLoading(false);
    };
    getCurrentUser();
  }, []);

  return { currentUser, loading };
};

interface FriendWithProfile {
  id: string;
  user_id: string;
  connected_user_id: string;
  status: 'pending' | 'connected' | 'blocked';
  created_at: string;
  profile?: Profile;
}

interface ProfileWithDistance extends Profile {
  distance?: number;
}

export type { FriendWithProfile };

const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
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

interface FriendsPageProps {
  user: import('@supabase/supabase-js').User;
  onStartChat?: (friend: FriendWithProfile) => void;
}

const FriendsPage: React.FC<FriendsPageProps> = ({ user, onStartChat }) => {
  const { currentUser, loading: userLoading } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'suggestions'>('friends');
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [requests, setRequests] = useState<FriendWithProfile[]>([]);
  const [suggestions, setSuggestions] = useState<(Profile & { distance?: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load friends
  useEffect(() => {
    if (!currentUser) return;

    const loadFriends = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_connections')
          .select('*')
          .or(`user_id.eq.${currentUser.user_id},connected_user_id.eq.${currentUser.user_id}`)
          .eq('status', 'connected');

        if (error) throw error;

        const friendsWithProfiles = await Promise.all(
          (data || []).map(async (connection) => {
            const friendId = connection.user_id === currentUser.user_id 
              ? connection.connected_user_id 
              : connection.user_id;

            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', friendId)
              .single();

            return {
              ...connection,
              profile
            };
          })
        );

        setFriends(friendsWithProfiles);
      } catch (error) {
        console.error('Error loading friends:', error);
      }
      setLoading(false);
    };

    loadFriends();
  }, [currentUser]);

  // Load friend requests
  useEffect(() => {
    if (!currentUser) return;

    const loadRequests = async () => {
      const { data, error } = await supabase
        .from('user_connections')
        .select('*')
        .eq('connected_user_id', currentUser.user_id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error loading requests:', error);
        return;
      }

      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (connection) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', connection.user_id)
            .single();

          return {
            ...connection,
            profile
          };
        })
      );

      setRequests(requestsWithProfiles);
    };

    loadRequests();
  }, [currentUser]);

  // Load suggestions
  useEffect(() => {
    if (!currentUser || !currentUser.latitude || !currentUser.longitude) return;

    const loadSuggestions = async () => {
      try {
        // Get all profiles except current user and existing connections
        const { data: existingConnections } = await supabase
          .from('user_connections')
          .select('user_id, connected_user_id')
          .or(`user_id.eq.${currentUser.user_id},connected_user_id.eq.${currentUser.user_id}`);

        const connectedIds = new Set(
          (existingConnections || []).flatMap(c => [c.user_id, c.connected_user_id])
        );
        connectedIds.add(currentUser.user_id);

        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .eq('privacy_level', 'public')
          .limit(20);

        if (error) throw error;

        const nearbyProfiles = (profiles || [])
          .filter(p => !connectedIds.has(p.user_id))
          .map(p => ({
            ...p,
            distance: calculateDistance(
              currentUser.latitude!,
              currentUser.longitude!,
              p.latitude!,
              p.longitude!
            )
          }))
          .filter(p => p.distance <= 50)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 10);

        setSuggestions(nearbyProfiles);
      } catch (error) {
        console.error('Error loading suggestions:', error);
      }
    };

    loadSuggestions();
  }, [currentUser]);

  const handleAcceptRequest = async (connectionId: string) => {
    try {
      // Get the request details first
      const request = requests.find(r => r.id === connectionId);
      if (!request) return;
  
      const requesterId = request.user_id;
  
      // Update the existing request to connected
      const { error: updateError } = await supabase
        .from('user_connections')
        .update({ status: 'connected' })
        .eq('id', connectionId);
  
      if (updateError) throw updateError;
  
      // Create reciprocal connection
      const { error: insertError } = await supabase
        .from('user_connections')
        .insert({
          user_id: currentUser!.user_id,
          connected_user_id: requesterId,
          status: 'connected'
        });
  
      if (insertError && insertError.code !== '23505') {
        throw insertError;
      }
  
      // Send notification
      await supabase.from('notifications').insert({
        user_id: requesterId,
        related_user_id: currentUser!.user_id,
        type: 'connection_accepted',
        message: `${currentUser!.full_name || currentUser!.username} accepted your friend request`,
        read: false
      });
  
      // Update UI
      setRequests(prev => prev.filter(r => r.id !== connectionId));
      if (request.profile) {
        setFriends(prev => [...prev, request as FriendWithProfile]);
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to approve request. Please try again.');
    }
  };

  const handleDeclineRequest = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('user_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      setRequests(prev => prev.filter(r => r.id !== connectionId));
    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  const handleAddFriend = async (userId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('user_connections')
        .insert({
          user_id: currentUser.user_id,
          connected_user_id: userId,
          status: 'pending'
        });

      if (error) throw error;

      // Send notification
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          related_user_id: currentUser.user_id,
          type: 'connection_request',
          message: `${currentUser.full_name || currentUser.username} wants to connect`,
          read: false
        });

      setSuggestions(prev => prev.filter(s => s.user_id !== userId));
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  const handleRemoveFriend = async (connection: FriendWithProfile) => {
    try {
      const { error } = await supabase
        .from('user_connections')
        .delete()
        .eq('id', connection.id);

      if (error) throw error;

      setFriends(prev => prev.filter(f => f.id !== connection.id));
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const handleMessageFriend = async (friend: FriendWithProfile) => {
    if (!currentUser || !friend.profile) return;

    // Create or navigate to chat room
    const { data: existingParticipants } = await supabase
      .from('chat_participants')
      .select('chat_room_id')
      .in('user_id', [currentUser.user_id, friend.profile.user_id]);

    if (existingParticipants && existingParticipants.length >= 2) {
      const chatRoomIds = existingParticipants.map(p => p.chat_room_id);
      const commonRoomId = chatRoomIds.find(id => 
        chatRoomIds.filter(roomId => roomId === id).length >= 2
      );
      
      if (commonRoomId) {
        // Navigate to chat (you can emit an event or use router)
        console.log('Navigate to chat:', commonRoomId);
        return;
      }
    }

    // Create new chat room
    const { data: room, error } = await supabase
      .from('chat_rooms')
      .insert({
        is_group: false,
        created_by: currentUser.user_id,
        chat_status: 'approved'
      })
      .select()
      .single();

    if (error || !room) {
      console.error('Error creating chat room:', error);
      return;
    }

    await supabase
      .from('chat_participants')
      .insert([
        { chat_room_id: room.id, user_id: currentUser.user_id },
        { chat_room_id: room.id, user_id: friend.profile.user_id }
      ]);
  };

  const filteredFriends = friends.filter(f =>
    f.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.profile?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (userLoading) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-4">Friends</h1>
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search friends..."
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'friends'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`relative flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'requests'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Requests ({requests.length})
            {requests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {requests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'suggestions'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Suggestions
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <>
            {activeTab === 'friends' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFriends.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-16">
                    <Users className="w-16 h-16 text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-400 mb-2">No friends yet</h3>
                    <p className="text-gray-500 text-center">
                      Connect with people nearby to build your network
                    </p>
                  </div>
                ) : (
                  filteredFriends.map(friend => (
                    <div
                      key={friend.id}
                      className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500 transition-all"
                    >
                      <div className="h-20 bg-gradient-to-br from-purple-600 to-blue-600"></div>
                      
                      <div className="p-4 -mt-8">
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 border-gray-800 ${
                              friend.profile?.gender === 'female'
                                ? 'bg-gradient-to-r from-pink-500 to-pink-600'
                                : 'bg-gradient-to-r from-blue-500 to-blue-600'
                            }`}>
                              <span className="text-white font-bold text-xl">
                                {friend.profile?.full_name?.[0] || friend.profile?.username?.[0] || '?'}
                              </span>
                            </div>
                            {friend.profile?.last_active && getStatusFromLastActive(friend.profile.last_active) === 'online' && (
                              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800"></div>
                            )}
                          </div>

                          <div className="flex-1 mt-2">
                            <h3 className="font-bold text-white">{friend.profile?.full_name || friend.profile?.username}</h3>
                            <p className="text-sm text-gray-400">@{friend.profile?.username}</p>
                          </div>
                        </div>

                        {friend.profile?.bio && (
                          <p className="text-sm text-gray-400 mt-3 line-clamp-2">{friend.profile.bio}</p>
                        )}

                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleMessageFriend(friend)}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Message
                          </button>
                          <button
                            onClick={() => handleRemoveFriend(friend)}
                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="space-y-3 max-w-2xl mx-auto">
                {requests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <UserCheck className="w-16 h-16 text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-400 mb-2">No pending requests</h3>
                    <p className="text-gray-500">You're all caught up!</p>
                  </div>
                ) : (
                  requests.map(request => (
                    <div
                      key={request.id}
                      className="bg-gray-800 rounded-xl p-4 border border-gray-700"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                          request.profile?.gender === 'female'
                            ? 'bg-gradient-to-r from-pink-500 to-pink-600'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600'
                        }`}>
                          <span className="text-white font-bold text-lg">
                            {request.profile?.full_name?.[0] || request.profile?.username?.[0] || '?'}
                          </span>
                        </div>

                        <div className="flex-1">
                          <h3 className="font-bold text-white">{request.profile?.full_name || request.profile?.username}</h3>
                          <p className="text-sm text-gray-400">@{request.profile?.username}</p>
                          
                          {request.profile?.bio && (
                            <p className="text-sm text-gray-400 mt-2">{request.profile.bio}</p>
                          )}

                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleAcceptRequest(request.id)}
                              className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                              <UserCheck className="w-4 h-4" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(request.id)}
                              className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                              <UserX className="w-4 h-4" />
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'suggestions' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {suggestions.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-16">
                    <UserPlus className="w-16 h-16 text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-400 mb-2">No suggestions</h3>
                    <p className="text-gray-500">Check back later for friend suggestions</p>
                  </div>
                ) : (
                  suggestions.map(suggestion => (
                    <div
                      key={suggestion.user_id}
                      className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-purple-500 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                          suggestion.gender === 'female'
                            ? 'bg-gradient-to-r from-pink-500 to-pink-600'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600'
                        }`}>
                          <span className="text-white font-bold text-lg">
                            {suggestion.full_name?.[0] || suggestion.username?.[0] || '?'}
                          </span>
                        </div>

                        <div className="flex-1">
                          <h3 className="font-bold text-white">{suggestion.full_name || suggestion.username}</h3>
                          <p className="text-sm text-gray-400">@{suggestion.username}</p>
                          
                          {suggestion.distance && (
                            <p className="text-xs text-purple-400 mt-1">
                              {suggestion.distance.toFixed(1)} km away
                            </p>
                          )}

                          {suggestion.bio && (
                            <p className="text-sm text-gray-400 mt-2 line-clamp-2">{suggestion.bio}</p>
                          )}

                          <button
                            onClick={() => handleAddFriend(suggestion.user_id)}
                            className="w-full mt-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            <UserPlus className="w-4 h-4" />
                            Add Friend
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;