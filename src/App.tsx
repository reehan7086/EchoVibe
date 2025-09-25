import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Image as ImageIcon, Video, Smile, Users, Search, Bell, Menu, X, MoreHorizontal, LogOut } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Database } from '../supabase/types';
import { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import LandingPage from './components/LandingPage';
import AuthService from './services/AuthService';

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
  characterCount: number;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  handleTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
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
  user: SupabaseUser | null;
}> = ({
  posts,
  handlePost,
  setNewPost,
  newPost,
  characterCount,
  textareaRef,
  handleTextChange,
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
  submitComment,
  user,
}) => (
  <motion.main
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="lg:col-span-6 space-y-6"
  >
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
          {user?.user_metadata?.full_name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={newPost}
            onChange={handleTextChange}
            placeholder="What's on your mind?"
            className="w-full bg-transparent resize-none outline-none text-lg placeholder-white/50 min-h-[80px]"
            maxLength={280}
          />
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
        <div className="flex gap-4">
          <button className="p-2 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all">
            <ImageIcon size={18} />
          </button>
          <button className="p-2 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all">
            <Video size={18} />
          </button>
          <button className="p-2 rounded-full bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-all">
            <Smile size={18} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/60">{characterCount}/280</span>
          <button
            onClick={handlePost}
            disabled={!newPost.trim() || characterCount > 280}
            className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            Post
          </button>
        </div>
      </div>
    </div>
    <div className="space-y-4">
      {posts.map((post) => (
        <motion.article
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center font-bold text-lg">
                {post.profiles?.avatar_url ? (
                  <img src={post.profiles.avatar_url} alt={post.profiles.full_name || 'User'} className="w-full h-full rounded-full object-cover" />
                ) : (
                  post.profiles?.full_name?.[0] || 'U'
                )}
              </div>
              <div>
                <h3 className="font-semibold">{post.profiles?.full_name || 'Unknown User'}</h3>
                <p className="text-sm text-white/60">@{post.profiles?.username || 'unknown'} • {new Date(post.created_at).toLocaleString()}</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (post.user_id === user?.id) handleDeletePost(post.id);
              }}
              className="p-2 rounded-full hover:bg-white/10 transition-all"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
          <p className="mb-3 text-base leading-relaxed">{post.content}</p>
          {post.media_url && post.media_type === 'image' && (
            <img src={post.media_url} alt="Post media" className="mb-4 h-64 w-full object-cover rounded-lg" />
          )}
          {post.media_url && post.media_type === 'video' && (
            <video controls className="mb-4 h-64 w-full object-cover rounded-lg">
              <source src={post.media_url} type="video/mp4" />
            </video>
          )}
          <div className="inline-block px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm mb-4">
            Mood: {post.mood}
          </div>
          <div className="text-sm text-white/60 mb-3">
            {post.likes_count} likes • {post.responses_count} responses
          </div>
          <div className="flex items-center justify-around pt-3 border-t border-white/10">
            <button
              onClick={() => handleLike(post.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                post.likes_count > 0 
                  ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20' 
                  : 'text-white/60 hover:text-red-400 hover:bg-red-500/10'
              }`}
            >
              <Heart size={18} fill={post.likes_count > 0 ? 'currentColor' : 'none'} />
              <span className="text-sm">Like</span>
            </button>
            <button
              onClick={() => handleComment(post.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-white/60 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
            >
              <MessageCircle size={18} />
              <span className="text-sm">Comment</span>
            </button>
            <button
              onClick={() => handleShare(post.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-white/60 hover:text-green-400 hover:bg-green-500/10 transition-all"
            >
              <Share2 size={18} />
              <span className="text-sm">Share</span>
            </button>
          </div>
        </motion.article>
      ))}
    </div>
    <AnimatePresence>
      {showCommentModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-slate-800 rounded-xl p-6 w-full max-w-md"
          >
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
              <div className="mt-4 max-h-48 overflow-y-auto space-y-2">
                {comments[selectedPost].map((comment) => (
                  <div key={comment.id} className="p-3 bg-slate-700/50 rounded-lg">
                    <p className="text-sm font-semibold">{comment.profiles?.full_name || 'Unknown User'}</p>
                    <p className="text-sm">{comment.content}</p>
                    <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.main>
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

const ProfilePage: React.FC<{ user: SupabaseUser | null; onLogout: () => void }> = ({ user, onLogout }) => (
  <div className="p-4 space-y-6 lg:col-span-6">
    <div className="text-center py-8">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center font-bold text-3xl mx-auto mb-4">
        {user?.user_metadata?.full_name?.[0]?.toUpperCase() || 'U'}
      </div>
      <h2 className="text-2xl font-bold mb-2">{user?.user_metadata?.full_name || 'User'}</h2>
      <p className="text-white/60 mb-4">@{user?.user_metadata?.preferred_username || 'user'}</p>
      <div className="flex justify-center gap-8 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">42</div>
          <div className="text-sm text-white/60">Posts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">1.2K</div>
          <div className="text-sm text-white/60">Followers</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">856</div>
          <div className="text-sm text-white/60">Following</div>
        </div>
      </div>
    </div>
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-purple-400">Recent Activity</h3>
      <div className="bg-white/5 rounded-xl p-4">
        <p className="text-white/60">Your recent posts and activity will appear here.</p>
      </div>
    </div>
    <button
      onClick={onLogout}
      className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-red-500/10 text-red-400 transition-all text-left mt-8"
    >
      <LogOut size={18} />
      Sign Out
    </button>
  </div>
);

const SettingsPage: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [privacy, setPrivacy] = useState(false);

  return (
    <div className="p-4 space-y-6 lg:col-span-6">
      <h2 className="text-2xl font-bold text-purple-400">Settings</h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Account Settings</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <h4 className="font-medium">Push Notifications</h4>
                <p className="text-sm text-white/60">Receive notifications for new messages and updates</p>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-12 h-6 rounded-full transition-all ${notificationsEnabled ? 'bg-purple-500' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${notificationsEnabled ? 'translate-x-7' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <h4 className="font-medium">Dark Mode</h4>
                <p className="text-sm text-white/60">Use dark theme throughout the app</p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-6 rounded-full transition-all ${darkMode ? 'bg-purple-500' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-7' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <h4 className="font-medium">Private Profile</h4>
                <p className="text-sm text-white/60">Only approved followers can see your posts</p>
              </div>
              <button
                onClick={() => setPrivacy(!privacy)}
                className={`w-12 h-6 rounded-full transition-all ${privacy ? 'bg-purple-500' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${privacy ? 'translate-x-7' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Support</h3>
          <div className="space-y-3">
            {[
              { label: 'Help Center', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { label: 'Privacy Policy', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
              { label: 'Terms of Service', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { label: 'Report a Problem', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
            ].map((item) => (
              <button key={item.label} className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-left">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
                <svg className="w-5 h-5 ml-auto text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
        <div className="pt-4">
          <p className="text-center text-white/40 text-sm">EchoVibe v1.0.0</p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [posts, setPosts] = useState<VibeEcho[]>([]);
  const [newPost, setNewPost] = useState<string>('');
  const [newPostMood] = useState<string>('happy');
  const [showCommentModal, setShowCommentModal] = useState<boolean>(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<string>('');
  const [comments, setComments] = useState<{ [key: string]: Message[] }>({});
  const [activeTab, setActiveTab] = useState<string>('feed');
  const [suggestedFriends, setSuggestedFriends] = useState<Profile[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [followStatus] = useState<{ [key: string]: boolean }>({});
  const [characterCount, setCharacterCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw new Error('Session fetch failed');
        setUser(session?.user ?? null);
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setLoading(false);
      }
    };
    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

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
      // Placeholder for notification count logic
    };
    fetchNotifications();
  }, [user]);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      await supabase.auth.signOut();
      setUser(null);
      setPosts([]);
      setActiveTab('feed');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNewPost(text);
    setCharacterCount(text.length);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handlePost = async () => {
    if (!newPost.trim() || characterCount > 280 || !user) {
      if (!user) alert('Please log in to post.');
      return;
    }
    try {
      const post: Database['public']['Tables']['vibe_echoes']['Insert'] = {
        user_id: user.id,
        content: newPost.trim(),
        mood: newPostMood,
        media_type: 'text',
        likes_count: 0,
        responses_count: 0,
        is_active: true,
      };
      const { data, error } = await supabase
        .from('vibe_echoes')
        .insert([post])
        .select('*, profiles(username, full_name, avatar_url)')
        .single();
      if (error) throw new Error(`Error posting: ${error.message}`);
      setPosts([data as VibeEcho, ...posts]);
      setNewPost('');
      setCharacterCount(0);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error posting:', error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      alert('Please log in to like posts.');
      return;
    }
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    try {
      const newLikes = post.likes_count + 1;
      const { error } = await supabase
        .from('vibe_echoes')
        .update({ likes_count: newLikes })
        .eq('id', postId);
      if (error) throw new Error(`Error updating like: ${error.message}`);
      setPosts(posts.map((p) => (p.id === postId ? { ...p, likes_count: newLikes } : p)));
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleComment = async (postId: string) => {
    if (!user) {
      alert('Please log in to comment.');
      return;
    }
    setSelectedPost(postId);
    setShowCommentModal(true);
    try {
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('id')
        .eq('user1_id', user.id)
        .or(`user2_id.eq.${user.id}`);
      if (chatsError) throw new Error(`Error fetching chats: ${chatsError.message}`);
      if (!chats) return;
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(username, full_name)')
        .in('chat_id', chats.map((chat: Chat) => chat.id));
      if (error) throw new Error(`Error fetching comments: ${error.message}`);
      setComments((prev) => ({ ...prev, [postId]: data || [] }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !selectedPost || !user) return;
    try {
      const comment: Database['public']['Tables']['messages']['Insert'] = {
        chat_id: selectedPost,
        sender_id: user.id,
        content: newComment.trim(),
        created_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('messages').insert([comment]);
      if (error) throw new Error(`Error posting comment: ${error.message}`);
      const { data: newCommentData } = await supabase
        .from('messages')
        .select('*, profiles(username, full_name)')
        .eq('id', comment.id)
        .single();
      setComments((prev) => ({
        ...prev,
        [selectedPost]: [...(prev[selectedPost] || []), newCommentData as Message],
      }));
      setNewComment('');
      setShowCommentModal(false);
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleShare = async (postId: string) => {
    // Placeholder for share logic
    console.log(`Sharing post ${postId}`);
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('vibe_echoes')
        .update({ is_active: false })
        .eq('id', postId)
        .eq('user_id', user.id);
      if (error) throw new Error(`Error deleting post: ${error.message}`);
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleFollow = async (userId: string) => {
    // Placeholder for follow logic
    console.log(`Following user ${userId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-purple-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 text-white">
        <header className="sticky top-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3">
            <button 
              onClick={() => setSideMenuOpen(true)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              EchoVibe
            </h1>
            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all">
              <Bell className="w-6 h-6" />
            </button>
          </div>
        </header>
        <main className="pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <aside className="hidden lg:block lg:col-span-3">
              <nav className="space-y-2">
                {[
                  { id: 'feed', label: 'Feed', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', path: '/' },
                  { id: 'discover', label: 'Discover', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', path: '/discover' },
                  { id: 'friends', label: 'Friends', icon: 'M15 17h5l-5 5v-5zM9 17H4l5 5v-5zM18 7V2l-5 5h5zM6 7V2l5 5H6z', path: '/friends' },
                  { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', path: '/profile' },
                ].map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                      activeTab === item.id ? 'text-purple-400 bg-purple-500/10' : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {item.label}
                  </Link>
                ))}
              </nav>
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
                    characterCount={characterCount}
                    textareaRef={textareaRef}
                    handleTextChange={handleTextChange}
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
                    user={user}
                  />
                }
              />
              <Route path="/discover" element={<Discover communities={communities} />} />
              <Route path="/friends" element={<Friends suggestedFriends={suggestedFriends} handleFollow={handleFollow} followStatus={followStatus} />} />
              <Route path="/profile" element={<ProfilePage user={user} onLogout={handleLogout} />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
            <aside className="hidden lg:block lg:col-span-3">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
                <h3 className="font-semibold text-lg mb-4">Who to Follow</h3>
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
                        </div>
                      </div>
                      <button
                        onClick={() => handleFollow(friend.user_id)}
                        className={`px-3 py-1 text-sm rounded-lg transition-all ${
                          followStatus[friend.user_id] ? 'bg-slate-700 text-gray-400 hover:bg-slate-600' : 'bg-indigo-600 text-white hover:bg-indigo-500'
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
        </main>
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-t border-white/10 lg:hidden">
          <div className="flex items-center justify-around py-2">
            {[
              { id: 'feed', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Home', path: '/' },
              { id: 'discover', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', label: 'Discover', path: '/discover' },
              { id: 'friends', icon: 'M15 17h5l-5 5v-5zM9 17H4l5 5v-5zM18 7V2l-5 5h5zM6 7V2l5 5H6z', label: 'Friends', path: '/friends' },
              { id: 'profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'Profile', path: '/profile' },
            ].map((item) => (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                  activeTab === item.id 
                    ? 'text-purple-400 bg-purple-500/10' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
        <AnimatePresence>
          {sideMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-60"
                onClick={() => setSideMenuOpen(false)}
              />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                className="fixed top-0 left-0 h-full w-80 bg-black/90 backdrop-blur-xl z-70 p-6"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center font-bold text-xl">
                    {user?.user_metadata?.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{user?.user_metadata?.full_name || 'User'}</h2>
                    <p className="text-white/60">@{user?.user_metadata?.preferred_username || 'user'}</p>
                  </div>
                </div>
                <nav className="space-y-2">
                  {[
                    { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', path: '/profile' },
                    { id: 'settings', label: 'Settings', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4', path: '/settings' },
                    { id: 'help', label: 'Help & Support', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', path: '#' },
                  ].map((item) => (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setSideMenuOpen(false)}
                      className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition-all text-left"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      {item.label}
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-red-500/10 text-red-400 transition-all text-left mt-8"
                  >
                    <LogOut className="w-6 h-6" />
                    Sign Out
                  </button>
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
};

export default App;