import React from 'react';
import { User } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { VibeEcho } from '../../types';
import { formatDate } from '../../utils';

interface PostCardProps {
  post: VibeEcho;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onDelete?: (postId: string) => void;
  currentUser: User | null;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onLike, 
  onComment, 
  onShare, 
  onDelete, 
  currentUser 
}) => {
  return (
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
            <h3 className="font-semibold text-white">{post.profiles?.full_name || 'Unknown User'}</h3>
            <p className="text-sm text-white/60">
              @{post.profiles?.username || 'unknown'} • {formatDate(post.created_at)}
            </p>
          </div>
        </div>
        {post.user_id === currentUser?.id && onDelete && (
          <button
            onClick={() => onDelete(post.id)}
            className="p-2 rounded-full hover:bg-white/10 transition-all text-white/60 hover:text-white"
            aria-label={`Delete post by ${post.profiles?.full_name || 'Unknown User'}`}
          >
            <MoreHorizontal size={18} />
          </button>
        )}
      </div>

      <p className="mb-3 text-base leading-relaxed text-white">{post.content}</p>

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
          Your browser does not support the video tag.
        </video>
      )}

      {post.mood && (
        <div className="inline-block px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm mb-4">
          Mood: {post.mood}
        </div>
      )}

      <div className="text-sm text-white/60 mb-3">
        {post.likes_count || 0} likes • {post.responses_count || 0} responses
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
};

export default PostCard;