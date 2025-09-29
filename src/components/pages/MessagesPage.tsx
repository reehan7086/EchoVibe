// src/components/pages/MessagesPage.tsx - Fixed for chat_rooms schema
import React, { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, ArrowLeft, Plus, Loader2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types';
import { formatDate } from '../../utils';

interface MessagesPageProps {
  user: User;
}

interface ChatRoom {
  id: string;
  name?: string;
  is_group: boolean;
  created_by: string;
  created_at: string;
  last_message?: string;
  last_message_at?: string;
  other_user?: Profile;
}

interface Message {
  id: string;
  chat_room_id: string;
  user_id: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  profiles?: Profile;
}

const AnimatedMoodEmoji: React.FC<{ mood: string }> = ({ mood }) => {
  const getMoodAnimation = (mood: string) => {
    const moodLower = mood?.toLowerCase() || '';
    
    if (moodLower.includes('happy')) return '😊';
    if (moodLower.includes('music') || moodLower.includes('vibes')) return '🎵';
    if (moodLower.includes('work')) return '💼';
    if (moodLower.includes('coffee')) return '☕';
    if (moodLower.includes('gym') || moodLower.includes('fitness')) return '💪';
    if (moodLower.includes('creative') || moodLower.includes('art')) return '🎨';
    if (moodLower.includes('chill') || moodLower.includes('relax')) return '😎';
    if (moodLower.includes('energy')) return '🔥';
    if (moodLower.includes('food')) return '🍽️';
    if (moodLower.includes('game')) return '🎮';
    if (moodLower.includes('read')) return '📚';
    if (moodLower.includes('beach')) return '🏖️';
    
    return '✨';
  };

  const emoji = getMoodAnimation(mood);

  return (
    <div className="relative inline-block text-2xl animate-bounce-gentle">
      {emoji}
      <style>{`
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-5px) rotate(-5deg); }
          75% { transform: translateY(-3px) rotate(5deg); }
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

const MessagesPage: React.FC<MessagesPageProps> = ({ user }) => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchUsers, setSearchUsers] = useState<Profile[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    fetchChatRooms();

    return () => {
      mountedRef.current = false;
    };
  }, [user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createDefaultProfile = (userId: string, name: string = 'Unknown User'): Profile => ({
    id: userId,
    user_id: userId,
    username: name.toLowerCase().replace(/\s+/g, ''),
    full_name: name,
    bio: '',
    avatar_url: '',
    city: '',
    vibe_score: 0,
    is_online: false,
    last_active: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const fetchChatRooms = async () => {
    if (!user?.id || !mountedRef.current) return;

    try {
      setLoading(true);
      
      // Get chat rooms where user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('chat_participants')
        .select('chat_room_id')
        .eq('user_id', user.id);

      if (participantError) throw participantError;
      
      const roomIds = participantData?.map(p => p.chat_room_id) || [];
      
      if (roomIds.length === 0) {
        setChatRooms([]);
        setLoading(false);
        return;
      }

      // Get chat room details
      const { data: roomsData, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .in('id', roomIds)
        .order('updated_at', { ascending: false });

      if (roomsError) throw roomsError;

      // For each room, get the other participant
      const roomsWithUsers = await Promise.all(
        (roomsData || []).map(async (room) => {
          if (room.is_group) {
            return { ...room } as ChatRoom;
          }

          // Get other participant
          const { data: participants } = await supabase
            .from('chat_participants')
            .select('user_id')
            .eq('chat_room_id', room.id)
            .neq('user_id', user.id)
            .limit(1);

          if (participants && participants.length > 0) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', participants[0].user_id)
              .single();

            return {
              ...room,
              other_user: profile || createDefaultProfile(participants[0].user_id)
            } as ChatRoom;
          }

          return { ...room } as ChatRoom;
        })
      );

      if (mountedRef.current) {
        setChatRooms(roomsWithUsers);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleSelectChat = async (chatId: string) => {
    if (!mountedRef.current) return;
    
    setSelectedChatId(chatId);
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:user_id (
            id, user_id, username, full_name, avatar_url,
            bio, city, vibe_score, is_online, last_active,
            created_at, updated_at, current_mood
          )
        `)
        .eq('chat_room_id', chatId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (mountedRef.current) {
        const messagesWithProfiles = (data || []).map(message => ({
          ...message,
          profiles: message.profiles || createDefaultProfile(message.user_id)
        }));
        setMessages(messagesWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (mountedRef.current) {
        setMessages([]);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatId || !mountedRef.current) return;
    
    const messageContent = newMessage.trim();
    setNewMessage('');
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          chat_room_id: selectedChatId,
          user_id: user.id,
          content: messageContent,
          message_type: 'text',
          is_read: false
        }]);
      
      if (error) throw error;
      
      // Update chat room's last message
      await supabase
        .from('chat_rooms')
        .update({
          last_message: messageContent,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedChatId);

      // Reload messages
      await handleSelectChat(selectedChatId);

    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent);
      alert('Failed to send message. Please try again.');
    }
  };

  const searchForUsers = async () => {
    if (!userSearchQuery.trim() || !mountedRef.current) {
      setSearchUsers([]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .or(`username.ilike.%${userSearchQuery}%,full_name.ilike.%${userSearchQuery}%`)
        .limit(10);
      
      if (error) throw error;
      
      if (mountedRef.current) {
        setSearchUsers(data || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const startNewChat = async (otherUserId: string) => {
    if (!mountedRef.current) return;
    
    try {
      // Check if chat room already exists between these two users
      const { data: existingParticipants } = await supabase
        .from('chat_participants')
        .select('chat_room_id')
        .in('user_id', [user.id, otherUserId]);

      if (existingParticipants && existingParticipants.length > 0) {
        // Find rooms where both users are participants
        const roomCounts = existingParticipants.reduce((acc: any, p: any) => {
          acc[p.chat_room_id] = (acc[p.chat_room_id] || 0) + 1;
          return acc;
        }, {});

        const existingRoomId = Object.keys(roomCounts).find(roomId => roomCounts[roomId] === 2);

        if (existingRoomId) {
          setSelectedChatId(existingRoomId);
          setShowNewChatModal(false);
          setUserSearchQuery('');
          setSearchUsers([]);
          await handleSelectChat(existingRoomId);
          return;
        }
      }
      
      // Create new chat room
      const { data: newRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .insert([{ 
          is_group: false,
          created_by: user.id
        }])
        .select()
        .single();
      
      if (roomError) throw roomError;
      
      // Add both participants
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          { chat_room_id: newRoom.id, user_id: user.id },
          { chat_room_id: newRoom.id, user_id: otherUserId }
        ]);

      if (participantsError) throw participantsError;
      
      if (mountedRef.current) {
        setSelectedChatId(newRoom.id);
        setShowNewChatModal(false);
        setUserSearchQuery('');
        setSearchUsers([]);
        await fetchChatRooms();
        await handleSelectChat(newRoom.id);
      }
    } catch (error) {
      console.error('Error starting new chat:', error);
      alert('Failed to start new chat. Please try again.');
    }
  };

  const selectedChat = chatRooms.find((chat) => chat.id === selectedChatId);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-900">
      {/* Header - Fixed */}
      <div className="flex-none h-16 bg-gray-800/50 backdrop-blur-xl border-b border-gray-700 flex items-center px-4">
        {selectedChatId ? (
          <>
            <button
              onClick={() => setSelectedChatId(null)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-all text-white mr-3"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-sm font-bold relative overflow-hidden">
                {selectedChat?.other_user?.avatar_url ? (
                  <img
                    src={selectedChat.other_user.avatar_url}
                    alt={selectedChat?.other_user?.full_name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : selectedChat?.other_user?.current_mood ? (
                  <AnimatedMoodEmoji mood={selectedChat.other_user.current_mood} />
                ) : (
                  selectedChat?.other_user?.full_name?.[0]?.toUpperCase() || selectedChat?.name?.[0]?.toUpperCase() || 'C'
                )}
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">
                  {selectedChat?.other_user?.full_name || selectedChat?.name || 'Chat'}
                </h3>
                <p className="text-xs text-gray-400">
                  {selectedChat?.other_user?.is_online ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <MessageSquare className="text-purple-400 mr-3" size={20} />
            <h3 className="text-lg font-semibold text-white flex-1">Messages</h3>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition-all text-white"
            >
              <Plus size={18} />
            </button>
          </>
        )}
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-hidden">
        {selectedChatId ? (
          <div className="h-full flex flex-col">
            {/* Messages - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.user_id === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                        message.user_id === user.id
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-none'
                          : 'bg-gray-800 text-white rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                      <span className="text-xs opacity-60 mt-1 block">{formatDate(message.created_at)}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">No messages yet. Start the conversation!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input - Fixed */}
            <div className="flex-none p-4 bg-gray-800/50 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            {chatRooms.length > 0 ? (
              chatRooms.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className="p-4 border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-lg font-bold flex-shrink-0 relative overflow-hidden">
                      {chat.other_user?.avatar_url ? (
                        <img
                          src={chat.other_user.avatar_url}
                          alt={chat.other_user?.full_name || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : chat.other_user?.current_mood ? (
                        <AnimatedMoodEmoji mood={chat.other_user.current_mood} />
                      ) : (
                        chat.other_user?.full_name?.[0]?.toUpperCase() || chat.name?.[0]?.toUpperCase() || 'C'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate text-base">
                        {chat.other_user?.full_name || chat.name || 'Chat'}
                      </h4>
                      <p className="text-sm text-gray-400 truncate">{chat.last_message || 'No messages yet'}</p>
                    </div>
                    {chat.last_message_at && (
                      <span className="text-xs text-gray-500 flex-shrink-0">{formatDate(chat.last_message_at)}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-center p-8">
                <div>
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 mb-4">No conversations yet</p>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg rounded-xl text-white font-medium transition-all"
                  >
                    Start a conversation
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowNewChatModal(false);
              setUserSearchQuery('');
              setSearchUsers([]);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-700">
                <h3 className="font-semibold text-white text-lg">Start New Conversation</h3>
              </div>
              
              <div className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      searchForUsers();
                    }}
                    placeholder="Search for users..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  />
                </div>
                
                <div className="max-h-72 overflow-y-auto space-y-2">
                  {searchUsers.map((searchUser) => (
                    <div
                      key={searchUser.id}
                      onClick={() => startNewChat(searchUser.user_id)}
                      className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-xl cursor-pointer transition-all"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-lg font-bold overflow-hidden">
                        {searchUser.avatar_url ? (
                          <img
                            src={searchUser.avatar_url}
                            alt={searchUser.full_name || 'User'}
                            className="w-full h-full object-cover"
                          />
                        ) : searchUser.current_mood ? (
                          <AnimatedMoodEmoji mood={searchUser.current_mood} />
                        ) : (
                          searchUser.full_name?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{searchUser.full_name}</h4>
                        <p className="text-sm text-gray-400">@{searchUser.username}</p>
                      </div>
                    </div>
                  ))}
                  {userSearchQuery && searchUsers.length === 0 && (
                    <p className="text-center text-gray-400 py-8">No users found</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessagesPage;