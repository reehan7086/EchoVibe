import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Phone, Video, MoreVertical, Smile, Paperclip, Mic, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Profile, ChatRoom, Message } from '../../types';

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

interface ChatWithParticipant extends ChatRoom {
  other_participant?: Profile;
  last_message?: Message;
  unread_count?: number;
}

const formatTime = (date: string) => {
  const now = new Date();
  const messageDate = new Date(date);
  const diff = now.getTime() - messageDate.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return messageDate.toLocaleDateString();
};

const getStatusFromLastActive = (lastActive: string): 'online' | 'away' | 'offline' => {
  const now = new Date();
  const last = new Date(lastActive);
  const diffMinutes = (now.getTime() - last.getTime()) / (1000 * 60);
  
  if (diffMinutes < 5) return 'online';
  if (diffMinutes < 30) return 'away';
  return 'offline';
};

const ChatPage: React.FC = () => {
  const { currentUser, loading: userLoading } = useCurrentUser();
  const [chats, setChats] = useState<ChatWithParticipant[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatWithParticipant | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user's chats
  useEffect(() => {
    if (!currentUser) return;

    const loadChats = async () => {
      setLoading(true);
      try {
        // Get all chat rooms where user is a participant
        const { data: participantData, error: participantError } = await supabase
          .from('chat_participants')
          .select('chat_room_id')
          .eq('user_id', currentUser.user_id);

        if (participantError) throw participantError;

        const roomIds = participantData.map(p => p.chat_room_id);

        if (roomIds.length === 0) {
          setChats([]);
          setLoading(false);
          return;
        }

        // Get chat rooms
        const { data: roomsData, error: roomsError } = await supabase
          .from('chat_rooms')
          .select('*')
          .in('id', roomIds)
          .order('updated_at', { ascending: false });

        if (roomsError) throw roomsError;

        // Get other participants and last messages for each chat
        const chatsWithData = await Promise.all(
          (roomsData || []).map(async (room) => {
            // Get other participant
            const { data: otherParticipantData } = await supabase
              .from('chat_participants')
              .select('user_id')
              .eq('chat_room_id', room.id)
              .neq('user_id', currentUser.user_id)
              .single();

            let otherParticipant = null;
            if (otherParticipantData) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', otherParticipantData.user_id)
                .single();
              otherParticipant = profileData;
            }

            // Get last message
            const { data: lastMessageData } = await supabase
              .from('messages')
              .select('*')
              .eq('chat_room_id', room.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            // Get unread count
            const { count: unreadCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('chat_room_id', room.id)
              .neq('user_id', currentUser.user_id)
              .eq('is_read', false);

            return {
              ...room,
              other_participant: otherParticipant,
              last_message: lastMessageData,
              unread_count: unreadCount || 0
            };
          })
        );

        setChats(chatsWithData);
      } catch (error) {
        console.error('Error loading chats:', error);
      }
      setLoading(false);
    };

    loadChats();
  }, [currentUser]);

  // Load messages when chat is selected
  useEffect(() => {
    if (!selectedChat) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_room_id', selectedChat.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('chat_room_id', selectedChat.id)
        .neq('user_id', currentUser?.user_id);
    };

    loadMessages();
  }, [selectedChat, currentUser]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time message subscription
  useEffect(() => {
    if (!selectedChat) return;

    const channel = supabase
      .channel(`messages:${selectedChat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${selectedChat.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);

          // Mark as read if not sent by current user
          if (newMessage.user_id !== currentUser?.user_id) {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMessage.id)
              .then();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat, currentUser]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !currentUser) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: selectedChat.id,
          user_id: currentUser.user_id,
          content: newMessage.trim(),
          message_type: 'text',
          is_read: false,
          approved: true
        });

      if (error) throw error;

      // Update chat room's updated_at
      await supabase
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedChat.id);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.other_participant?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.other_participant?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (userLoading) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-900">
      {/* Chat List Sidebar */}
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-col bg-gray-800 border-r border-gray-700`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white mb-3">Messages</h2>
          
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">No conversations yet</h3>
              <p className="text-sm text-gray-500">Start chatting from the map!</p>
            </div>
          ) : (
            filteredChats.map(chat => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`p-4 cursor-pointer transition-all border-b border-gray-700 ${
                  selectedChat?.id === chat.id
                    ? 'bg-gray-700'
                    : 'hover:bg-gray-750'
                }`}
              >
                <div className="flex gap-3">
                  <div className="relative flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      chat.other_participant?.gender === 'female'
                        ? 'bg-gradient-to-r from-pink-500 to-pink-600'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}>
                      <span className="text-white font-bold text-lg">
                        {chat.other_participant?.full_name?.[0] || chat.other_participant?.username?.[0] || '?'}
                      </span>
                    </div>
                    {chat.other_participant?.last_active && getStatusFromLastActive(chat.other_participant.last_active) === 'online' && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-white truncate">
                        {chat.other_participant?.full_name || chat.other_participant?.username || 'Unknown User'}
                      </h3>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {chat.last_message ? formatTime(chat.last_message.created_at) : ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${chat.unread_count && chat.unread_count > 0 ? 'font-semibold text-white' : 'text-gray-400'}`}>
                        {chat.last_message?.content || 'No messages yet'}
                      </p>
                      
                      {chat.unread_count && chat.unread_count > 0 && (
                        <span className="flex-shrink-0 ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                          {chat.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-gray-900">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-700 bg-gray-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedChat(null)}
                className="md:hidden text-gray-400 hover:text-white"
              >
                ←
              </button>
              
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                selectedChat.other_participant?.gender === 'female'
                  ? 'bg-gradient-to-r from-pink-500 to-pink-600'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600'
              }`}>
                <span className="text-white font-bold">
                  {selectedChat.other_participant?.full_name?.[0] || selectedChat.other_participant?.username?.[0] || '?'}
                </span>
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-white">
                  {selectedChat.other_participant?.full_name || selectedChat.other_participant?.username || 'Unknown User'}
                </h3>
                <p className="text-sm text-gray-400">
                  {selectedChat.other_participant?.last_active && getStatusFromLastActive(selectedChat.other_participant.last_active) === 'online' ? (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      Online
                    </span>
                  ) : (
                    'Offline'
                  )}
                </p>
              </div>

              <button className="text-gray-400 hover:text-white p-2">
                <Phone className="w-5 h-5" />
              </button>
              <button className="text-gray-400 hover:text-white p-2">
                <Video className="w-5 h-5" />
              </button>
              <button className="text-gray-400 hover:text-white p-2">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => {
              const isOwn = message.user_id === currentUser?.user_id;
              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    isOwn
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-white'
                  }`}>
                    <p className="text-sm break-words">{message.content}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <p className="text-xs opacity-70">
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {isOwn && (
                        <span className="text-xs">
                          {message.is_read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-700 bg-gray-800">
            <div className="flex items-end gap-2">
              <button className="flex-shrink-0 p-2 text-gray-400 hover:text-white transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>

              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  className="w-full px-4 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                  style={{ minHeight: '40px', maxHeight: '120px' }}
                />
                
                <button className="absolute right-2 bottom-2 text-gray-400 hover:text-white">
                  <Smile className="w-5 h-5" />
                </button>
              </div>

              {newMessage.trim() ? (
                <button
                  onClick={handleSendMessage}
                  className="flex-shrink-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              ) : (
                <button className="flex-shrink-0 p-2 text-gray-400 hover:text-white transition-colors">
                  <Mic className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-900">
          <div className="text-center p-8">
            <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">Select a conversation</h3>
            <p className="text-gray-500">Choose a chat to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;