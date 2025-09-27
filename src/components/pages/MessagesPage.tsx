import React, { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { MessageSquare, Send, X, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Chat, Message, Profile } from '../../types';
import { formatDate } from '../../utils';

interface MessagesPageProps {
  user: User;
}

const MessagesPage: React.FC<MessagesPageProps> = ({ user }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchUsers, setSearchUsers] = useState<Profile[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const mountedRef = useRef(true);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    mountedRef.current = true;
    
    const initializeMessagesPage = async () => {
      if (!user?.id || !mountedRef.current) return;
      
      try {
        await fetchChats();
        setupRealtimeSubscription();
      } catch (error) {
        console.error('Error initializing messages page:', error);
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    initializeMessagesPage();

    return () => {
      mountedRef.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [user?.id]);

  const setupRealtimeSubscription = () => {
    if (!user?.id || subscriptionRef.current) return;

    subscriptionRef.current = supabase
      .channel('messages_and_chats')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chats' 
      }, async (payload: any) => {
        if (!mountedRef.current) return;
        
        if (payload.new.user1_id === user.id || payload.new.user2_id === user.id) {
          const otherUserId = payload.new.user1_id === user.id ? payload.new.user2_id : payload.new.user1_id;
          
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', otherUserId)
              .single();
              
            if (mountedRef.current) {
              setChats((prev) => [
                { 
                  ...payload.new,
                  match_id: payload.new.match_id || 'default', // Ensure match_id is present
                  other_user: profileData || { 
                    id: '',
                    user_id: otherUserId,
                    username: 'Unknown', 
                    full_name: 'Unknown User', 
                    avatar_url: null,
                    created_at: new Date().toISOString(),
                    vibe_score: 0,
                    is_online: false
                  } as Profile
                } as Chat,
                ...prev,
              ]);
            }
          } catch (error) {
            console.error('Error fetching profile for new chat:', error);
          }
        }
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, async (payload: any) => {
        if (!mountedRef.current) return;
        
        if (selectedChatId === payload.new.chat_id) {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', payload.new.sender_id)
              .single();
              
            if (mountedRef.current) {
              setMessages((prev) => [...prev, { 
                ...payload.new, 
                profiles: profileData || { 
                  id: '',
                  user_id: payload.new.sender_id,
                  username: 'Unknown', 
                  full_name: 'Unknown User', 
                  avatar_url: null,
                  created_at: new Date().toISOString(),
                  vibe_score: 0,
                  is_online: false
                } as Profile
              } as Message]);
            }
          } catch (error) {
            console.error('Error fetching profile for new message:', error);
          }
        }
        
        // Update last message in chat
        if (mountedRef.current) {
          setChats((prev) => prev.map(chat => 
            chat.id === payload.new.chat_id 
              ? { ...chat, last_message: payload.new.content, last_message_at: payload.new.created_at }
              : chat
          ));
        }
      })
      .subscribe();
  };

  const fetchChats = async () => {
    if (!user?.id || !mountedRef.current) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chats')
        .select(`
          id,
          match_id,
          user1_id,
          user2_id,
          created_at,
          last_message,
          last_message_at
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching chats:', error);
        throw error;
      }

      if (!mountedRef.current) return;

      const chatsWithProfiles = await Promise.all(
        (data || []).map(async (chat) => {
          const otherUserId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
          
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', otherUserId)
              .single();

            return {
              ...chat,
              match_id: chat.match_id || 'default', // Ensure match_id is present
              other_user: profileData || { 
                id: '',
                user_id: otherUserId,
                username: 'Unknown', 
                full_name: 'Unknown User', 
                avatar_url: null,
                created_at: new Date().toISOString(),
                vibe_score: 0,
                is_online: false
              } as Profile,
            };
          } catch (profileError) {
            console.error('Error fetching profile for chat:', profileError);
            return {
              ...chat,
              match_id: chat.match_id || 'default', // Ensure match_id is present
              other_user: { 
                id: '',
                user_id: otherUserId,
                username: 'Unknown', 
                full_name: 'Unknown User', 
                avatar_url: null,
                created_at: new Date().toISOString(),
                vibe_score: 0,
                is_online: false
              } as Profile,
            };
          }
        })
      );

      if (mountedRef.current) {
        setChats(chatsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
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
        .select('*, profiles(*)')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }
      
      if (mountedRef.current) {
        setMessages(data || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatId || !mountedRef.current) return;
    
    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    
    try {
      const message = {
        chat_id: selectedChatId,
        sender_id: user.id,
        content: messageContent,
      };
      
      const { data, error } = await supabase
        .from('messages')
        .insert([message])
        .select('*, profiles(*)')
        .single();
      
      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
      
      // Update chat's last message
      await supabase
        .from('chats')
        .update({
          last_message: messageContent,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', selectedChatId);

    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message on error
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
      
      if (error) {
        console.error('Error searching users:', error);
        throw error;
      }
      
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
      // Check if chat already exists
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
        .single();
      
      if (existingChat && mountedRef.current) {
        setSelectedChatId(existingChat.id);
        setShowNewChatModal(false);
        return;
      }
      
      // Create new chat
      const { data, error } = await supabase
        .from('chats')
        .insert([{ match_id: 'temp', user1_id: user.id, user2_id: otherUserId }])
        .select('id')
        .single();
      
      if (error) {
        console.error('Error creating chat:', error);
        throw error;
      }
      
      if (mountedRef.current) {
        setSelectedChatId(data.id);
        setShowNewChatModal(false);
        await fetchChats(); // Refresh chat list
      }
    } catch (error) {
      console.error('Error starting new chat:', error);
      alert('Failed to start new chat. Please try again.');
    }
  };

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        <span className="ml-2">Loading messages...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[calc(100vh-200px)]"
    >
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 h-full flex">
        {/* Chat List */}
        <div className={`${selectedChatId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 border-r border-white/10`}>
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MessageSquare size={20} />
                Messages
              </h3>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="p-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition-all text-white"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {chats.length > 0 ? (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-all ${
                    selectedChatId === chat.id ? 'bg-white/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {chat.other_user?.avatar_url ? (
                        <img
                          src={chat.other_user.avatar_url}
                          alt={chat.other_user?.full_name || 'User'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        chat.other_user?.full_name?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{chat.other_user?.full_name || 'Chat Partner'}</h4>
                      <p className="text-sm text-white/60 truncate">{chat.last_message || 'No messages yet'}</p>
                    </div>
                    {chat.last_message_at && (
                      <span className="text-xs text-white/40 flex-shrink-0">{formatDate(chat.last_message_at)}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-white/60">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-white/40" />
                <p>No conversations yet</p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="mt-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white text-sm transition-all"
                >
                  Start a conversation
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        {selectedChatId ? (
          <div className="flex flex-col flex-1">
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedChatId(null)}
                  className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-all text-white"
                >
                  <X size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-sm font-bold">
                  {selectedChat?.other_user?.avatar_url ? (
                    <img
                      src={selectedChat.other_user.avatar_url}
                      alt={selectedChat?.other_user?.full_name || 'User'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    selectedChat?.other_user?.full_name?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <h3 className="font-semibold text-white">{selectedChat?.other_user?.full_name || 'Chat'}</h3>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.sender_id === user.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs opacity-60 mt-1 block">{formatDate(message.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="text-center text-white/60">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-white/40" />
              <p className="text-lg mb-2">Select a conversation</p>
              <p className="text-sm">Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-md">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-semibold text-white">Start New Conversation</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <input
                value={userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value);
                  searchForUsers();
                }}
                placeholder="Search for users..."
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 mb-4"
              />
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchUsers.map((searchUser) => (
                  <div
                    key={searchUser.id}
                    onClick={() => startNewChat(searchUser.user_id)}
                    className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-sm font-bold">
                      {searchUser.avatar_url ? (
                        <img
                          src={searchUser.avatar_url}
                          alt={searchUser.full_name || 'User'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        searchUser.full_name?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{searchUser.full_name}</h4>
                      <p className="text-sm text-white/60">@{searchUser.username}</p>
                    </div>
                  </div>
                ))}
                {userSearchQuery && searchUsers.length === 0 && (
                  <p className="text-center text-white/60 py-4">No users found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MessagesPage;