import React, { useEffect, useState } from "react";
import FeedCard from "../vibe-cards/FeedCard";
import { VibeEcho } from "../../types";
import { supabase } from "../../lib/supabase";

interface FeedPageProps {
  currentUserId: string;
}

const FeedPage: React.FC<FeedPageProps> = ({ currentUserId }) => {
  const [feed, setFeed] = useState<VibeEcho[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`*, profiles(*)`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase fetch error:", error);
        setError(error.message);
      } else {
        setFeed(data as VibeEcho[]);
      }
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    console.log("Liked post", postId);
    // TODO: implement like functionality
  };

  const handleComment = (postId: string) => {
    console.log("Comment on post", postId);
    // TODO: implement comment functionality
  };

  const handleDelete = async (postId: string) => {
    console.log("Delete post", postId);
    // TODO: implement delete functionality
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-gray-500">Loading feed...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center mt-4">
        Error loading feed: {error}
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <div className="text-gray-500 text-center mt-4">
        No posts available.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-4 space-y-4">
      {feed.map((post) => (
        <FeedCard
          key={post.id}
          post={post}
          onLike={handleLike}
          onComment={handleComment}
          onDelete={handleDelete}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
};

export default FeedPage;
