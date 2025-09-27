import React, { useEffect, useState } from "react";
import FeedCard from "../vibe-cards/FeedCard";
import { VibeEcho, Profile } from "../types";
import { supabase } from "../../supabaseClient";

interface FeedPageProps {
  currentUserId: string;
}

const FeedPage: React.FC<FeedPageProps> = ({ currentUserId }) => {
  const [feed, setFeed] = useState<VibeEcho[]>([]);

  const fetchFeed = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select(`*, profiles(*)`)
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    else setFeed(data as VibeEcho[]);
  };

  const handleLike = async (postId: string) => {
    console.log("Liked post", postId);
    // implement like functionality here
  };

  const handleComment = (postId: string) => {
    console.log("Comment on post", postId);
    // implement comment functionality here
  };

  const handleDelete = async (postId: string) => {
    console.log("Delete post", postId);
    // implement delete functionality here
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-4">
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
