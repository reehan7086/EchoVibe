import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthProvider';
import { MessageCircle, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
  chat_id?: string;  // Make it optional with ?
  sender_id: string;
  content: string;
  created_at: string;
  message_type?: 'text' | 'image' | 'audio' | 'video';
  media_url?: string;
  read_at?: string;
}

export const Messages: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user, fetchChats]);

  const fetchChats = async () => {
    if (!user) return;

    try {
      // Mock data for development since we don't have real chats yet
      const mockChats: Chat[] = [
        {
          id: '1',
          match_id: '1',
          user1_id: user.id,
          user2_id: 'mock-user',
          last_message_at: new Date().toISOString(),
          other_user: {
            user_id: 'mock-user',
            username: 'viber123',
            full_name: 'Alex Vibe',
            avatar_url: undefined,
            is_online: true,
            last_active: new Date().toISOString()
          },
          last_message: {
            content: 'Hey! Love your latest vibe echo 🎵',
            message_type: 'text',
            sender_id: 'mock-user',
            created_at: new Date().toISOString()
          }
        }
      ];
      
      setChats(mockChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast({
        title: "Error loading chats",
        description: "Failed to load your conversations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      // Mock messages for development
      const mockMessages: Message[] = [
        {
          id: '1',
          chat_id: chatId,
          sender_id: 'mock-user',
          content: 'Hey! Love your latest vibe echo 🎵',
          message_type: 'text',
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: '2',
          chat_id: chatId,
          sender_id: user?.id || '',
          content: 'Thanks! That song really captured my mood today',
          message_type: 'text',
          created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        }
      ];
      
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error loading messages",
        description: "Failed to load chat messages.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    setSendingMessage(true);
    try {
      const newMsg: Message = {
        id: Date.now().toString(),
        content: newMessage.trim(),
        sender_id: user.id,
        created_at: new Date().toISOString(),
        message_type: 'text'
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');

      toast({
        title: "Message sent! 💬",
        description: "Your message has been delivered.",
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
                  onClick={() => {
                    setSelectedChat(chat);
                    fetchMessages(chat.id);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
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
                      {chat.last_message && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {chat.last_message.sender_id === user?.id && 'You: '}
                          {chat.last_message.content}
                        </p>
                      )}
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
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedChat.other_user.avatar_url} />
                    <AvatarFallback className="bg-gradient-primary text-white">
                      {selectedChat.other_user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h4 className="font-medium">{selectedChat.other_user.full_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedChat.other_user.is_online ? 'online' : 
                        `last seen ${formatDistanceToNow(new Date(selectedChat.other_user.last_active), { addSuffix: true })}`
                      }
                    </p>
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
                          <p className="text-xs opacity-70 mt-1">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
