// src/pages/ChatPage.tsx
import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/LoadingSpinner';

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

interface ChatPageProps {
  user: User;
}

const ChatPage: React.FC<ChatPageProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) console.error(error);
    else setMessages(data);
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const { error } = await supabase.from('messages').insert([{
      sender_id: user.id,
      sender_name: user.user_metadata?.full_name || user.email?.split('@')[0],
      message: newMessage,
    }]);
    if (error) console.error(error);
    else setNewMessage('');
    fetchMessages();
  };

  useEffect(() => {
    fetchMessages();

    const messageChannel = supabase
  .channel('public:messages')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchMessages())
  .subscribe();

  return () => {
    supabase.removeChannel(messageChannel);
  };
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col max-w-lg mx-auto">
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.map(msg => (
          <div key={msg.id} className={`p-2 rounded-lg ${msg.sender_id === user.id ? 'bg-purple-600 text-white self-end' : 'bg-white/10 text-white self-start'}`}>
            <strong>{msg.sender_name}</strong>
            <p>{msg.message}</p>
            <small className="text-gray-300">{new Date(msg.created_at).toLocaleTimeString()}</small>
          </div>
        ))}
      </div>
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Type a message"
          className="flex-1 p-2 rounded-lg"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} className="bg-purple-600 text-white px-4 rounded-lg">Send</button>
      </div>
    </div>
  );
};

export default ChatPage;
