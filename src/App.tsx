import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {BrowserRouter, Route, Routes, Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Image as ImageIcon, Video, Smile, Users, Search, Bell, Menu, X, MoreHorizontal, LogOut, Send, UserPlus, UserCheck, Camera, Upload, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
import sanitizeHtml from 'sanitize-html';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Environment debug:', {
  all_env: import.meta.env,
  supabase_url: import.meta.env.VITE_SUPABASE_URL,
  supabase_key: import.meta.env.VITE_SUPABASE_ANON_KEY,
});
// Types
type User = SupabaseUser;

type Profile = {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  vibe_score: number | null;
  follower_count?: number;
  following_count?: number;
  is_private?: boolean;
  created_at: string;
  updated_at: string;
};

type VibeEcho = {
  id: string;
  user_id: string;
  content: string;
  mood: string;
  media_url: string | null;
  media_type: string;
  likes_count: number;
  responses_count: number;
  is_active: boolean;
  created_at: string;
  profiles?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  user_has_liked?: boolean;
};

type Comment = {
  id: string;
  chat_id: string;  // Keep this as chat_id
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
};

type Community = {
  id: string;
  name: string;
  description: string;
  category: string;
  member_count: number;
  is_active: boolean;
  created_at: string;
  is_member?: boolean;
};

type Chat = {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  last_message: string | null;
  last_message_at: string | null;
  other_user?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
};

type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string | null;
    full_name: string | null;
  };
};

type NotificationRow = {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'message';
  content: string;
  is_read: boolean;
  created_at: string;
  related_user_id?: string;
};

type NotificationInsert = {
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'message';
  content: string;
  is_read: boolean;
  related_user_id?: string;
};

type Notification = NotificationRow & {
  related_user_profile?: Pick<Profile, 'username' | 'full_name' | 'avatar_url'>;
};

// Utility functions
const formatDate = (date: string) => {
  const now = new Date();
  const postDate = new Date(date);
  const diffInHours = (now.getTime() - postDate.getTime()) / (1000 * 3600);

  if (diffInHours < 1) return `${Math.floor(diffInHours * 60)}m`;
  if (diffInHours < 24) return `${Math.floor(diffInHours)}h`;
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`;
  return postDate.toLocaleDateString();
};
const getCurrentUser = async () => {
  try {
    // First try to get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return null;
    }
    
    if (!session?.user) {
      console.warn('No active session found');
      return null;
    }
    
    return session.user;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
};
// Components
const LandingPage: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 text-white flex items-center justify-center">
    <div className="text-center max-w-md mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
        Welcome to SparkVibe
      </h1>
      <p className="text-xl text-white/80 mb-8">Connect, share, and discover amazing content with your community.</p>
      <Link to="/login" className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all">
        Get Started
      </Link>
    </div>
  </div>
);

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Log In to Sparkvibe</h2>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
            aria-label="Email input"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
            aria-label="Password input"
          />
          <button
            onClick={handleLogin}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            aria-label="Log in"
          >
            Log In
          </button>
        </div>
        <p className="text-white/60 text-center mt-4">
          Don't have an account?{' '}
          <Link to="/signup" className="text-purple-400 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};
const SignUpPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            preferred_username: email.split('@')[0]
          }
        }
      });
      if (error) throw new Error(error.message);
      alert('Check your email for verification link!');
      navigate('/login');
    } catch (err) {
      setError('Failed to create account. Please try again.');
      console.error('SignUp error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up for SparkVibe</h2>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <div className="space-y-4">
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
          />
          <button
            onClick={handleSignUp}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            Sign Up
          </button>
        </div>
        <p className="text-white/60 text-center mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-400 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};
const MediaUpload: React.FC<{
  onFileSelect: (file: File, type: 'image' | 'video') => void;
  uploading: boolean;
}> = ({ onFileSelect, uploading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'image' | 'video'>('image');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file, uploadType);
    }
  };

  const triggerUpload = (type: 'image' | 'video') => {
    setUploadType(type);
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={uploadType === 'image' ? 'image/*' : 'video/*'}
        onChange={handleFileChange}
        className="hidden"
        aria-label={`Upload ${uploadType}`}
      />
      <div className="flex gap-4">
        <button
          onClick={() => triggerUpload('image')}
          disabled={uploading}
          className="p-2 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all disabled:opacity-50"
          aria-label="Add image"
        >
          {uploading ? <Upload size={18} className="animate-spin" /> : <ImageIcon size={18} />}
        </button>
        <button
          onClick={() => triggerUpload('video')}
          disabled={uploading}
          className="p-2 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all disabled:opacity-50"
          aria-label="Add video"
        >
          {uploading ? <Upload size={18} className="animate-spin" /> : <Video size={18} />}
        </button>
      </div>
    </>
  );
};

const PostCard: React.FC<{
  post: VibeEcho;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onDelete?: (postId: string) => void;
  currentUser: User | null;
}> = ({ post, onLike, onComment, onShare, onDelete, currentUser }) => (
  <motion.article
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4"
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center font-bold text-lg">
          {post.profiles?.avatar_url ? (
            <img
              src={post.profiles.avatar_url}
              alt={post.profiles?.full_name || 'User'}
              className="w-full h-full rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            post.profiles?.full_name?.[0] || 'U'
          )}
        </div>
        <div>
          <h3 className="font-semibold">{post.profiles?.full_name || 'Unknown User'}</h3>
          <p className="text-sm text-white/60">
            @{post.profiles?.username || 'unknown'} • {formatDate(post.created_at)}
          </p>
        </div>
      </div>
      {post.user_id === currentUser?.id && onDelete && (
        <button
          onClick={() => onDelete(post.id)}
          className="p-2 rounded-full hover:bg-white/10 transition-all"
          aria-label={`Delete post by ${post.profiles?.full_name || 'Unknown User'}`}
        >
          <MoreHorizontal size={18} />
        </button>
      )}
    </div>
    <p className="mb-3 text-base leading-relaxed">{post.content}</p>
    {post.media_url && post.media_type === 'image' && (
      <img
        src={post.media_url}
        alt="Post media"
        className="mb-4 h-64 w-full object-cover rounded-lg"
        loading="lazy"
      />
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
        onClick={() => onLike(post.id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
          post.user_has_liked
            ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
            : 'text-white/60 hover:text-red-400 hover:bg-red-500/10'
        }`}
        aria-label={`${post.user_has_liked ? 'Unlike' : 'Like'} post`}
      >
        <Heart size={18} fill={post.user_has_liked ? 'currentColor' : 'none'} />
        <span className="text-sm">{post.user_has_liked ? 'Liked' : 'Like'}</span>
      </button>
      <button
        onClick={() => onComment(post.id)}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-white/60 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
        aria-label="Comment on post"
      >
        <MessageCircle size={18} />
        <span className="text-sm">Comment</span>
      </button>
      <button
        onClick={() => onShare(post.id)}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-white/60 hover:text-green-400 hover:bg-green-500/10 transition-all"
        aria-label="Share post"
      >
        <Share2 size={18} />
        <span className="text-sm">Share</span>
      </button>
    </div>
  </motion.article>
);

const CommentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  postId: string | null;
  comments: Comment[];
  newComment: string;
  setNewComment: (content: string) => void;
  onSubmitComment: () => void;
  currentUser: User | null;
}> = ({ isOpen, onClose, postId, comments, newComment, setNewComment, onSubmitComment, currentUser }) => {
  if (!isOpen || !postId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        tabIndex={-1}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="bg-slate-800 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Comments</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg"
              aria-label="Close comment modal"
            >
              <X size={20} />
            </button>
          </div>
          <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-xs font-bold">
                      {comment.profiles?.full_name?.[0] || 'U'}
                    </div>
                    <p className="text-sm font-semibold">{comment.profiles?.full_name || 'Unknown User'}</p>
                    <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/60">No comments yet.</p>
            )}
          </div>
          <div className="border-t border-slate-600 pt-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your comment..."
              className="w-full bg-slate-700 rounded-lg p-3 text-gray-100 placeholder-gray-400 border border-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              rows={3}
              aria-label="Comment input"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={onSubmitComment}
                disabled={!newComment.trim()}
                className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                aria-label="Post comment"
              >
                Post Comment
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const SearchResults: React.FC<{
  query: string;
  users: Profile[];
  posts: VibeEcho[];
  onFollowUser: (userId: string) => void;
  followStatus: { [key: string]: boolean };
  handleLike: (postId: string) => void;
  handleComment: (postId: string) => void;
  handleShare: (postId: string) => void;
  handleDeletePost: (postId: string) => void;
  currentUser: User | null;
}> = ({ query, users, posts, onFollowUser, followStatus, handleLike, handleComment, handleShare, handleDeletePost, currentUser }) => (
  <div className="space-y-6">
    {users.length > 0 && (
      <div>
        <h3 className="text-lg font-semibold mb-4">Users</h3>
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center font-bold">
  {user.avatar_url ? (
    <img src={user.avatar_url} alt={user.full_name || 'User'} className="w-full h-full rounded-full object-cover" loading="lazy" />
  ) : (
    user.full_name?.[0] || 'U'
  )}
</div>
                <div>
                  <h4 className="font-medium">{user.full_name}</h4>
                  <p className="text-sm text-white/60">@{user.username}</p>
                </div>
              </div>
              {user.user_id !== currentUser?.id && (
                <button
                  onClick={() => onFollowUser(user.user_id)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    followStatus[user.user_id]
                      ? 'bg-slate-600 text-white hover:bg-slate-500'
                      : 'bg-purple-600 text-white hover:bg-purple-500'
                  }`}
                  aria-label={`${followStatus[user.user_id] ? 'Unfollow' : 'Follow'} ${user.full_name}`}
                >
                  {followStatus[user.user_id] ? (
                    <>
                      <UserCheck size={16} className="inline mr-1" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} className="inline mr-1" />
                      Follow
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
    {posts.length > 0 && (
      <div>
        <h3 className="text-lg font-semibold mb-4">Posts</h3>
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onDelete={post.user_id === currentUser?.id ? handleDeletePost : undefined}
              currentUser={currentUser}
            />
          ))}
        </div>
      </div>
    )}
    {users.length === 0 && posts.length === 0 && query && (
      <div className="text-center py-8">
        <p className="text-white/60">No results found for "{query}"</p>
      </div>
    )}
  </div>
);

const NotificationBell: React.FC<{
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
}> = ({ notifications, onMarkAsRead, onMarkAllAsRead }) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all relative"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 top-full mt-2 w-80 bg-slate-800 rounded-xl border border-white/10 shadow-xl z-50 max-h-96 overflow-y-auto"
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-sm text-purple-400 hover:text-purple-300"
                  aria-label="Mark all notifications as read"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="divide-y divide-white/10">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-white/5 cursor-pointer flex items-center gap-3 ${!notification.is_read ? 'bg-purple-500/10' : ''}`}
                    onClick={() => !notification.is_read && onMarkAsRead(notification.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && !notification.is_read && onMarkAsRead(notification.id)}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-xs font-bold">
                      {notification.related_user_profile?.full_name?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="text-sm">{notification.content}</p>
                      <span className="text-xs text-white/60">{formatDate(notification.created_at)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-white/60">No notifications yet</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ChatList: React.FC<{
  chats: Chat[];
  onSelectChat: (chatId: string) => void;
  currentUser: User | null;
}> = ({ chats, onSelectChat, currentUser }) => (
  <div className="space-y-2">
    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
      <MessageSquare size={20} />
      <span>Messages</span>
    </h3>
    {chats.length > 0 ? (
      chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => onSelectChat(chat.id)}
          className="p-4 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-all"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelectChat(chat.id)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-sm font-bold">
              {chat.other_user?.avatar_url ? (
                <img
                  src={chat.other_user.avatar_url}
                  alt={chat.other_user?.full_name || 'User'}
                  className="w-full h-full rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                chat.other_user?.full_name?.[0] || 'U'
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{chat.other_user?.full_name || 'Chat Partner'}</h4>
              <p className="text-sm text-white/60 truncate">{chat.last_message || 'No messages yet'}</p>
            </div>
            {chat.last_message_at && (
              <span className="text-xs text-white/40">{formatDate(chat.last_message_at)}</span>
            )}
          </div>
        </div>
      ))
    ) : (
      <div className="text-center py-8 text-white/60">No conversations yet</div>
    )}
  </div>
);

const ChatWindow: React.FC<{
  chatId: string;
  messages: Message[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: () => void;
  onClose: () => void;
  currentUser: User | null;
  otherUser: Pick<Profile, 'username' | 'full_name' | 'avatar_url'> | null;
}> = ({ chatId, messages, newMessage, setNewMessage, onSendMessage, onClose, currentUser, otherUser }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 md:static md:bg-transparent md:h-[80vh]">
    <div className="bg-slate-800 rounded-xl w-full max-w-md h-[80vh] flex flex-col md:h-full">
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-sm font-bold">
            {otherUser?.avatar_url ? (
              <img
                src={otherUser.avatar_url}
                alt={otherUser?.full_name || 'User'}
                className="w-full h-full rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              otherUser?.full_name?.[0] || 'U'
            )}
          </div>
          <h3 className="font-semibold">{otherUser?.full_name || 'Chat'}</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg" aria-label="Close chat">
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg ${
                message.sender_id === currentUser?.id ? 'bg-purple-600 text-white' : 'bg-slate-700 text-gray-100'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <span className="text-xs opacity-60">{formatDate(message.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Message input"
          />
          <button
            onClick={onSendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-all disabled:opacity-50"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  </div>
);

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
  user: User | null;
  uploading: boolean;
  onFileSelect: (file: File, type: 'image' | 'video') => void;
  selectedMood: string;
  setSelectedMood: (mood: string) => void;
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
  user,
  uploading,
  onFileSelect,
  selectedMood,
  setSelectedMood,
}) => {
  const moods = ['happy', 'excited', 'peaceful', 'thoughtful', 'grateful', 'creative'];

  return (
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
              aria-label="Create a new post"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm text-white/60 mb-2">Current mood:</label>
          <div className="flex flex-wrap gap-2">
            {moods.map((mood) => (
              <button
                key={mood}
                onClick={() => setSelectedMood(mood)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  selectedMood === mood ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                aria-label={`Select ${mood} mood`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-4">
            <MediaUpload onFileSelect={onFileSelect} uploading={uploading} />
            <button
              className="p-2 rounded-full bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-all"
              aria-label="Add mood"
            >
              <Smile size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/60">{characterCount}/280</span>
            <button
              onClick={handlePost}
              disabled={!newPost.trim() || characterCount > 280 || uploading}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/25 transition-all"
              aria-label="Post content"
            >
              {uploading ? 'Uploading...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onDelete={post.user_id === user?.id ? handleDeletePost : undefined}
              currentUser={user}
            />
          ))
        ) : (
          <p className="text-center text-white/60">No posts yet. Share something!</p>
        )}
      </div>
    </motion.main>
  );
};

const SearchPage: React.FC<{
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: { users: Profile[]; posts: VibeEcho[] };
  onSearch: () => void;
  onFollowUser: (userId: string) => void;
  followStatus: { [key: string]: boolean };
  handleLike: (postId: string) => void;
  handleComment: (postId: string) => void;
  handleShare: (postId: string) => void;
  handleDeletePost: (postId: string) => void;
  currentUser: User | null;
}> = ({ searchQuery, setSearchQuery, searchResults, onSearch, onFollowUser, followStatus, handleLike, handleComment, handleShare, handleDeletePost, currentUser }) => (
  <main className="lg:col-span-6">
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            placeholder="Search users and posts..."
            className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
            aria-label="Search input"
          />
        </div>
        <button
          onClick={onSearch}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
          aria-label="Search"
        >
          Search
        </button>
      </div>
      <SearchResults
        query={searchQuery}
        users={searchResults.users}
        posts={searchResults.posts}
        onFollowUser={onFollowUser}
        followStatus={followStatus}
        handleLike={handleLike}
        handleComment={handleComment}
        handleShare={handleShare}
        handleDeletePost={handleDeletePost}
        currentUser={currentUser}
      />
    </div>
  </main>
);

const MessagesPage: React.FC<{
  chats: Chat[];
  selectedChatId: string | null;
  messages: Message[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSelectChat: (chatId: string) => void;
  onSendMessage: () => void;
  onCloseChat: () => void;
  currentUser: User | null;
}> = ({ chats, selectedChatId, messages, newMessage, setNewMessage, onSelectChat, onSendMessage, onCloseChat, currentUser }) => {
  const selectedChat = chats.find((chat) => chat.id === selectedChatId);
  const otherUserId = selectedChat
    ? selectedChat.user1_id === currentUser?.id
      ? selectedChat.user2_id
      : selectedChat.user1_id
    : null;
  const otherUser = selectedChat?.other_user || null;

  return (
    <main className="lg:col-span-6">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 h-[80vh] flex flex-col">
        {!selectedChatId ? (
          <ChatList chats={chats} onSelectChat={onSelectChat} currentUser={currentUser} />
        ) : (
          <ChatWindow
            chatId={selectedChatId}
            messages={messages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            onSendMessage={onSendMessage}
            onClose={onCloseChat}
            currentUser={currentUser}
            otherUser={otherUser}
          />
        )}
      </div>
    </main>
  );
};

const CommunitiesPage: React.FC<{
  communities: Community[];
  onJoinCommunity: (communityId: string) => void;
  onLeaveCommunity: (communityId: string) => void;
  currentUser: User | null;
}> = ({ communities, onJoinCommunity, onLeaveCommunity, currentUser }) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = ['all', ...new Set(communities.map((c) => c.category))];
  const filteredCommunities = categoryFilter === 'all' ? communities : communities.filter((c) => c.category === categoryFilter);

  return (
    <main className="lg:col-span-6">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Users size={20} />
          <span>Discover Communities</span>
        </h3>
        <div className="mb-4">
          <label className="block text-sm text-white/60 mb-2">Filter by category:</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  categoryFilter === category ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                aria-label={`Filter by ${category}`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {filteredCommunities.length > 0 ? (
            filteredCommunities.map((community) => (
              <div key={community.id} className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-purple-400">{community.name}</h4>
                    <p className="text-sm text-white/60">{community.description}</p>
                    <p className="text-xs text-white/40">
                      {community.member_count} members • {community.category}
                    </p>
                  </div>
                  {currentUser && (
                    <button
                      onClick={() => (community.is_member ? onLeaveCommunity(community.id) : onJoinCommunity(community.id))}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        community.is_member
                          ? 'bg-slate-600 text-white hover:bg-slate-500'
                          : 'bg-purple-600 text-white hover:bg-purple-500'
                      }`}
                      aria-label={`${community.is_member ? 'Leave' : 'Join'} ${community.name}`}
                    >
                      {community.is_member ? 'Leave' : 'Join'}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-white/60">No communities found for this category.</p>
          )}
        </div>
      </div>
    </main>
  );
};

const ProfilePage: React.FC<{
  user: User | null;
  profile: Profile | null;
  posts: VibeEcho[];
  handleLike: (postId: string) => void;
  handleComment: (postId: string) => void;
  handleShare: (postId: string) => void;
  handleDeletePost: (postId: string) => void;
  onLogout: () => void;
}> = ({ user, profile, posts, handleLike, handleComment, handleShare, handleDeletePost, onLogout }) => (
  <main className="lg:col-span-6 p-4 space-y-6">
    <div className="text-center py-8">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center font-bold text-3xl mx-auto mb-4">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile?.full_name || 'User'}
            className="w-full h-full rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          profile?.full_name?.[0]?.toUpperCase() || 'U'
        )}
      </div>
      <h2 className="text-2xl font-bold mb-2">{profile?.full_name || 'User'}</h2>
      <p className="text-white/60 mb-4">@{profile?.username || 'user'}</p>
      <div className="flex justify-center gap-8 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">{posts.length}</div>
          <div className="text-sm text-white/60">Posts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">{profile?.follower_count || 0}</div>
          <div className="text-sm text-white/60">Followers</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">{profile?.following_count || 0}</div>
          <div className="text-sm text-white/60">Following</div>
        </div>
      </div>
    </div>
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-purple-400">Your Posts</h3>
      {posts.length > 0 ? (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onDelete={handleDeletePost}
            currentUser={user}
          />
        ))
      ) : (
        <p className="text-center text-white/60">No posts yet.</p>
      )}
    </div>
    <button
      onClick={onLogout}
      className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-red-500/10 text-red-400 transition-all text-left mt-8"
      aria-label="Sign out"
    >
      <LogOut size={18} />
      Sign Out
    </button>
  </main>
);

const SettingsPage: React.FC<{
  user: User | null;
  profile: Profile | null;
  updateProfile: (updates: Partial<Profile>) => void;
}> = ({ user, profile, updateProfile }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [privacy, setPrivacy] = useState(profile?.is_private || false);
  const [username, setUsername] = useState(profile?.username || '');
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
      const updates: Partial<Profile> = {
        username,
        full_name: fullName,
        avatar_url: avatarUrl,
        is_private: privacy,
      };
      await updateProfile(updates);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    }
  };

  return (
    <main className="lg:col-span-6 p-4 space-y-6">
      <h2 className="text-2xl font-bold text-purple-400">Settings</h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Profile Settings</h3>
          <div className="space-y-3">
            <div className="p-4 bg-white/5 rounded-xl">
              <label className="block text-sm text-white/60 mb-1">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                aria-label="Username"
              />
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <label className="block text-sm text-white/60 mb-1">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                aria-label="Full Name"
              />
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <label className="block text-sm text-white/60 mb-1">Avatar URL</label>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                aria-label="Avatar URL"
              />
            </div>
            <button
              onClick={handleUpdateProfile}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
              aria-label="Save profile changes"
            >
              Save Profile
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Preferences</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <h4 className="font-medium">Push Notifications</h4>
                <p className="text-sm text-white/60">Receive notifications for new messages and updates</p>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-12 h-6 rounded-full transition-all ${notificationsEnabled ? 'bg-purple-500' : 'bg-white/20'}`}
                aria-label={`Toggle push notifications ${notificationsEnabled ? 'off' : 'on'}`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notificationsEnabled ? 'translate-x-7' : 'translate-x-0.5'
                  }`}
                />
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
                aria-label={`Toggle dark mode ${darkMode ? 'off' : 'on'}`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-7' : 'translate-x-0.5'}`}
                />
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
                aria-label={`Toggle private profile ${privacy ? 'off' : 'on'}`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${privacy ? 'translate-x-7' : 'translate-x-0.5'}`}
                />
              </button>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Support</h3>
          <div className="space-y-3">
            {[
              {
                label: 'Help Center',
                icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
              },
              {
                label: 'Privacy Policy',
                icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
              },
              {
                label: 'Terms of Service',
                icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
              },
              {
                label: 'Report a Problem',
                icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
              },
            ].map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-left"
                aria-label={item.label}
              >
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
          <p className="text-center text-white/40 text-sm">SparkVibe v1.0.0</p>
        </div>
      </div>
    </main>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<VibeEcho[]>([]);
  const [newPost, setNewPost] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<string>('happy');
  const [characterCount, setCharacterCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState<boolean>(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<string>('');
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ users: Profile[]; posts: VibeEcho[] }>({ users: [], posts: [] });
  const [followStatus, setFollowStatus] = useState<{ [key: string]: boolean }>({});
  const [suggestedFriends, setSuggestedFriends] = useState<Profile[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<string>('feed');
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation(); 
  const navigate = useNavigate();

    useEffect(() => {
    const pathToTab = {
      '/': 'feed',
      '/search': 'search', 
      '/messages': 'messages',
      '/communities': 'communities',
      '/profile': 'profile',
      '/settings': 'settings'
    } as const;
    
    setActiveTab(pathToTab[location.pathname as keyof typeof pathToTab] || 'feed');
  }, [location.pathname]);

  // Initialize app
  useEffect(() => {
const initializeApp = async () => {
  try {
    setLoading(true);
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error && error.name !== 'AuthSessionMissingError') {
      throw new Error(`Session fetch failed: ${error.message}`);
    }
    
    setUser(session?.user ?? null);
    
    if (session?.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      if (profileError && profileError.code !== 'PGRST116') {
        throw new Error(`Profile fetch failed: ${profileError.message}`);
      }
      setProfile(profileData);
    }
  } catch (error) {
    console.error('Failed to initialize app:', error);
    setUser(null); // Ensure user is null on error
  } finally {
    setLoading(false);
  }
};
    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate('/login');
    });
    return () => {
  subscription.unsubscribe();
};
  }, [navigate]);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, user_id, username, full_name, avatar_url, vibe_score, follower_count, following_count, is_private, created_at, updated_at')
          .eq('user_id', user.id)
          .single();
        if (error) throw new Error(`Error fetching profile: ${error.message}`);
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, [user?.id]);

  // Fetch posts
  useEffect(() => {
const fetchPosts = async () => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      setPosts([]);
      return;
    }

    const { data: likesData, error: likesError } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', currentUser.id);
    
    if (likesError) throw new Error(`Error fetching likes: ${likesError.message}`);
    const likedPostIds = new Set(likesData?.map((like) => like.post_id) || []);
    
    const { data, error } = await supabase
      .from('vibe_echoes')
      .select('*, profiles(username, full_name, avatar_url)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Error fetching posts: ${error.message}`);
    setPosts(
      (data || []).map((post) => ({
        ...post,
        user_has_liked: likedPostIds.has(post.id),
      }))
    );
  } catch (error) {
    console.error('Error fetching posts:', error);
  }
};
    fetchPosts();

    const subscription = supabase
      .channel('vibe_echoes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vibe_echoes' }, async (payload) => {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('user_id', payload.new.user_id)
          .single();
        if (!error) {
          setPosts((prev) => [{ ...payload.new, profiles: profileData, user_has_liked: false } as VibeEcho, ...prev]);
        }
      })
      .subscribe();
    return () => {
  subscription.unsubscribe();
};
  }, [user?.id]);

  // Fetch suggested friends
  useEffect(() => {
const fetchSuggestedFriends = async () => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      setSuggestedFriends([]);
      return;
    }

    const { data: followsData, error: followsError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUser.id);
    
    if (followsError) throw new Error(`Error fetching follows: ${followsError.message}`);
    const followingIds = new Set(followsData?.map((f) => f.following_id) || []);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, username, full_name, avatar_url, vibe_score, created_at, updated_at')
      .neq('user_id', currentUser.id)
      .limit(5);
    
    if (error) throw new Error(`Error fetching suggested friends: ${error.message}`);
    
    const filteredData = (data || []).filter(profile => !followingIds.has(profile.user_id));
    setSuggestedFriends(filteredData);
    setFollowStatus(
      Object.fromEntries(
        filteredData.map((profile) => [profile.user_id, followingIds.has(profile.user_id)])
      )
    );
  } catch (error) {
    console.error('Error fetching suggested friends:', error);
  }
};
    fetchSuggestedFriends();
  }, [user?.id]);

  // Fetch communities
  useEffect(() => {
const fetchCommunities = async () => {
  try {
    const currentUser = await getCurrentUser();
    
    let membershipIds = new Set();
    if (currentUser) {
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('community_memberships')
        .select('community_id')
        .eq('user_id', currentUser.id);
      
      if (membershipsError) throw new Error(`Error fetching memberships: ${membershipsError.message}`);
      membershipIds = new Set(membershipsData?.map((m) => m.community_id) || []);
    }
    
    const { data, error } = await supabase
      .from('communities')
      .select('id, name, description, category, member_count, created_at, is_active')
      .eq('is_active', true)
      .order('member_count', { ascending: false });
    
    if (error) throw new Error(`Error fetching communities: ${error.message}`);
    setCommunities(
      (data || []).map((community) => ({
        ...community,
        is_member: membershipIds.has(community.id),
      }))
    );
  } catch (error) {
    console.error('Error fetching communities:', error);
  }
};
    fetchCommunities();

    const subscription = supabase
      .channel('communities')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'communities' }, (payload) => {
        setCommunities((prev) => [{ ...payload.new, is_member: false } as Community, ...prev]);
      })
      .subscribe();
    return () => {
  subscription.unsubscribe();
};
  }, [user?.id]);

// Fetch chats
useEffect(() => {
  const fetchChats = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          id,
          user1_id,
          user2_id,
          created_at,
          last_message,
          last_message_at
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw new Error(`Error fetching chats: ${error.message}`);

      // Fetch other user profiles for each chat
      const chatsWithProfiles = await Promise.all(
        (data || []).map(async (chat) => {
          const otherUserId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url')
            .eq('user_id', otherUserId)
            .single();

          if (profileError) {
            console.error('Error fetching profile for chat:', profileError);
          }

          return {
            ...chat,
            other_user: profileData || { 
              username: 'Unknown', 
              full_name: 'Unknown User', 
              avatar_url: null 
            },
          };
        })
      );

      setChats(chatsWithProfiles);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  fetchChats();

  const subscription = supabase
    .channel('chats')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, async (payload) => {
      if (user && (payload.new.user1_id === user.id || payload.new.user2_id === user.id)) {
        const otherUserId = payload.new.user1_id === user.id ? payload.new.user2_id : payload.new.user1_id;
        
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('user_id', otherUserId)
          .single();
          
        if (!error) {
          setChats((prev) => [
            { 
              ...payload.new, 
              other_user: profileData || { 
                username: 'Unknown', 
                full_name: 'Unknown User', 
                avatar_url: null 
              } 
            } as Chat,
            ...prev,
          ]);
        }
      }
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [user?.id]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*, profiles!related_user_id(username, full_name, avatar_url)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
        if (error) throw new Error(`Error fetching notifications: ${error.message}`);
        setNotifications(data || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    fetchNotifications();

    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, async (payload) => {
        if (payload.new.user_id === user?.id) {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url')
            .eq('user_id', payload.new.related_user_id)
            .single();
          if (!error) {
            setNotifications((prev) => [
              { ...payload.new, related_user_profile: profileData || { username: 'Unknown', full_name: 'Unknown User', avatar_url: null } } as Notification,
              ...prev,
            ]);
          }
        }
      })
      .subscribe();
    return () => {
  subscription.unsubscribe();
};
  }, [user?.id]);

  // Handlers
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNewPost(text);
    setCharacterCount(text.length);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleFileSelect = async (file: File, type: 'image' | 'video') => {
    if (!user) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file);
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
      setNewPost((prev) => `${prev}\n[Media: ${publicUrl}]`);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload media.');
    } finally {
      setUploading(false);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim() || characterCount > 280 || !user || uploading) {
      if (!user) alert('Please log in to post.');
      return;
    }
    try {
      const sanitizedPost = sanitizeHtml(newPost.trim(), { allowedTags: [], allowedAttributes: {} });
      const mediaMatch = sanitizedPost.match(/\[Media: (.*?)\]/);
const post = {
  user_id: user.id,
  content: mediaMatch ? sanitizedPost.replace(mediaMatch[0], '') : sanitizedPost,
  mood: selectedMood,
  media_url: mediaMatch ? mediaMatch[1] : null,
  media_type: mediaMatch ? (mediaMatch[1].endsWith('.mp4') ? 'video' : 'image') : 'text',
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
      setSelectedMood('happy');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error posting:', error);
      alert('Failed to post.');
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
      if (post.user_has_liked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ post_id: postId, user_id: user.id });
        if (error) throw new Error(`Error unliking: ${error.message}`);
        setPosts(posts.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count - 1, user_has_liked: false } : p)));
      } else {
        const { error } = await supabase
          .from('likes')
          .insert([{ post_id: postId, user_id: user.id }]);
        if (error) throw new Error(`Error liking: ${error.message}`);
        setPosts(posts.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count + 1, user_has_liked: true } : p)));
        if (post.user_id !== user.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', user.id)
            .single();
          const notification: NotificationInsert = {
            user_id: post.user_id,
            type: 'like',
            content: `${profile?.full_name || 'Someone'} liked your post`,
            is_read: false,
            related_user_id: user.id,
          };
          await supabase.from('notifications').insert([notification]);
        }
      }
    } catch (error) {
      console.error('Error updating like:', error);
      alert('Failed to update like.');
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
    // Create a dedicated comment chat for this post
    let chatId = `post_${postId}`;
    
    // Check if chat exists, if not create it
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .maybeSingle();
      
    if (chatError && chatError.code !== 'PGRST116') {
      throw new Error(`Error fetching chat: ${chatError.message}`);
    }
    
    if (!chatData) {
      // Create new chat for post comments
      const { error: createError } = await supabase
        .from('chats')
        .insert([{ 
          id: chatId,
          user1_id: user.id, 
          user2_id: posts.find(p => p.id === postId)?.user_id || user.id 
        }]);
      if (createError) throw new Error(`Error creating chat: ${createError.message}`);
    }

    // Fetch existing comments
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(username, full_name, avatar_url)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
      
    if (error) throw new Error(`Error fetching comments: ${error.message}`);
    setComments((prev) => ({ ...prev, [postId]: data || [] }));
  } catch (error) {
    console.error('Error fetching comments:', error);
  }
};

const submitComment = async () => {
  if (!newComment.trim() || !selectedPost || !user) return;
  try {
    const sanitizedComment = sanitizeHtml(newComment.trim(), { allowedTags: [], allowedAttributes: {} });
    const chatId = `post_${selectedPost}`;
    
const comment = {
  chat_id: chatId,
  sender_id: user.id,
  content: sanitizedComment,
};
    const { data, error } = await supabase
      .from('messages')
      .insert([comment])
      .select('*, profiles(username, full_name, avatar_url)')
      .single();
    if (error) throw new Error(`Error posting comment: ${error.message}`);
    
    setComments((prev) => ({
      ...prev,
      [selectedPost]: [...(prev[selectedPost] || []), data as Comment],
    }));
    setPosts(posts.map((p) => (p.id === selectedPost ? { ...p, responses_count: p.responses_count + 1 } : p)));
    setNewComment('');
    setShowCommentModal(false);

    const post = posts.find((p) => p.id === selectedPost);
    if (post && post.user_id !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();
      const notification: NotificationInsert = {
        user_id: post.user_id,
        type: 'comment',
        content: `${profile?.full_name || 'Someone'} commented on your post`,
        is_read: false,
        related_user_id: user.id,
      };
      await supabase.from('notifications').insert([notification]);
    }
  } catch (error) {
    console.error('Error posting comment:', error);
    alert('Failed to post comment.');
  }
};

  const handleShare = async (postId: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
        alert('Post link copied to clipboard!');
      } else {
        alert('Sharing not supported in this browser.');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to share post.');
    }
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
      alert('Failed to delete post.');
    }
  };

  const handleFollow = async (userId: string) => {
    if (!user) return;
    try {
      const isFollowing = followStatus[userId];
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .match({ follower_id: user.id, following_id: userId });
        if (error) throw new Error(`Error unfollowing: ${error.message}`);
      } else {
        const { error } = await supabase
          .from('follows')
          .insert([{ follower_id: user.id, following_id: userId }]);
        if (error) throw new Error(`Error following: ${error.message}`);

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        const notification: NotificationInsert = {
          user_id: userId,
          type: 'follow',
          content: `${profile?.full_name || 'Someone'} started following you`,
          is_read: false,
          related_user_id: user.id,
        };
        await supabase.from('notifications').insert([notification]);
      }
      setFollowStatus((prev) => ({ ...prev, [userId]: !isFollowing }));
    } catch (error) {
      console.error('Error updating follow status:', error);
      alert('Failed to update follow status.');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults({ users: [], posts: [] });
      return;
    }
    try {
      const query = searchQuery.toLowerCase();
      const [usersData, postsData] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, user_id, username, full_name, avatar_url, vibe_score, created_at, updated_at')
          .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
          .limit(10),
        supabase
          .from('vibe_echoes')
          .select('*, profiles(username, full_name, avatar_url)')
          .ilike('content', `%${query}%`)
          .eq('is_active', true)
          .limit(10),
      ]);

      if (usersData.error) throw new Error(`Error searching users: ${usersData.error.message}`);
      if (postsData.error) throw new Error(`Error searching posts: ${postsData.error.message}`);

      setSearchResults({
        users: usersData.data || [],
        posts: postsData.data || [],
      });
    } catch (error) {
      console.error('Error searching:', error);
      alert('Search failed.');
    }
  };

  const handleSelectChat = async (chatId: string) => {
    setSelectedChatId(chatId);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(username, full_name)')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      if (error) throw new Error(`Error fetching messages: ${error.message}`);
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatId || !user) return;
    try {
const message = {
  chat_id: selectedChatId,
  sender_id: user.id,
  content: newMessage.trim(),
};
      const { data, error } = await supabase
        .from('messages')
        .insert([message])
        .select('*, profiles(username, full_name)')
        .single();
      if (error) throw new Error(`Error sending message: ${error.message}`);
      setMessages([...messages, data as Message]);
      setNewMessage('');

      await supabase
        .from('chats')
        .update({
          last_message: newMessage.trim(),
          last_message_at: new Date().toISOString(),
        })
        .eq('id', selectedChatId);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message.');
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('community_memberships')
        .insert([{ community_id: communityId, user_id: user.id }]);
      if (error) throw new Error(`Error joining community: ${error.message}`);
      setCommunities((prev) =>
        prev.map((community) =>
          community.id === communityId
            ? { ...community, is_member: true, member_count: community.member_count + 1 }
            : community
        )
      );
    } catch (error) {
      console.error('Error joining community:', error);
      alert('Failed to join community.');
    }
  };

  const handleLeaveCommunity = async (communityId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('community_memberships')
        .delete()
        .match({ community_id: communityId, user_id: user.id });
      if (error) throw new Error(`Error leaving community: ${error.message}`);
      setCommunities((prev) =>
        prev.map((community) =>
          community.id === communityId
            ? { ...community, is_member: false, member_count: Math.max(0, community.member_count - 1) }
            : community
        )
      );
    } catch (error) {
      console.error('Error leaving community:', error);
      alert('Failed to leave community.');
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw new Error(`Error marking notification as read: ${error.message}`);
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id || '');
      if (error) throw new Error(`Error marking all notifications as read: ${error.message}`);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);
      if (error) throw new Error(`Error updating profile: ${error.message}`);
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setPosts([]);
      setActiveTab('feed');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };


if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-purple-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
    </div>
  );
}

return !user ? (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignUpPage />} />
  </Routes>
) : (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 text-white">
    <header className="sticky top-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setSideMenuOpen(true)}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          SparkVibe
        </h1>
        <NotificationBell
          notifications={notifications}
          onMarkAsRead={handleMarkNotificationAsRead}
          onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        />
      </div>
    </header>

    <main className="pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="hidden lg:block lg:col-span-3">
          <nav className="space-y-2 sticky top-24">
            {[
              { id: 'feed', label: 'Feed', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z', path: '/' },
              { id: 'search', label: 'Search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', path: '/search' },
              { id: 'messages', label: 'Messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', path: '/messages' },
              { id: 'communities', label: 'Communities', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', path: '/communities' },
              { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', path: '/profile' },
            ].map((item) => (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                  activeTab === item.id ? 'text-purple-400 bg-purple-500/10' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                aria-label={item.label}
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
                user={user}
                uploading={uploading}
                onFileSelect={handleFileSelect}
                selectedMood={selectedMood}
                setSelectedMood={setSelectedMood}
              />
            }
          />
          <Route
            path="/search"
            element={
              <SearchPage
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchResults={searchResults}
                onSearch={handleSearch}
                onFollowUser={handleFollow}
                followStatus={followStatus}
                handleLike={handleLike}
                handleComment={handleComment}
                handleShare={handleShare}
                handleDeletePost={handleDeletePost}
                currentUser={user}
              />
            }
          />
          <Route
            path="/messages"
            element={
              <MessagesPage
                chats={chats}
                selectedChatId={selectedChatId}
                messages={messages}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                onSelectChat={handleSelectChat}
                onSendMessage={handleSendMessage}
                onCloseChat={() => setSelectedChatId(null)}
                currentUser={user}
              />
            }
          />
          <Route
            path="/communities"
            element={
              <CommunitiesPage
                communities={communities}
                onJoinCommunity={handleJoinCommunity}
                onLeaveCommunity={handleLeaveCommunity}
                currentUser={user}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <ProfilePage
                user={user}
                profile={profile}
                posts={posts.filter((p) => p.user_id === user.id)}
                handleLike={handleLike}
                handleComment={handleComment}
                handleShare={handleShare}
                handleDeletePost={handleDeletePost}
                onLogout={handleLogout}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <SettingsPage
                user={user}
                profile={profile}
                updateProfile={updateProfile}
              />
            }
          />
        </Routes>

        <aside className="hidden lg:block lg:col-span-3">
          {/* Right sidebar with suggested friends and trending communities */}
          <div className="space-y-6 sticky top-24">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
              <h3 className="font-semibold text-lg mb-4">Who to Follow</h3>
              <div className="space-y-4">
                {suggestedFriends.slice(0, 3).map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-sm">
                        {friend.avatar_url ? (
                          <img
                            src={friend.avatar_url}
                            alt={friend.full_name || 'User'}
                            className="w-full h-full rounded-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          friend.full_name?.[0] || 'U'
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
                        followStatus[friend.user_id]
                          ? 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                          : 'bg-indigo-600 text-white hover:bg-indigo-500'
                      }`}
                      aria-label={`${followStatus[friend.user_id] ? 'Unfollow' : 'Follow'} ${friend.full_name}`}
                    >
                      {followStatus[friend.user_id] ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
              <h3 className="font-semibold text-lg mb-4">Trending Communities</h3>
              <div className="space-y-3">
                {communities.slice(0, 3).map((community) => (
                  <div key={community.id} className="p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-all">
                    <h4 className="font-medium text-sm text-purple-400">{community.name}</h4>
                    <p className="text-xs text-white/60 mt-1">{community.member_count} members</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>

    {/* Mobile navigation and side menu components */}
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-t border-white/10 lg:hidden">
<div className="flex items-center justify-around py-2">
  {[
    { id: 'feed', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z', label: 'Feed', path: '/' },
    { id: 'search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', label: 'Search', path: '/search' },
    { id: 'messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Messages', path: '/messages' },
    { id: 'communities', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', label: 'Communities', path: '/communities' },
    { id: 'profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'Profile', path: '/profile' }
  ].map((item) => (
    <Link
      key={item.id}
      to={item.path}
      onClick={() => setActiveTab(item.id)}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
        activeTab === item.id ? 'text-purple-400 bg-purple-500/10' : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
      aria-label={item.label}
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
            className="fixed inset-0 bg-black/50 z-60 lg:hidden"
            onClick={() => setSideMenuOpen(false)}
            aria-hidden="true"
          />
          <motion.div
  initial={{ x: -300 }}
  animate={{ x: 0 }}
  exit={{ x: -300 }}
  className="fixed top-0 left-0 h-full w-80 bg-black/90 backdrop-blur-xl z-70 p-6 lg:hidden"
>
  <div className="flex items-center gap-4 mb-8">
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center font-bold text-xl">
      {profile?.full_name?.[0]?.toUpperCase() || 'U'}
    </div>
    <div>
      <h2 className="text-xl font-bold">{profile?.full_name || 'User'}</h2>
      <p className="text-white/60">@{profile?.username || 'user'}</p>
    </div>
  </div>
  <nav className="space-y-2">
    {[
      { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', path: '/profile' },
      { id: 'settings', label: 'Settings', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4', path: '/settings' }
    ].map((item) => (
      <Link
        key={item.id}
        to={item.path}
        onClick={() => setSideMenuOpen(false)}
        className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition-all text-left"
        aria-label={item.label}
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
      aria-label="Sign out"
    >
      <LogOut className="w-6 h-6" />
      Sign Out
    </button>
  </nav>
</motion.div>
        </>
      )}
    </AnimatePresence>

    <CommentModal
      isOpen={showCommentModal}
      onClose={() => setShowCommentModal(false)}
      postId={selectedPost}
      comments={selectedPost ? comments[selectedPost] || [] : []}
      newComment={newComment}
      setNewComment={setNewComment}
      onSubmitComment={submitComment}
      currentUser={user}
    />
  </div>
);
};
export default App;
