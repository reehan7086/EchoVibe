import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { LogOut, Edit, Calendar, MapPin, Link2, Mail, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Profile, VibeEcho } from '../../types';
import PostCard from '../common/PostCard';
import { formatDate } from '../../utils';

interface ProfilePageProps {
  user: User;
  profile: Profile | null;
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, profile, onLogout }) => {
  const [posts, setPosts] = useState<VibeEcho[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'liked' | 'saved'>('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProfile, setEditProfile] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    city: profile?.city || ''
  });
  const [stats, setStats] = useState({
    postsCount: 0,
    likesReceived: 0,
    commentsReceived: 0
  });

  useEffect(() => {
    fetchUserPosts();
    fetchUserStats();
  }, [user]);

  const fetchUserPosts = async () => {
    try {
      setLoading(true);
      
      // Get user's likes for the posts
      const { data: likesData } = await supabase
          .from('vibe_likes')
          .select('vibe_echo_id')
        .eq('id', user.id);
      
      const likedPostIds = new Set(likesData?.map((like) => like.vibe_echo_id) || []);
      
      const { data, error } = await supabase
        .from('vibe_echoes')
        .select('*, profiles(username, full_name, avatar_url)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(`Error fetching posts: ${error.message}`);
      
      setPosts((data || []).map((post) => ({
        ...post,
        user_has_liked: likedPostIds.has(post.id),
      })));
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Get posts count
      const { count: postsCount } = await supabase
        .from('vibe_echoes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      // Get likes received on user's posts
      const { data: userPosts } = await supabase
        .from('vibe_echoes')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      const postIds = userPosts?.map(p => p.id) || [];
      
      let likesReceived = 0;
      let commentsReceived = 0;
      
      if (postIds.length > 0) {
        const { count: likesCount } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .in('post_id', postIds);
        
        const { count: commentsCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('chat_id', postIds.map(id => `post_${id}`));
        
        likesReceived = likesCount || 0;
        commentsReceived = commentsCount || 0;
      }
      
      setStats({
        postsCount: postsCount || 0,
        likesReceived,
        commentsReceived
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editProfile.full_name,
          username: editProfile.username,
          bio: editProfile.bio,
          location: editProfile.location,
          city: editProfile.city
        })
        .eq('id', user.id);
      
      if (error) throw new Error(`Error updating profile: ${error.message}`);
      
      setShowEditModal(false);
      window.location.reload(); // Refresh to show updated profile
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    }
  };

  const handleLike = async (postId: string) => {
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
          .from('vibe_likes')
          .insert([{ vibe_echo_id: postId, user_id: user.id }]);
        if (error) throw new Error(`Error liking: ${error.message}`);
        setPosts(posts.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count + 1, user_has_liked: true } : p)));
      }
    } catch (error) {
      console.error('Error updating like:', error);
      alert('Failed to update like.');
    }
  };

  const handleComment = (postId: string) => {
    // Navigate to post detail or open comment modal
    console.log('Comment on post:', postId);
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
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const { error } = await supabase
        .from('vibe_echoes')
        .update({ is_active: false })
        .eq('id', postId)
        .eq('id', user.id);
      
      if (error) throw new Error(`Error deleting post: ${error.message}`);
      setPosts(posts.filter((p) => p.id !== postId));
      setStats(prev => ({ ...prev, postsCount: prev.postsCount - 1 }));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Profile Header */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center font-bold text-3xl">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile?.full_name || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                profile?.full_name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">{profile?.full_name || 'User'}</h2>
                <p className="text-white/60">@{profile?.username || 'user'}</p>
              </div>
              <div className="flex gap-2 mt-4 md:mt-0">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  <Edit size={16} />
                  Edit Profile
                </button>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Bio */}
            {profile?.bio && (
              <p className="text-white/80 mb-4">{profile.bio}</p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 text-sm text-white/60 mb-4">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                Joined {formatDate(profile?.created_at || '')}
              </div>
              {profile?.location && (
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  {profile.location}
                </div>
              )}
              {profile?.city && (
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span className="text-white/60">
                    {profile.city}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Mail size={14} />
                {user.email}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.postsCount}</div>
                <div className="text-sm text-white/60">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">0</div>
                <div className="text-sm text-white/60">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">0</div>
                <div className="text-sm text-white/60">Following</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.likesReceived}</div>
                <div className="text-sm text-white/60">Likes</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <div className="flex gap-4 mb-6 border-b border-white/10">
          {[
            { id: 'posts', label: 'Posts', count: stats.postsCount },
            { id: 'liked', label: 'Liked', count: null },
            { id: 'saved', label: 'Saved', count: null }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'posts' | 'liked' | 'saved')}
              className={`pb-2 px-1 transition-all ${
                activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {tab.label} {tab.count !== null && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
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
              <div className="text-center py-8 text-white/60">
                <p>No posts yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'liked' && (
          <div className="text-center py-8 text-white/60">
            <p>Liked posts feature coming soon!</p>
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="text-center py-8 text-white/60">
            <p>Saved posts feature coming soon!</p>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-semibold text-white">Edit Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Full Name</label>
                <input
                  value={editProfile.full_name}
                  onChange={(e) => setEditProfile(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Username</label>
                <input
                  value={editProfile.username}
                  onChange={(e) => setEditProfile(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Bio</label>
                <textarea
                  value={editProfile.bio}
                  onChange={(e) => setEditProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 resize-none"
                  rows={3}
                  maxLength={150}
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Location</label>
                <input
                  value={editProfile.location}
                  onChange={(e) => setEditProfile(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Where are you based?"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">City</label>
                <input
                  value={editProfile.city}
                  onChange={(e) => setEditProfile(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Your city"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProfile}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProfilePage;