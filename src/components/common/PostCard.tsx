// src/components/common/PostCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { VibeEcho, User } from '../../types';
import { formatDate } from '../../utils';

interface PostCardProps {
  post: VibeEcho & { 
    profiles?: { 
      full_name?: string; 
      username?: string; 
      avatar_url?: string; 
      is_online?: boolean;
    }; 
    user_has_liked?: boolean; 
  };
  currentUser: User;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  currentUser, 
  onLike, 
  onComment, 
  onDelete 
}) => {
  const handleLike = () => onLike?.(post.id);
  const handleComment = () => onComment?.(post.id);
  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this post?')) {
      onDelete(post.id);
    }
  };

  const isOwnPost = post.user_id === currentUser?.id;
  const profile = post.profiles;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:bg-white/[0.08] transition-all relative"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar + online dot */}
          <div className="relative w-12 h-12 flex-shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'User'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gray-600 flex items-center justify-center text-lg font-bold text-white">
                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            {profile?.is_online && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border border-gray-900 rounded-full"></span>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-white">
              {profile?.full_name || profile?.username || 'Anonymous'}
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

        {/* Delete */}
        {isOwnPost && (
          <button
            onClick={handleDelete}
            className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-white leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/10">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
            post.user_has_liked
              ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
              : 'text-white/60 hover:text-red-400 hover:bg-red-500/10'
          }`}
        >
          <Heart size={18} fill={post.user_has_liked ? 'currentColor' : 'none'} />
          <span className="text-sm">{post.user_has_liked ? 'Liked' : 'Like'}</span>
        </button>

        <button
          onClick={handleComment}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-white/60 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
        >
          <MessageCircle size={18} />
          <span className="text-sm">Comment</span>
        </button>
      </div>
    </motion.article>
  );
};

export default PostCard;
