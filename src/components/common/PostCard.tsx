// src/components/common/PostCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2 } from 'lucide-react';
import { VibeEcho, User } from '../../types';
import { formatDate } from '../../utils';

interface PostCardProps {
  post: VibeEcho & { 
    profiles?: { 
      full_name?: string; 
      username?: string; 
      avatar_url?: string; 
    }; 
    user_has_liked?: boolean; 
  };
  currentUser: User;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  currentUser, 
  onLike, 
  onComment, 
  onShare, 
  onDelete 
}) => {
  const handleLike = () => {
    if (onLike) onLike(post.id);
  };

  const handleComment = () => {
    if (onComment) onComment(post.id);
  };

  const handleShare = () => {
    if (onShare) onShare(post.id);
  };

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this post?')) {
      onDelete(post.id);
    }
  };

  const isOwnPost = post.user_id === currentUser?.id;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:bg-white/[0.08] transition-all"
    >
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
            {post.profiles?.avatar_url ? (
              <img
                src={post.profiles.avatar_url}
                alt={post.profiles?.full_name || 'User'}
                className="w-full h-full rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              post.profiles?.full_name?.[0]?.toUpperCase() || 
              post.profiles?.username?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {post.profiles?.full_name || post.profiles?.username || 'Anonymous'}
            </h3>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <span>{formatDate(post.created_at)}</span>
              {post.mood && (
                <>
                  <span>•</span>
                  <span className="capitalize">feeling {post.mood}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {isOwnPost && (
          <div className="relative">
            <button
              onClick={handleDelete}
              className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              aria-label="Delete post"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-white leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
        
        {/* Media Content */}
        {post.media_url && (
          <div className="mt-4 rounded-xl overflow-hidden">
            {post.media_type === 'image' ? (
              <img
                src={post.media_url}
                alt="Post media"
                className="w-full max-h-96 object-cover"
                loading="lazy"
              />
            ) : post.media_type === 'video' ? (
              <video
                src={post.media_url}
                controls
                className="w-full max-h-96"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            ) : null}
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center gap-1 pt-3 border-t border-white/10">
        <button
          onClick={handleLike}
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
          onClick={handleComment}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-white/60 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
          aria-label="Comment on post"
        >
          <MessageCircle size={18} />
          <span className="text-sm">Comment</span>
        </button>
        
        <button
          onClick={handleShare}
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