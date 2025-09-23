// src/components/dashboard/Messages.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase, subscribeToMessages } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { MessageCircle, Send, ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Chat {
  id: string;
  last_message_at: string;
  user1_id: string;
  user2_id: string;
  match_id: string;
  unread_count?: number;
  other_user: {
    user_id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
    is_online: boolean;
    last_active: string;
  };
  last_message?: {
    content: string;
    message_type: string;
    sender_id: string;
    created_at: string;
  };
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  message_type: string;
  media_url?: string;
  read_at?: string;
  is_edited?: boolean;
}

export const Messages = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      markMessagesAsRead(selectedChat.id);
      
      // Subscribe to new messages for this chat
      const subscription = subscribeToMessages(selectedChat.id, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Update chat's last message
          setChats(prev => prev.map(chat => 
            chat.id === selectedChat.id 
              ? { ...chat, last_message_at: newMessage.created_at }
              : chat
          ));

          // Mark as read if not from current user
          if (newMessage.sender_id !== user?.id) {
            markMessageAsRead(newMessage.id);
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedChat, user?.id]);

  // Typing indicator
  useEffect(() => {
    if (!selectedChat || !user) return;

    let typingTimeout: NodeJS.Timeout;
    
    const handleTyping = () => {
      if (!isTyping) {
        setIsTyping(true);
        // Broadcast typing indicator
        supabase.channel(`typing_${selectedChat.id}`)
          .send({
            type: 'broadcast',
            event: 'typing',
            payload: { user_id: user.id, typing: true }
          });
      }

      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        setIsTyping(false);
        supabase.channel(`typing_${selectedChat.id}`)
          .send({
            type: 'broadcast',
            event: 'typing',
            payload: { user_id: user.id, typing: false }
          });
      }, 1000);
    };

    // Listen for typing indicators
    const channel = supabase.channel(`typing_${selectedChat.id}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.user_id !== user.id) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (payload.payload.typing) {
              newSet.add(payload.payload.user_id);
            } else {
              newSet.delete(payload.payload.user_id);
            }
            return newSet;
          });
        }
      })
      .subscribe();

    const inputElement = document.querySelector(`#message-input-${selectedChat.id}`);
    inputElement?.addEventListener('input', handleTyping);

    return () => {
      clearTimeout(typingTimeout);
      inputElement?.removeEventListener('input', handleTyping);
      channel.unsubscribe();
    };
  }, [selectedChat, user, isTyping]);

  const fetchChats = async () => {
    if (!user) return;

    try {
      // Get chats with join to get other user info and last message
      const { data: chatData, error } = await supabase
        .from('chats')
        .select(`
          *,
          vibe_matches!inner(compatibility_score)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      if (chatData) {
        // Get other users' profiles and last messages
        const otherUserIds = chatData.map(chat => 
          chat.user1_id === user.id ? chat.user2_id : chat.user1_id
        );

        const [profilesResult, messagesResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('user_id, username, full_name, avatar_url, is_online, last_active')
            .in('user_id', otherUserIds),
          
          supabase
            .from('messages')
            .select('chat_id, content, message_type, sender_id, created_at')
            .in('chat_id', chatData.map(c => c.id))
            .order('created_at', { ascending: false })
        ]);

        if (profilesResult.error) throw profilesResult.error;
        if (messagesResult.error) throw messagesResult.error;

        // Get unread message counts
        const unreadCounts = await Promise.all(
          chatData.map(async (chat) => {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact' })
              .eq('chat_id', chat.id)
              .neq('sender_id', user.id)
              .is('read_at', null);
            return { chatId: chat.id, count: count || 0 };
          })
        );

        // Combine all data
        const enrichedChats = chatData.map(chat => {
          const otherUserId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
          const otherUserProfile = profilesResult.data?.find(p => p.user_id === otherUserId);
          const lastMessage = messagesResult.data?.find(m => m.chat_id === chat.id);
          const unreadCount = unreadCounts.find(u => u.chatId === chat.id)?.count || 0;
          
          return {
            ...chat,
            unread_count: unreadCount,
            other_user: otherUserProfile || {
              user_id: otherUserId,
              username: 'Unknown',
              full_name: 'Unknown User',
              avatar_url: undefined,
              is_online: false,
              last_active: new Date().toISOString()
            },
            last_message: lastMessage
          };
        });

        setChats(enrichedChats);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast({
        title: "Error loading chats",
        description: "Failed to load your conversations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error loading messages",
        description: "Failed to load chat messages.",
        variant: "destructive",
      });
    }
  };

  const markMessagesAsRead = async (chatId: string) => {
    if (!user) return;
    
    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('chat_id', chatId)
        .neq('sender_id', user.id)
        .is('read_at', null);

      // Update unread count locally
      setChats(prev => prev.map(chat =>
        chat.id === chatId ? { ...chat, unread_count: 0 } : chat
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: selectedChat.id,
          sender_id: user.id,
          content: newMessage.trim(),
          message_type: 'text',
        });

      if (error) throw error;

      // Update chat last_message_at
      await supabase
        .from('chats')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedChat.id);

      setNewMessage('');
      
      // Create notification for other user
      const otherUserId = selectedChat.user1_id === user.id ? selectedChat.user2_id : selectedChat.user1_id;
      await supabase.rpc('create_notification', {
        target_user_id: otherUserId,
        notification_type: 'message',
        notification_title: 'New Message',
        notification_message: `${user.user_metadata?.full_name || 'Someone'} sent you a message`,
        notification_data: { chat_id: selectedChat.id, sender_id: user.id }
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
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

  const deleteChat = async (chatId: string) => {
    try {
      await supabase
        .from('chats')
        .update({ is_active: false })
        .eq('id', chatId);
      
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
      }
      
      toast({
        title: "Chat deleted",
        description: "The conversation has been removed.",
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-[600px] border border-border rounded-lg overflow-hidden">
        <div className="w-1/3 border-r border-border animate-pulse bg-muted/50" />
        <div className="flex-1 animate-pulse bg-muted/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Messages</h2>
        <Badge variant="secondary" className="text-sm">
          {chats.reduce((total, chat) => total + (chat.unread_count || 0), 0)} unread
        </Badge>
      </div>

      <div className="flex h-[600px] border border-border rounded-lg overflow-hidden bg-card/50 backdrop-blur-sm">
        {/* Chat List */}
        <div className="w-1/3 border-r border-border bg-background/50">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Conversations</h3>
          </div>
          
          <div className="overflow-y-auto h-full">
            {chats.length === 0 ? (
              <div className="p-6 text-center">
                <div className="space-y-2">
                  <div className="text-4xl">💬</div>
                  <p className="text-sm text-muted-foreground">
                    No conversations yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Get matched to start chatting!
                  </p>
                </div>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors relative ${
                    selectedChat?.id === chat.id ? 'bg-muted/50' : ''
                  }`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={chat.other_user.avatar_url} />
                        <AvatarFallback className="bg-gradient-primary text-white">
                          {chat.other_user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {chat.other_user.is_online && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate">{chat.other_user.full_name}</h4>
                        {chat.unread_count && chat.unread_count > 0 && (
                          <Badge variant="default" className="text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                            {chat.unread_count > 9 ? '9+' : chat.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        @{chat.other_user.username}
                      </p>
                      {chat.last_message && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {chat.last_message.sender_id === user?.id && 'You: '}
                          {chat.last_message.message_type === 'text' 
                            ? chat.last_message.content 
                            : `📎 ${chat.last_message.message_type}`}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {chat.last_message 
                          ? formatDistanceToNow(new Date(chat.last_message.created_at), { addSuffix: true })
                          : formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: true })
                        }
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            markMessagesAsRead(chat.id);
                          }}
                        >
                          Mark as read
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChat(chat.id);
                          }}
                          className="text-destructive"
                        >
                          Delete chat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-background/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="md:hidden"
                      onClick={() => setSelectedChat(null)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={selectedChat.other_user.avatar_url} />
                        <AvatarFallback className="bg-gradient-primary text-white">
                          {selectedChat.other_user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {selectedChat.other_user.is_online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border border-background rounded-full" />
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-medium">{selectedChat.other_user.full_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedChat.other_user.is_online ? (
                          typingUsers.has(selectedChat.other_user.user_id) ? (
                            <span className="text-primary">typing...</span>
                          ) : (
                            'online'
                          )
                        ) : (
                          `last seen ${formatDistanceToNow(new Date(selectedChat.other_user.last_active), { addSuffix: true })}`
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" disabled>
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" disabled>
                      <Video className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.sender_id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isOwnMessage ? 'order-1' : 'order-2'}`}>
                        <div
                          className={`p-3 rounded-lg ${
                            isOwnMessage
                              ? 'bg-primary text-primary-foreground ml-auto'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs opacity-70">
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </p>
                            {isOwnMessage && (
                              <span className="text-xs opacity-70">
                                {message.read_at ? '✓✓' : '✓'}
                              </span>
                            )}
                            {message.is_edited && (
                              <span className="text-xs opacity-70">edited</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Typing indicator */}
                {typingUsers.size > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-muted p-3 rounded-lg max-w-[70%]">
                      <div className="flex items-center gap-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">typing...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border bg-background/50">
                <div className="flex gap-2">
                  <Input
                    id={`message-input-${selectedChat.id}`}
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                    disabled={sendingMessage}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || sendingMessage}
                    size="sm"
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="text-6xl">💬</div>
                <h3 className="text-lg font-semibold">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a chat from the sidebar to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};