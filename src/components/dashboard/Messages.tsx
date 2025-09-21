import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { MessageCircle, Send, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Chat {
  id: string;
  last_message_at: string;
  user1_id: string;
  user2_id: string;
  other_user: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

export const Messages = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  const fetchChats = async () => {
    if (!user) return;

    try {
      // Get all chats for the user and manually join with profiles
      const { data: chatData, error } = await supabase
        .from('chats')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      if (chatData) {
        // Get profile data for other users
        const otherUserIds = chatData.map(chat => 
          chat.user1_id === user.id ? chat.user2_id : chat.user1_id
        );

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, full_name, avatar_url')
          .in('user_id', otherUserIds);

        if (profilesError) throw profilesError;

        // Combine chat and profile data
        const enrichedChats = chatData.map(chat => {
          const otherUserId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
          const otherUserProfile = profilesData?.find(p => p.user_id === otherUserId);
          
          return {
            ...chat,
            other_user: otherUserProfile ? {
              username: otherUserProfile.username,
              full_name: otherUserProfile.full_name,
              avatar_url: otherUserProfile.avatar_url
            } : {
              username: 'Unknown',
              full_name: 'Unknown User',
              avatar_url: undefined
            }
          };
        });

        setChats(enrichedChats);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
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
      fetchMessages(selectedChat.id);
      fetchChats();
    } catch (error) {
      console.error('Error sending message:', error);
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
      <div className="flex h-[600px] border border-border rounded-lg overflow-hidden">
        <div className="w-1/3 border-r border-border animate-pulse">
          <div className="h-full bg-muted/50" />
        </div>
        <div className="flex-1 animate-pulse">
          <div className="h-full bg-muted/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Messages</h2>
        <Badge variant="secondary" className="text-sm">
          {chats.length} conversations
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
                </div>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedChat?.id === chat.id ? 'bg-muted/50' : ''
                  }`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={chat.other_user.avatar_url} />
                      <AvatarFallback className="bg-gradient-primary text-white">
                        {chat.other_user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{chat.other_user.full_name}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        @{chat.other_user.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: true })}
                      </p>
                    </div>
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
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    onClick={() => setSelectedChat(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={selectedChat.other_user.avatar_url} />
                    <AvatarFallback className="bg-gradient-primary text-white">
                      {selectedChat.other_user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h4 className="font-medium">{selectedChat.other_user.full_name}</h4>
                    <p className="text-sm text-muted-foreground">@{selectedChat.other_user.username}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border bg-background/50">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
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