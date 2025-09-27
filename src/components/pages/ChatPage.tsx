import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Send, MoreVertical } from "lucide-react";

type MessageRow = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
};

type MessageInsert = Omit<MessageRow, "id">;

type ChatPageParams = {
  chatId: string;
};

const ChatPage: React.FC = () => {
  const { chatId } = useParams<ChatPageParams>();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          await fetchChatDetails(user.id);
          await fetchMessages();
          subscribeMessages();
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [chatId]);

  const fetchChatDetails = async (userId: string) => {
    if (!chatId) return;
    
    try {
      const { data: chat, error } = await supabase
        .from("chats")
        .select("user1_id, user2_id")
        .eq("id", chatId)
        .single();

      if (error) throw error;

      const otherUserId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
      
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("username, full_name, avatar_url")
        .eq("user_id", otherUserId)
        .single();

      if (profileError) console.error("Profile fetch error:", profileError);
      setOtherUser(profile);
    } catch (error) {
      console.error("Error fetching chat details:", error);
    }
  };

  const fetchMessages = async () => {
    if (!chatId) return;
    
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          profiles:sender_id (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (data) setMessages(data as MessageRow[]);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const subscribeMessages = () => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "messages", 
          filter: `chat_id=eq.${chatId}` 
        },
        async (payload: { new: MessageRow }) => {
          // Fetch profile data for new message
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, full_name, avatar_url")
            .eq("user_id", payload.new.sender_id)
            .single();

          setMessages((prev) => [
            ...prev,
            { 
              ...payload.new, 
              profiles: profile ?? undefined // Ensure profiles is undefined if null
            } as MessageRow
          ]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !chatId) return;

    try {
      const messageToInsert: MessageInsert = {
        chat_id: chatId,
        sender_id: currentUserId,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("messages")
        .insert([messageToInsert]);

      if (error) throw error;
      
      // Update chat's last message
      await supabase
        .from("chats")
        .update({
          last_message: newMessage.trim(),
          last_message_at: new Date().toISOString(),
        })
        .eq("id", chatId);

      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.history.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition-all text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-sm font-bold">
              {otherUser?.avatar_url ? (
                <img
                  src={otherUser.avatar_url}
                  alt={otherUser.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                otherUser?.full_name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div>
              <h2 className="text-white font-semibold">
                {otherUser?.full_name || 'Chat'}
              </h2>
              <p className="text-white/60 text-sm">
                @{otherUser?.username || 'user'}
              </p>
            </div>
          </div>
          
          <button className="ml-auto p-2 hover:bg-white/10 rounded-lg transition-all text-white">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white/60">
              <p className="text-lg mb-2">No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${
                msg.sender_id === currentUserId ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  msg.sender_id === currentUserId
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                    : "bg-white/10 text-white backdrop-blur-xl"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <div className="text-xs opacity-60 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="bg-black/20 backdrop-blur-xl border-t border-white/10 p-4">
        <div className="flex gap-3">
          <input
            className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <button 
            className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;