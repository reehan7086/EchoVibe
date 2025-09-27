import React from "react";
import { VibeEcho, Profile } from "../../types";

interface FeedCardProps {
  post: VibeEcho;
  onLike: (postId: string) => Promise<void>;
  onComment: (postId: string) => void;
  onDelete?: (postId: string) => Promise<void>;
  currentUserId: string;
}

const FeedCard: React.FC<FeedCardProps> = ({ post, onLike, onComment, onDelete, currentUserId }) => {
  const profile: Profile | undefined = post.profiles;

  return (
    <div className="p-4 border rounded-lg shadow-sm mb-4">
      <div className="flex items-center gap-2 mb-2">
        <img
          src={profile?.avatar_url || "/default-avatar.png"}
          alt="avatar"
          className="w-8 h-8 rounded-full"
        />
        <span className="font-semibold">{profile?.username || "Unknown User"}</span>
      </div>
      <p className="mb-2">{post.content}</p>
      {post.media_url && (
        <div className="mb-2">
          {post.media_type === "video" ? (
            <video src={post.media_url} controls className="w-full rounded" />
          ) : (
            <img src={post.media_url} alt="media" className="w-full rounded" />
          )}
        </div>
      )}
      <div className="flex items-center gap-4">
        <button onClick={() => onLike(post.id)}>
          {post.user_has_liked ? "❤️ Liked" : "🤍 Like"} ({post.likes_count || 0})
        </button>
        <button onClick={() => onComment(post.id)}>💬 Comment ({post.responses_count || 0})</button>
        {onDelete && currentUserId === post.user_id && (
          <button onClick={() => onDelete(post.id)}>🗑️ Delete</button>
        )}
      </div>
    </div>
  );
};

export default FeedCard;
