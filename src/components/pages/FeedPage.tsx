import React, { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Image as ImageIcon, Video, Smile, MoreHorizontal } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { VibeEcho, Profile, Comment } from '../../types';
import { formatDate, getCurrentUser } from '../../utils';
import sanitizeHtml from 'sanitize-html';

// Import shared components
import PostCard from '../common/PostCard';
import CommentModal from '../common/CommentModal';
import MediaUpload from '../common/MediaUpload';

interface FeedPageProps {
  user: User;
  profile: Profile | null;
}

const FeedPage: React.FC<FeedPageProps> = ({ user, profile }) => {
  const [posts, setPosts] = useState<VibeEcho[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedMood, setSelectedMood] = useState('happy');
  const [characterCount, setCharacterCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [loading, setLoading] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const moods = ['happy', 'excited', 'peaceful', 'thoughtful', 'grateful', 'creative'];

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          setPosts([]);
          return;
        }

        // Fixed: Use 'likes' table and 'post_id' column
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', currentUser.id);
        
        if (likesError) throw new Error(`Error fetching likes: ${likesError.message}`);
        const likedPostIds = new Set(likesData?.map((like: any) => like.post_id) || []);
        
        const { data, error } = await supabase
          .from('vibe_echoes')
          .select('*, profiles(username, full_name, avatar_url)')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        
        if (error) throw new Error(`Error fetching posts: ${error.message}`);
        setPosts(
          (data || []).map((post: any) => ({
            ...post,
            user_has_liked: likedPostIds.has(post.id),
          }))
        );
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();

    const subscription = supabase
      .channel('vibe_echoes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vibe_echoes' }, async (payload: any) => {
        if (payload.new && typeof payload.new === 'object') {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url')
            .eq('user_id', payload.new.user_id)
            .single();
          if (!error) {
            setPosts((prev) => [{ ...payload.new, profiles: profileData, user_has_liked: false } as VibeEcho, ...prev]);
          }
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
      
      if (data && typeof data === 'object') {
        setPosts([{ ...data, user_has_liked: false } as VibeEcho, ...posts]);
      }
      
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
      const chatId = `post_${postId}`;
      
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .eq('id', chatId)
        .maybeSingle();
        
      if (chatError && chatError.code !== 'PGRST116') {
        throw new Error(`Error fetching chat: ${chatError.message}`);
      }
      
      if (!chatData) {
        const { error: createError } = await supabase
          .from('chats')
          .insert([{ 
            id: chatId,
            user1_id: user.id, 
            user2_id: posts.find(p => p.id === postId)?.user_id || user.id 
          }]);
        if (createError) throw new Error(`Error creating chat: ${createError.message}`);
      }

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
      
      if (data && typeof data === 'object') {
        setComments((prev) => ({
          ...prev,
          [selectedPost]: [...(prev[selectedPost] || []), data as Comment],
        }));
        setPosts(posts.map((p) => (p.id === selectedPost ? { ...p, responses_count: p.responses_count + 1 } : p)));
      }
      
      setNewComment('');
      setShowCommentModal(false);
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
      {/* Create Post */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
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
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={newPost}
              onChange={handleTextChange}
              placeholder="What's on your mind?"
              className="w-full bg-transparent resize-none outline-none text-lg placeholder-white/50 min-h-[80px] text-white"
              maxLength={280}
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
              >
                {mood}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-4">
            <MediaUpload onFileSelect={handleFileSelect} uploading={uploading} />
            <button className="p-2 rounded-full bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-all">
              <Smile size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/60">{characterCount}/280</span>
            <button
              onClick={handlePost}
              disabled={!newPost.trim() || characterCount > 280 || uploading}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/25 transition-all text-white"
            >
              {uploading ? 'Uploading...' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
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
          <div className="text-center py-8">
            <p className="text-white/60">No posts yet. Share something!</p>
          </div>
        )}
      </div>

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
    </motion.div>
  );
};

export default FeedPage;