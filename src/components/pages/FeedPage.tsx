import React, { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { Smile } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { VibeEcho, Profile, Comment } from '../../types';
import { formatDate } from '../../utils';
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
  const [error, setError] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Profile[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const moods = ['happy', 'excited', 'peaceful', 'thoughtful', 'grateful', 'creative'];

  // Helper function to create safe profile
  const createSafeProfile = (profileData: any): Profile | undefined => {
    if (!profileData) return undefined;
    
    return {
      id: profileData.id,
      user_id: profileData.user_id,
      username: profileData.username || '',
      full_name: profileData.full_name || '',
      bio: profileData.bio,
      avatar_url: profileData.avatar_url,
      location: profileData.location,
      city: profileData.city,
      created_at: profileData.created_at,
      updated_at: profileData.updated_at,
      vibe_score: profileData.vibe_score || 0,
      is_online: profileData.is_online || false,
      last_active: profileData.last_active
    };
  };

  // Fetch posts with proper error handling
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user) {
          setPosts([]);
          return;
        }

        console.log('🔄 Fetching posts...');

        // Get user's likes first (CORRECTED: using 'likes' table with 'post_id')
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id);

        if (likesError) {
          console.error('Error fetching likes:', likesError);
        }

        const likedPostIds = new Set(likesData?.map((like) => like.post_id) || []);

        // Fetch posts (CORRECTED: removed columns that don't exist in your DB)
        const { data: postsData, error: postsError } = await supabase
          .from('vibe_echoes')
          .select(`
            id,
            user_id,
            content,
            media_url,
            media_type,
            mood,
            activity,
            location,
            city,
            duration,
            created_at,
            expires_at,
            likes_count,
            responses_count,
            is_active,
            profile_id
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(20);

        if (postsError) {
          throw postsError;
        }

        // Fetch profiles for posts
        let enrichedPosts = postsData || [];
        if (postsData && postsData.length > 0) {
          const userIds = [...new Set(postsData.map(post => post.user_id))];
          
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select(`
              id,
              user_id,
              username,
              full_name,
              bio,
              avatar_url,
              location,
              city,
              created_at,
              updated_at,
              vibe_score,
              is_online,
              last_active
            `)
            .in('user_id', userIds);

          if (!profilesError && profilesData) {
            setUserProfiles(profilesData as Profile[]);
            enrichedPosts = postsData.map(post => ({
              ...post,
              user_has_liked: likedPostIds.has(post.id),
              profiles: createSafeProfile(profilesData.find(profile => profile.user_id === post.user_id))
            }));
          }
        }

        console.log('✅ Posts fetched successfully:', enrichedPosts.length);
        setPosts(enrichedPosts);

      } catch (error: any) {
        console.error('Error fetching posts:', error);
        setError('Failed to load posts. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();

    // Subscribe to new posts
    const subscription = supabase
      .channel('vibe_echoes_feed')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'vibe_echoes' 
      }, async (payload) => {
        if (payload.new && payload.new.is_active) {
          try {
            // Fetch profile for new post
            const { data: profileData } = await supabase
              .from('profiles')
              .select('id, user_id, username, full_name, avatar_url, vibe_score, bio, location, city, created_at, updated_at, is_online, last_active')
              .eq('user_id', payload.new.user_id)
              .single();

            const newPost: VibeEcho = {
              ...payload.new as any,
              user_has_liked: false,
              profiles: createSafeProfile(profileData)
            };

            setPosts(prev => [newPost, ...prev]);
          } catch (error) {
            console.error('Error processing new post:', error);
          }
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNewPost(text);
    setCharacterCount(text.length);
    
    // Auto-resize textarea
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
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);
      
      setNewPost(prev => `${prev}\n[Media: ${publicUrl}]`);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload media.');
    } finally {
      setUploading(false);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim() || characterCount > 280 || !user || uploading) {
      return;
    }

    try {
      const sanitizedPost = sanitizeHtml(newPost.trim(), { 
        allowedTags: [], 
        allowedAttributes: {} 
      });
      
      const mediaMatch = sanitizedPost.match(/\[Media: (.*?)\]/);
      
      const postData = {
        user_id: user.id,
        content: mediaMatch ? sanitizedPost.replace(mediaMatch[0], '').trim() : sanitizedPost,
        mood: selectedMood,
        media_url: mediaMatch ? mediaMatch[1] : null,
        media_type: mediaMatch ? (mediaMatch[1].includes('.mp4') ? 'video' : 'image') : 'text',
        likes_count: 0,
        responses_count: 0,
        is_active: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

      const { data, error } = await supabase
        .from('vibe_echoes')
        .insert([postData])
        .select(`
          id,
          user_id,
          content,
          media_url,
          media_type,
          mood,
          activity,
          location,
          city,
          duration,
          created_at,
          expires_at,
          likes_count,
          responses_count,
          is_active,
          profile_id
        `)
        .single();

      if (error) throw error;

      // Add the post to the feed immediately
      const newPostWithProfile: VibeEcho = {
        ...data,
        user_has_liked: false,
        profiles: createSafeProfile(profile)
      };

      setPosts(prev => [newPostWithProfile, ...prev]);

      // Reset form
      setNewPost('');
      setCharacterCount(0);
      setSelectedMood('happy');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

    } catch (error: any) {
      console.error('Error posting:', error);
      alert('Failed to post. Please try again.');
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      alert('Please log in to like posts.');
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.user_has_liked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .match({ post_id: postId, user_id: user.id });

        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, likes_count: Math.max(0, p.likes_count - 1), user_has_liked: false }
            : p
        ));
      } else {
        // Like
        await supabase
          .from('likes')
          .insert([{ post_id: postId, user_id: user.id }]);

        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, likes_count: p.likes_count + 1, user_has_liked: true }
            : p
        ));
      }
    } catch (error: any) {
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
    
    // Load comments for this post
    try {
      const chatId = `post_${postId}`;
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          chat_id,
          sender_id,
          content,
          created_at,
          profiles:sender_id (
            id,
            user_id,
            username,
            full_name,
            bio,
            avatar_url,
            location,
            city,
            created_at,
            updated_at,
            vibe_score,
            is_online,
            last_active
          )
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      setComments(prev => ({
        ...prev,
        [postId]: data.map((comment: any) => ({
          id: comment.id,
          chat_id: comment.chat_id || postId,
          sender_id: comment.sender_id,
          content: comment.content,
          created_at: comment.created_at,
          profiles: createSafeProfile(comment.profiles)
        } as Comment))
      }));
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !selectedPost || !user) return;

    try {
      const sanitizedComment = sanitizeHtml(newComment.trim(), {
        allowedTags: [],
        allowedAttributes: {}
      });

      const chatId = `post_${selectedPost}`;

      // Insert comment
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          chat_id: chatId,
          sender_id: user.id,
          content: sanitizedComment
        }])
        .select(`
          id,
          chat_id,
          sender_id,
          content,
          created_at
        `)
        .single();

      if (error) throw error;

      const newCommentWithProfile: Comment = {
        ...data,
        profiles: createSafeProfile(profile)
      };

      setComments(prev => ({
        ...prev,
        [selectedPost]: [...(prev[selectedPost] || []), newCommentWithProfile]
      }));

      // Update responses count
      setPosts(posts.map(p => 
        p.id === selectedPost 
          ? { ...p, responses_count: p.responses_count + 1 }
          : p
      ));

      setNewComment('');
      setShowCommentModal(false);

    } catch (error: any) {
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

      if (error) throw error;

      setPosts(posts.filter(p => p.id !== postId));
    } catch (error: any) {
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

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
        >
          Retry
        </button>
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
                  selectedMood === mood 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
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