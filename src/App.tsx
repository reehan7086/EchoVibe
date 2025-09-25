import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Image, Video, Smile, TrendingUp, Users, Settings, Home, Search, Bell, Menu, X, Hash, MoreHorizontal, User as UserIcon, LogOut, HelpCircle, Shield } from 'lucide-react';
import { supabase } from '../supabase/client';
import { Database } from '../supabase/types';
import { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
import LandingPage from './components/LandingPage';

type VibeEcho = Database['public']['Tables']['vibe_echoes']['Row'] & {
  profiles: Pick<Database['public']['Tables']['profiles']['Row'], 'username' | 'full_name' | 'avatar_url'>;
};

type Message = Database['public']['Tables']['messages']['Row'] & {
  profiles: Pick<Database['public']['Tables']['profiles']['Row'], 'username' | 'full_name'>;
};

type Profile = Database['public']['Tables']['profiles']['Row'];

type Community = Database['public']['Tables']['communities']['Row'];

type Chat = Database['public']['Tables']['chats']['Row'];

const MainFeed: React.FC<{
  posts: VibeEcho[];
  handlePost: () => void;
  setNewPost: (content: string) => void;
  newPost: string;
  handleLike: (postId: string) => void;
  handleComment: (postId: string) => void;
  handleShare: (postId: string) => void;
  handleDeletePost: (postId: string) => void;
  comments: { [key: string]: Message[] };
  showCommentModal: boolean;
  setShowCommentModal: (show: boolean) => void;
  selectedPost: string | null;
  newComment: string;
  setNewComment: (content: string) => void;
  submitComment: () => void;
}> = ({
  posts,
  handlePost,
  setNewPost,
  newPost,
  handleLike,
  handleComment,
  handleShare,
  handleDeletePost,
  comments,
  showCommentModal,
  setShowCommentModal,
  selectedPost,
  newComment,
  setNewComment,
  submitComment
}) => (
  <main className="lg:col-span-6">
    <div className="bg-slate-800 rounded-xl p-6 mb-6">
      <div className="flex space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          U
        </div>
        <div className="flex-1">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-slate-700 rounded-lg p-3 text-gray-100 placeholder-gray-400 border border-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            rows={3}
          />
          <div className="flex justify-between items-center mt-4">
            <div className="flex space-x-2">
              <input type="file" accept="image/*" id="photo-upload" className="hidden" />
              <button
                onClick={() => document.getElementById('photo-upload')?.click()}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <Image size={18} />
                <span className="hidden sm:inline">Photo</span>
              </button>
              <input type="file" accept="video/*" id="video-upload" className="hidden" />
              <button
                onClick={() => document.getElementById('video-upload')?.click()}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <Video size={18} />
                <span className="hidden sm:inline">Video</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                <Smile size={18} />
                <span className="hidden sm:inline">Mood</span>
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-400">{280 - newPost.length} characters</span>
              <button
                onClick={handlePost}
                disabled={!newPost.trim() || newPost.length > 280}
                className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="space-y-6">
      {posts.map((post) => (
        <article
          key={post.id}
          className="bg-slate-800 rounded-xl p-6 hover:bg-slate-800/80 transition-colors"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex space-x-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600"
              >
                {post.profiles?.avatar_url ? (
                  <img src={post.profiles.avatar_url} alt={post.profiles.full_name || 'User'} className="w-full h-full rounded-full object-cover" />
                ) : (
                  post.profiles?.full_name?.[0] || 'U'
                )}
              </div>
              <div>
                <h3 className="font-semibold hover:text-indigo-400 cursor-pointer">{post.profiles?.full_name || 'Unknown User'}</h3>
                <span className="text-sm text-gray-400">@{post.profiles?.username || 'unknown'} • {new Date(post.created_at).toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (post.user_id === user?.id) handleDeletePost(post.id);
              }}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
          <p className="mb-4 leading-relaxed">{post.content}</p>
          {post.media_url && post.media_type === 'image' && (
            <img src={post.media_url} alt="Post media" className="mb-4 h-64 w-full object-cover rounded-lg" />
          )}
          {post.media_url && post.media_type === 'video' && (
            <video controls className="mb-4 h-64 w-full object-cover rounded-lg">
              <source src={post.media_url} type="video/mp4" />
            </video>
          )}
          <p className="text-sm text-gray-400 mb-4">Mood: {post.mood}</p>
          <div className="flex items-center space-x-6 text-sm text-gray-400 pb-3 mb-3 border-b border-slate-700">
            <span className="hover:text-indigo-400 cursor-pointer">{post.likes_count} likes</span>
            <span className="hover:text-indigo-400 cursor-pointer">{post.responses_count} responses</span>
          </div>
          <div className="flex justify-around">
            <button
              onClick={() => handleLike(post.id)}
              className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:bg-slate-700 hover:text-gray-200 rounded-lg transition-all hover:scale-105"
            >
              <Heart size={18} />
              <span>Like</span>
            </button>
            <button
              onClick={() => handleComment(post.id)}
              className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:bg-slate-700 hover:text-gray-200 rounded-lg transition-all hover:scale-105"
            >
              <MessageCircle size={18} />
              <span>Comment</span>
            </button>
            <button
              onClick={() => handleShare(post.id)}
              className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:bg-slate-700 hover:text-gray-200 rounded-lg transition-all hover:scale-105"
            >
              <Share2 size={18} />
              <span>Share</span>
            </button>
          </div>
        </article>
      ))}
    </div>
    {showCommentModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Add Response</h3>
            <button
              onClick={() => setShowCommentModal(false)}
              className="p-2 hover:bg-slate-700 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your response..."
            className="w-full bg-slate-700 rounded-lg p-3 text-gray-100 placeholder-gray-400 border border-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            rows={4}
          />
          <div className="flex justify-end mt-4">
            <button
              onClick={submitComment}
              disabled={!newComment.trim()}
              className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              Post Response
            </button>
          </div>
          {selectedPost && comments[selectedPost]?.length > 0 && (
            <div className="mt-4 max-h-48 overflow-y-auto">
              {comments[selectedPost].map((comment) => (
                <div key={comment.id} className="p-3 bg-slate-700/50 rounded-lg mb-2">
                  <p className="text-sm font-semibold">{comment.profiles?.full_name || 'Unknown User'}</p>
                  <p className="text-sm">{comment.content}</p>
                  <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )}
  </main>
);

const Discover: React.FC<{ communities: Community[] }> = ({ communities }) => (
  <main className="lg:col-span-6">
    <div className="bg-slate-800 rounded-xl p-6">
      <h3 className="font-semibold text-lg mb-4 flex items-center space-x-2">
        <Search size={20} />
        <span>Discover Communities</span>
      </h3>
      <div className="space-y-4">
        {communities.map((community) => (
          <div key={community.id} className="p-4 bg-slate-700 rounded-lg">
            <h4 className="font-medium text-indigo-400">{community.name}</h4>
            <p className="text-sm text-gray-400">{community.description}</p>
            <p className="text-xs text-gray-500">{community.member_count} members • {community.category}</p>
          </div>
        ))}
      </div>
    </div>
  </main>
);

const Friends: React.FC<{ suggestedFriends: Profile[]; handleFollow: (userId: string) => void; followStatus: { [key: string]: boolean } }> = ({ suggestedFriends, handleFollow, followStatus }) => (
  <main className="lg:col-span-6">
    <div className="bg-slate-800 rounded-xl p-6">
      <h3 className="font-semibold text-lg mb-4 flex items-center space-x-2">
        <Users size={20} />
        <span>Suggested Friends</span>
      </h3>
      <div className="space-y-4">
        {suggestedFriends.map((friend) => (
          <div key={friend.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-sm">
                {friend.avatar_url ? (
                  <img src={friend.avatar_url} alt={friend.full_name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  friend.full_name[0]
                )}
              </div>
              <div>
                <h4 className="font-medium text-sm hover:text-indigo-400 cursor-pointer">{friend.full_name}</h4>
                <span className="text-xs text-gray-400">@{friend.username}</span>
                <p className="text-xs text-gray-500">Vibe Score: {friend.vibe_score}</p>
              </div>
            </div>
            <button
              onClick={() => handleFollow(friend.user_id)}
              className={`px-3 py-1 text-sm rounded-lg transition-all ${
                followStatus[friend.user_id]
                  ? 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
            >
              {followStatus[friend.user_id] ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
    </div>
  </main>
);

const App: React.FC = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [posts, setPosts] = useState<VibeEcho[]>([]);
  const [newPost, setNewPost] = useState<string>('');
  const [newPostMood, setNewPostMood] = useState<string>('happy');
  const [notifications, setNotifications] = useState<number>(0);
  const [showCommentModal, setShowCommentModal] = useState<boolean>(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<string>('');
  const [comments, setComments] = useState<{ [key: string]: Message[] }>({});
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('feed');
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [suggestedFriends, setSuggestedFriends] = useState<Profile[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [followStatus, setFollowStatus] = useState<{ [key: string]: boolean }>({});

  // Authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch posts
useEffect(() => {
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('vibe_echoes')
      .select('*, profiles(username, full_name, avatar_url)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }
    setPosts(data || []);
  };
  fetchPosts();
}, []);

  // Fetch suggested friends
  useEffect(() => {
    const fetchSuggestedFriends = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, username, full_name, avatar_url, vibe_score, created_at, updated_at')
        .limit(3);
      if (error) {
        console.error('Error fetching suggested friends:', error);
        return;
      }
      setSuggestedFriends(data || []);
    };
    fetchSuggestedFriends();
  }, []);

  // Fetch communities
  useEffect(() => {
    const fetchCommunities = async () => {
      const { data, error } = await supabase
        .from('communities')
        .select('id, name, description, category, member_count, created_at, is_active')
        .eq('is_active', true)
        .limit(6);
      if (error) {
        console.error('Error fetching communities:', error);
        return;
      }
      setCommunities(data || []);
    };
    fetchCommunities();
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('id')
        .eq('user1_id', user.id)
        .or(`user2_id.eq.${user.id}`);
      if (chatsError) {
        console.error('Error fetching chats:', chatsError);
        return;
      }
      if (!chats) return;
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(username, full_name)')
        .in('chat_id', chats.map((chat: Chat) => chat.id))
        .neq('sender_id', user.id)
        .is('read_at', null);
      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }
      setNotifications(data?.length || 0);
    };
    fetchNotifications();
  }, [user]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google',   options: {
      redirectTo: 'https://sparkvibe.app'
    } });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    if (!user) {
      alert('Please log in to post.');
      return;
    }
    const post: Database['public']['Tables']['vibe_echoes']['Insert'] = {
      user_id: user.id,
      content: newPost,
      mood: newPostMood,
      media_type: 'text',
      likes_count: 0,
      responses_count: 0,
      is_active: true,
    };
    const { data, error } = await supabase.from('vibe_echoes').insert([post]).select('*, profiles(username, full_name, avatar_url)').single();
    if (error) {
      console.error('Error posting:', error);
      return;
    }
    setPosts([data as VibeEcho, ...posts]);
    setNewPost('');
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      alert('Please log in and select a file.');
      return;
    }
    const fileName = `public/${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('vibe-media')
      .upload(fileName, file);
    if (uploadError) {
      console.error('Error uploading media:', uploadError);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('vibe-media').getPublicUrl(fileName);
    const post: Database['public']['Tables']['vibe_echoes']['Insert'] = {
      user_id: user.id,
      content: newPost,
      media_url: publicUrl,
      media_type: file.type.startsWith('image') ? 'image' : 'video',
      mood: newPostMood,
      likes_count: 0,
      responses_count: 0,
      is_active: true,
    };
    const { data, error } = await supabase.from('vibe_echoes').insert([post]).select('*, profiles(username, full_name, avatar_url)').single();
    if (error) {
      console.error('Error posting:', error);
      return;
    }
    setPosts([data as VibeEcho, ...posts]);
    setNewPost('');
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      alert('Please log in to like posts.');
      return;
    }
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const { error } = await supabase
      .from('vibe_echoes')
      .update({ likes_count: post.likes_count + 1 })
      .eq('id', postId);
    if (error) {
      console.error('Error updating like:', error);
      return;
    }
    setPosts(posts.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p)));
  };

  const handleComment = async (postId: string) => {
    if (!user) {
      alert('Please log in to comment.');
      return;
    }
    setSelectedPost(postId);
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('id')
      .eq('user1_id', user.id)
      .or(`user2_id.eq.${user.id}`);
    if (chatsError) {
      console.error('Error fetching chats:', chatsError);
      return;
    }
    if (!chats) return;
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(username, full_name)')
      .in('chat_id', chats.map((chat: Chat) => chat.id));
    if (error) {
      console.error('Error fetching comments:', error);
      return;
    }
    setComments((prev) => ({ ...prev, [postId]: data || [] }));
    setShowCommentModal(true);
  };

  const submitComment = async () => {
    if (!newComment.trim() || !selectedPost || !user) return;
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id')
      .eq('user1_id', user.id)
      .or(`user2_id.eq.${user.id}`)
      .single() as { data: Chat | null; error: any };
    if (chatError || !chat) {
      const { data: match } = await supabase
        .from('vibe_matches')
        .select('id')
        .eq('user1_id', user.id)
        .or(`user2_id.eq.${user.id}`)
        .single() as { data: Database['public']['Tables']['vibe_matches']['Row'] | null; error: any };
      if (!match) {
        const { data: newMatch } = await supabase
          .from('vibe_matches')
          .insert([{ user1_id: user.id, user2_id: posts.find((p) => p.id === selectedPost)?.user_id, compatibility_score: 0.0 }])
          .select()
          .single() as { data: Database['public']['Tables']['vibe_matches']['Row'] | null; error: any };
        if (!newMatch) {
          alert('No match available for commenting.');
          return;
        }
        const { data: newChat } = await supabase
          .from('chats')
          .insert([{ match_id: newMatch.id, user1_id: user.id, user2_id: posts.find((p) => p.id === selectedPost)?.user_id }])
          .select()
          .single() as { data: Chat | null; error: any };
        if (!newChat) return;
        const { error } = await supabase
          .from('messages')
          .insert([{ chat_id: newChat.id, sender_id: user.id, content: newComment, message_type: 'text' }]);
        if (error) {
          console.error('Error posting comment:', error);
          return;
        }
        setComments({
          ...comments,
          [selectedPost]: [...(comments[selectedPost] || []), { id: '', chat_id: newChat.id, sender_id: user.id, content: newComment, message_type: 'text', created_at: new Date().toISOString(), profiles: { username: user.user_metadata.preferred_username, full_name: user.user_metadata.full_name }, media_url: null, read_at: null }],
        });
        setPosts(posts.map((post) => (post.id === selectedPost ? { ...post, responses_count: post.responses_count + 1 } : post)));
      } else {
        const { data: newChat } = await supabase
          .from('chats')
          .insert([{ match_id: match.id, user1_id: user.id, user2_id: posts.find((p) => p.id === selectedPost)?.user_id }])
          .select()
          .single() as { data: Chat | null; error: any };
        if (!newChat) return;
        const { error } = await supabase
          .from('messages')
          .insert([{ chat_id: newChat.id, sender_id: user.id, content: newComment, message_type: 'text' }]);
        if (error) {
          console.error('Error posting comment:', error);
          return;
        }
        setComments({
          ...comments,
          [selectedPost]: [...(comments[selectedPost] || []), { id: '', chat_id: newChat.id, sender_id: user.id, content: newComment, message_type: 'text', created_at: new Date().toISOString(), profiles: { username: user.user_metadata.preferred_username, full_name: user.user_metadata.full_name }, media_url: null, read_at: null }],
        });
        setPosts(posts.map((post) => (post.id === selectedPost ? { ...post, responses_count: post.responses_count + 1 } : post)));
      }
    } else {
      const { error } = await supabase
        .from('messages')
        .insert([{ chat_id: chat.id, sender_id: user.id, content: newComment, message_type: 'text' }]);
      if (error) {
        console.error('Error posting comment:', error);
        return;
      }
      setComments({
        ...comments,
        [selectedPost]: [...(comments[selectedPost] || []), { id: '', chat_id: chat.id, sender_id: user.id, content: newComment, message_type: 'text', created_at: new Date().toISOString(), profiles: { username: user.user_metadata.preferred_username, full_name: user.user_metadata.full_name }, media_url: null, read_at: null }],
      });
      setPosts(posts.map((post) => (post.id === selectedPost ? { ...post, responses_count: post.responses_count + 1 } : post)));
    }
    setNewComment('');
    setShowCommentModal(false);
  };

  const handleShare = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const { error } = await supabase
      .from('vibe_echoes')
      .update({ responses_count: post.responses_count + 1 })
      .eq('id', postId);
    if (error) {
      console.error('Error sharing post:', error);
      return;
    }
    setPosts(posts.map((post) => (post.id === postId ? { ...post, responses_count: post.responses_count + 1 } : post)));
    const message = document.createElement('div');
    message.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse';
    message.textContent = 'Post shared successfully!';
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 3000);
  };

  const handleFollow = async (userId: string) => {
    if (!user) {
      alert('Please log in to follow users.');
      return;
    }
    const { error } = await supabase
      .from('vibe_matches')
      .insert([{ user1_id: user.id, user2_id: userId, compatibility_score: 0.0 }]);
    if (error) {
      console.error('Error following user:', error);
      return;
    }
    setFollowStatus({ ...followStatus, [userId]: true });
  };

  const handleDeletePost = async (postId: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this post?')) return;
    const { error } = await supabase.from('vibe_echoes').update({ is_active: false }).eq('id', postId).eq('user_id', user.id);
    if (error) {
      console.error('Error deleting post:', error);
      return;
    }
    setPosts(posts.filter((post) => post.id !== postId));
  };

  const clearNotifications = async () => {
    if (!user) return;
    const { data: chats } = await supabase.from('chats').select('id').eq('user1_id', user.id).or(`user2_id.eq.${user.id}`);
    if (!chats) return;
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('chat_id', chats.map((chat: Chat) => chat.id))
      .is('read_at', null);
    if (error) {
      console.error('Error clearing notifications:', error);
      return;
    }
    setNotifications(0);
    setShowNotifications(false);
  };

  // CONDITIONAL RENDERING: Show landing page if not authenticated, show main app if authenticated
  return (
    <BrowserRouter>
      {!user ? (
        // Show landing page if not logged in
        <LandingPage />
      ) : (
        // Show your existing app if logged in
        <div className="min-h-screen bg-slate-900 text-gray-100">
          <header className="sticky top-0 z-50 bg-slate-800/95 backdrop-blur-md border-b border-slate-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="lg:hidden p-2 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
                  </button>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent cursor-pointer">
                    SparkVibe
                  </h1>
                  <div className="hidden md:flex items-center bg-slate-700 rounded-lg px-3 py-2 w-64">
                    <Search size={18} className="text-gray-400 mr-2" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent outline-none text-sm flex-1 placeholder-gray-400"
                    />
                  </div>
                </div>
                <nav className="hidden lg:flex items-center space-x-8">
                  <Link to="/" className={`hover:text-indigo-400 transition-colors flex items-center space-x-1 ${activeTab === 'feed' ? 'text-indigo-400' : ''}`}>
                    <Home size={18} />
                    <span>Home</span>
                  </Link>
                  <Link to="/discover" className={`hover:text-indigo-400 transition-colors flex items-center space-x-1 ${activeTab === 'discover' ? 'text-indigo-400' : ''}`}>
                    <Hash size={18} />
                    <span>Discover</span>
                  </Link>
                  <Link to="/friends" className={`hover:text-indigo-400 transition-colors flex items-center space-x-1 ${activeTab === 'friends' ? 'text-indigo-400' : ''}`}>
                    <Users size={18} />
                    <span>Friends</span>
                  </Link>
                  <Link to="/settings" className={`hover:text-indigo-400 transition-colors flex items-center space-x-1 ${activeTab === 'settings' ? 'text-indigo-400' : ''}`}>
                    <Settings size={18} />
                    <span>Settings</span>
                  </Link>
                </nav>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Bell size={20} />
                      {notifications > 0 && (
                        <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {notifications}
                        </span>
                      )}
                    </button>
                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-80 bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                          <h3 className="font-semibold">Notifications</h3>
                          <button
                            onClick={clearNotifications}
                            className="text-sm text-indigo-400 hover:underline"
                          >
                            Mark all as read
                          </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications > 0 && (
                            <div className="p-4 text-sm text-gray-400">
                              You have {notifications} unread messages.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                    >
                      {user ? user.user_metadata?.full_name?.[0] || 'U' : 'U'}
                    </button>
                    {showUserDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-slate-700">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                              {user ? user.user_metadata?.full_name?.[0] || 'U' : 'U'}
                            </div>
                            <div>
                              <p className="font-semibold">{user ? user.user_metadata?.full_name || 'User' : 'Guest'}</p>
                              <p className="text-sm text-gray-400">{user ? '@' + user.user_metadata?.preferred_username : '@guest'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-2">
                          <Link to="/profile" className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors">
                            <UserIcon size={18} />
                            <span>Profile</span>
                          </Link>
                          <Link to="/settings" className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors">
                            <Settings size={18} />
                            <span>Settings</span>
                          </Link>
                          <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors">
                            <Shield size={18} />
                            <span>Privacy</span>
                          </button>
                          <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors">
                            <HelpCircle size={18} />
                            <span>Help</span>
                          </button>
                          <div className="border-t border-slate-700 mt-2 pt-2">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors text-red-400"
                            >
                              <LogOut size={18} />
                              <span>Logout</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>
          {showMobileMenu && (
            <div className="lg:hidden fixed inset-x-0 top-16 bg-slate-800/95 backdrop-blur-md z-40 border-b border-slate-700">
              <nav className="flex flex-col p-4 space-y-2">
                <Link to="/" className="text-left py-2 px-4 hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-2">
                  <Home size={18} />
                  <span>Home</span>
                </Link>
                <Link to="/discover" className="text-left py-2 px-4 hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-2">
                  <Hash size={18} />
                  <span>Discover</span>
                </Link>
                <Link to="/friends" className="text-left py-2 px-4 hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-2">
                  <Users size={18} />
                  <span>Friends</span>
                </Link>
                <Link to="/settings" className="text-left py-2 px-4 hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-2">
                  <Settings size={18} />
                  <span>Settings</span>
                </Link>
              </nav>
            </div>
          )}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <aside className="hidden lg:block lg:col-span-3">
                <div className="bg-slate-800 rounded-xl p-6 sticky top-24">
                  <nav className="space-y-2">
                    <Link
                      to="/"
                      onClick={() => setActiveTab('feed')}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        activeTab === 'feed' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700'
                      }`}
                    >
                      <Home size={20} />
                      <span>Feed</span>
                    </Link>
                    <Link
                      to="/discover"
                      onClick={() => setActiveTab('discover')}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        activeTab === 'discover' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700'
                      }`}
                    >
                      <Search size={20} />
                      <span>Discover</span>
                    </Link>
                    <Link
                      to="/friends"
                      onClick={() => setActiveTab('friends')}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        activeTab === 'friends' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700'
                      }`}
                    >
                      <Users size={20} />
                      <span>Friends</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setActiveTab('settings')}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700'
                      }`}
                    >
                      <Settings size={20} />
                      <span>Settings</span>
                    </Link>
                  </nav>
                  <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
                    <h4 className="font-semibold mb-3 text-sm">Your Stats</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Posts</span>
                        <span className="font-medium">{posts.filter((p) => p.user_id === user?.id).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Followers</span>
                        <span className="font-medium">{0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Following</span>
                        <span className="font-medium">{Object.values(followStatus).filter((v) => v).length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
              <Routes>
                <Route
                  path="/"
                  element={
                    <MainFeed
                      posts={posts}
                      handlePost={handlePost}
                      setNewPost={setNewPost}
                      newPost={newPost}
                      handleLike={handleLike}
                      handleComment={handleComment}
                      handleShare={handleShare}
                      handleDeletePost={handleDeletePost}
                      comments={comments}
                      showCommentModal={showCommentModal}
                      setShowCommentModal={setShowCommentModal}
                      selectedPost={selectedPost}
                      newComment={newComment}
                      setNewComment={setNewComment}
                      submitComment={submitComment}
                    />
                  }
                />
                <Route path="/discover" element={<Discover communities={communities} />} />
                <Route path="/friends" element={<Friends suggestedFriends={suggestedFriends} handleFollow={handleFollow} followStatus={followStatus} />} />
                <Route path="/settings" element={<div className="lg:col-span-6 bg-slate-800 rounded-xl p-6">Settings Page (To be implemented)</div>} />
                <Route path="/profile" element={<div className="lg:col-span-6 bg-slate-800 rounded-xl p-6">Profile Page (To be implemented)</div>} />
              </Routes>
              <aside className="hidden lg:block lg:col-span-3">
                <div className="bg-slate-800 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center space-x-2">
                    <TrendingUp size={20} />
                    <span>Trending Communities</span>
                  </h3>
                  <div className="space-y-3">
                    {communities.map((community) => (
                      <div
                        key={community.id}
                        className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer transition-all hover:translate-x-1"
                      >
                        <h4 className="font-medium text-indigo-400">{community.name}</h4>
                        <span className="text-sm text-gray-400">{community.member_count} members</span>
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 text-indigo-400 text-sm hover:underline">
                    Show more
                  </button>
                </div>
                <div className="bg-slate-800 rounded-xl p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center space-x-2">
                    <Users size={20} />
                    <span>Suggested Friends</span>
                  </h3>
                  <div className="space-y-4">
                    {suggestedFriends.map((friend) => (
                      <div key={friend.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-sm">
                            {friend.avatar_url ? (
                              <img src={friend.avatar_url} alt={friend.full_name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              friend.full_name[0]
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-sm hover:text-indigo-400 cursor-pointer">{friend.full_name}</h4>
                            <span className="text-xs text-gray-400">@{friend.username}</span>
                            <p className="text-xs text-gray-500">Vibe Score: {friend.vibe_score}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleFollow(friend.user_id)}
                          className={`px-3 py-1 text-sm rounded-lg transition-all ${
                            followStatus[friend.user_id]
                              ? 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                              : 'bg-indigo-600 text-white hover:bg-indigo-500'
                          }`}
                        >
                          {followStatus[friend.user_id] ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </BrowserRouter>
  );
};

export default App;