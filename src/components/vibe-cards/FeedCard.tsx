// src/components/vibe-cards/FeedCard.tsx
import React, { useState, useEffect } from "react";
import { VibeEcho } from "../../types";

interface FeedCardProps {
  post: VibeEcho;
  onLike: (postId: string, like: boolean) => Promise<void>; // pass current like status
  onComment: (postId: string) => void;
  onDelete?: (postId: string) => Promise<void>;
  currentUserId: string;
}

const FeedCard: React.FC<FeedCardProps> = ({
  post,
  onLike,
  onComment,
  onDelete,
  currentUserId,
}) => {
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [userLiked, setUserLiked] = useState(post.user_has_liked || false);

  useEffect(() => {
    setLikesCount(post.likes_count || 0);
    setUserLiked(post.user_has_liked || false);
  }, [post.likes_count, post.user_has_liked]);

  const handleLikeClick = async () => {
    // toggle UI immediately
    const newLiked = !userLiked;
    setUserLiked(newLiked);
    setLikesCount((prev) => (newLiked ? prev + 1 : prev - 1));

    // call parent handler to persist in DB
    try {
      await onLike(post.id, newLiked);
    } catch (err) {
      console.error("Error updating like:", err);
      // revert if error occurs
      setUserLiked(!newLiked);
      setLikesCount((prev) => (newLiked ? prev - 1 : prev + 1));
    }
  };

  const handleCommentClick = () => onComment(post.id);

  const handleDeleteClick = async () => {
    if (onDelete) await onDelete(post.id);
  };

  const isOwner = post.user_id === currentUserId;

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      {/* User info */}
      <div className="flex items-center mb-2">
        <img
          src={post.profiles?.avatar_url || "/default-avatar.png"}
          alt={post.profiles?.username || "User"}
          className="w-10 h-10 rounded-full mr-2"
        />
        <div>
          <p className="font-semibold">
            {post.profiles?.full_name || post.profiles?.username || "Unknown"}
          </p>
          <p className="text-sm text-gray-500">{post.city || post.profiles?.city}</p>
        </div>
      </div>

      {/* Post content */}
      <p className="mb-2">{post.content}</p>

      {/* Media */}
      {post.media_url && post.media_type === "image" && (
        <img src={post.media_url} alt="post media" className="rounded mb-2 max-h-96 w-full object-cover" />
      )}
      {post.media_url && post.media_type === "video" && (
        <video controls className="rounded mb-2 max-h-96 w-full">
          <source src={post.media_url} type="video/mp4" />
        </video>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <button
          onClick={handleLikeClick}
          className={userLiked ? "text-red-500 font-semibold" : ""}
        >
          ❤️ {likesCount}
        </button>
        <button onClick={handleCommentClick}>
          💬 {post.responses_count || 0}
        </button>
        {isOwner && onDelete && (
          <button onClick={handleDeleteClick} className="text-red-500">
            🗑️ Delete
          </button>
        )}
      </div>

      {/* Mood / activity */}
      <div className="mt-2 text-xs text-gray-400">
        {post.mood && <span>Mood: {post.mood}</span>}
        {post.activity && <span> • Activity: {post.activity}</span>}
      </div>
    </div>
  );
};

export default FeedCard;
