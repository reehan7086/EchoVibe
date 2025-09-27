// src/components/ChatPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  MessageCircle,
  Send,
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Search,
  Plus,
  User,
  Shield,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react';

interface Chat {
  id: string;
  participants: string[];
  last_message: string;
  last_message_at: string;
  unread_count: number;
  other_user: {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
    is_online: boolean;
    is_verified: boolean;
  };
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender: {
    name: string;
    avatar_url: string;
  };
}

const ChatPage: React.FC = () => {
  const { chatId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get('user');
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        
        await loadChats();
        
        if (chatId) {
          await loadChatMessages(chatId);
        } else if (userId) {
          await createOrOpenChatWithUser(userId);
        }
      } catch (error) {
        console.error('Chat init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [chatId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    // Mock chat data - replace with Supabase query
    const mockChats: Chat[] = [
      {
        id: 'chat1',
        participants: ['current_user', 'user1'],
        last_message: 'Hey! Thanks for connecting on the map',
        last_message_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        unread_count: 2,
        other_user: {
          id: 'user1',
          name: 'Sarah Ahmed',
          username: 'sarah_sparkle',
          avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150',
          is_online: true,
          is_verified: true
        }
      },
      {
        id: 'chat2',
        participants: ['current_user', 'user2'],
        last_message: 'Would love to explore that cafe sometime!',
        last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        unread_count: 0,
        other_user: {
          id: 'user2',
          name: 'Ahmed Ali',
          username: 'ahmed_explorer',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          is_online: false,
          is_verified: false
        }
      },
      {
        id: 'chat3',
        participants: ['current_user', 'user3'],
        last_message: 'Great vibes at the event yesterday!',
        last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        unread_count: 0,
        other_user: {
          id: 'user3',
          name: 'Luna Chen',
          username: 'luna_creative',
          avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
          is_online: true,
          is_verified: true
        }
      }
    ];
    
    setChats(mockChats);
  };

  const loadChatMessages = async (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setSelectedChat(chat);
      
      // Mock messages - replace with Supabase query
      const mockMessages: Message[] = [
        {
          id: 'msg1',
          chat_id: chatId,
          sender_id: chat.other_user.id,
          content: 'Hey! I saw you on the vibe map nearby',
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          is_read: true,
          sender: {
            name: chat.other_user.name,
            avatar_url: chat.other_user.avatar_url
          }
        },
        {
          id: 'msg2',
          chat_id: chatId,
          sender_id: 'current_user',
          content: 'Hi Sarah! Nice to meet someone with such positive vibes',
          created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          is_read: true,
          sender: {
            name: 'You',
            avatar_url: currentUser?.user_metadata?.avatar_url || ''
          }
        },
        {
          id: 'msg3',
          chat_id: chatId,
          sender_id: chat.other_user.id,
          content: 'Thanks for connecting on the map! What brings you to this area?',
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          is_read: false,
          sender: {
            name: chat.other_user.name,
            avatar_url: chat.other_user.avatar_url
          }
        }
      ];
      
      setMessages(mockMessages);
    }
  };

  const createOrOpenChatWithUser = async (userId: string) => {
    // Check if chat already exists
    const existingChat = chats.find(chat => 
      chat.other_user.id === userId
    );
    
    if (existingChat) {
      navigate(`/chat/${existingChat.id}`);
    } else {
      // Create new chat - replace with actual implementation
      const newChatId = `chat_${Date.now()}`;
      navigate(`/chat/${newChatId}`);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || sendingMessage) return;
    
    setSendingMessage(true);
    
    try {
      const message: Message = {
        id: `msg_${Date.now()}`,
        chat_id: selectedChat.id,
        sender_id: 'current_user',
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
        is_read: false,
        sender: {
          name: 'You',
          avatar_url: currentUser?.user_metadata?.avatar_url || ''
        }
      };
      
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Update chat list
      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { ...chat, last_message: message.content, last_message_at: message.created_at }
          : chat
      ));
      
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          
          <h1 className="text-xl font-bold text-white">Messages</h1>
          
          <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
            <Search className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto h-[calc(100vh-80px)] flex">
        {/* Chat List */}
        <div className="w-full md:w-1/3 border-r border-white/10 bg-black/10 backdrop-blur-xl">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Chats</h2>
              <button className="p-2 bg-purple-500/20 rounded-full hover:bg-purple-500/30 transition-all">
                <Plus className="w-4 h-4 text-purple-400" />
              </button>
            </div>
          </div>
          
          <div className="overflow-y-auto h-full">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => navigate(`/chat/${chat.id}`)}
                className={`p-4 border-b border-white/5 hover:bg-white/10 cursor-pointer transition-all ${
                  selectedChat?.id === chat.id ? 'bg-white/10' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      {chat.other_user.avatar_url ? (
                        <img
                          src={chat.other_user.avatar_url}
                          alt={chat.other_user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-purple-500 flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    {chat.other_user.is_online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900"></div>
                    )}
                    {chat.other_user.is_verified && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <Shield className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white font-medium truncate">{chat.other_user.name}</h3>
                      <span className="text-xs text-white/40">
                        {new Date(chat.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm truncate">{chat.last_message}</p>
                  </div>
                  
                  {chat.unread_count > 0 && (
                    <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{chat.unread_count}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 bg-black/10 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        {selectedChat.other_user.avatar_url ? (
                          <img
                            src={selectedChat.other_user.avatar_url}
                            alt={selectedChat.other_user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-purple-500 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      {selectedChat.other_user.is_online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-slate-900"></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium">{selectedChat.other_user.name}</h3>
                        {selectedChat.other_user.is_verified && (
                          <Shield className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <p className="text-white/60 text-sm">
                        {selectedChat.other_user.is_online ? 'Online' : 'Last seen recently'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                      <Phone className="w-4 h-4 text-white" />
                    </button>
                    <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                      <Video className="w-4 h-4 text-white" />
                    </button>
                    <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                      <MoreVertical className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.sender_id === 'current_user';
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end gap-2 max-w-xs lg:max-w-md ${
                        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                      }`}>
                        {!isOwnMessage && (
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            {message.sender.avatar_url ? (
                              <img
                                src={message.sender.avatar_url}
                                alt={message.sender.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-purple-500 flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className={`rounded-2xl px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'bg-white/10 text-white'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${
                            isOwnMessage ? 'justify-end' : 'justify-start'
                          }`}>
                            <span className={`text-xs ${
                              isOwnMessage ? 'text-white/70' : 'text-white/40'
                            }`}>
                              {new Date(message.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            {isOwnMessage && (
                              <div className="text-white/70">
                                {message.is_read ? (
                                  <CheckCheck className="w-3 h-3" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-white/10 bg-black/10 backdrop-blur-xl">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-400 resize-none max-h-32"
                      rows={1}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            // No Chat Selected
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Select a Chat</h3>
                <p className="text-white/60">Choose a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;