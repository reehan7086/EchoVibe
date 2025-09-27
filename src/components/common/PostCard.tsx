import React from 'react';
import { User } from '@supabase/supabase-js';
import { VibeEcho, Profile } from '../../types';
import { formatDate } from '../../utils';
import { Heart, Trash } from 'lucide-react';

interface PostCardProps {
  post: VibeEcho & { profiles?: Profile; user_has_liked?: boolean };
  currentUser: User;
  onLike?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUser, onLike, onDelete }) => {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 flex flex-col gap-3">
      
      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm flex-shrink-0 overflow-hidden">
          {post.profiles?.avatar_url ? (
            <img src={post.profiles.avatar_url} alt={post.profiles.full_name} className="w-full h-full object-cover rounded-full"/>
          ) : (
            post.profiles?.full_name?.[0]?.toUpperCase() || 'U'
          )}
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold">{post.profiles?.full_name || post.user_id}</p>
          <p className="text-white/60 text-sm">{formatDate(post.created_at)}</p>
        </div>
        {onDelete && (
          <button onClick={() => onDelete(post.id)} className="p-1 rounded-full hover:bg-white/10">
            <Trash size={16} className="text-red-400" />
          </button>
        )}
      </div>

      {/* Post Content */}
      <div className="text-white whitespace-pre-wrap">{post.content}</div>

      {/* Media */}
      {post.media_url && (
        post.media_type === 'video' ? (
          <video src={post.media_url} controls className="rounded-lg w-full max-h-60 object-cover" />
        ) : (
          <img src={post.media_url} alt="post media" className="rounded-lg w-full max-h-60 object-cover" />
        )
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mt-2">
        {onLike && (
          <button
            onClick={() => onLike(post.id)}
            className={`flex items-center gap-1 text-sm ${
              post.user_has_liked ? 'text-red-400' : 'text-white/70 hover:text-white'
            }`}
          >
            <Heart size={16} />
            {post.likes_count || 0}
          </button>
        )}
      </div>
    </div>
  );
};

export default PostCard;
