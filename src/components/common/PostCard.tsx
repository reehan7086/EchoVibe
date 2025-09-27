import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import InfiniteScroll from 'react-infinite-scroll-component';

const supabaseUrl = 'https://rtrwrjzatvdyclntelca.supabase.co';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
}

interface Like {
  id: string;
  user_id: string;
}

interface VibeEcho {
  id: string;
  content: string;
  media_url?: string;
  media_type?: string;
  mood: string;
  profile: Profile;
  comments: Comment[];
  likes: Like[];
  created_at: string;
}

const FeedPage: React.FC = () => {
  const [feed, setFeed] = useState<VibeEcho[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 10;

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vibe_echoes')
        .select(`
          *,
          profiles!inner(id, username, full_name, avatar_url),
          comments(id, content, user_id),
          likes(id, user_id)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(page * limit, page * limit + limit - 1);

      if (error) {
        console.error('Error fetching feed:', error);
      } else if (data) {
        setFeed(prev => [...prev, ...data]);
        setPage(prev => prev + 1);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
    setLoading(false);
  };

  const handleLike = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('likes')
        .insert([{ post_id: postId, user_id: 'CURRENT_USER_ID' }]);

      if (error) console.error('Error liking post:', error);
      else setFeed(prev => prev.map(post => post.id === postId ? { ...post, likes: [...post.likes, { id: Date.now().toString(), user_id: 'CURRENT_USER_ID' }] } : post));
    } catch (err) {
      console.error('Unexpected like error:', err);
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{ post_id: postId, content, user_id: 'CURRENT_USER_ID' }])
        .select();

      if (error) console.error('Error adding comment:', error);
      else if (data?.length) {
        setFeed(prev => prev.map(post => post.id === postId ? { ...post, comments: [...post.comments, data[0]] } : post));
      }
    } catch (err) {
      console.error('Unexpected comment error:', err);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  return (
    <div className="max-w-md mx-auto p-4">
      <InfiniteScroll
        dataLength={feed.length}
        next={fetchFeed}
        hasMore={true}
        loader={<p className="text-center">Loading more posts...</p>}
      >
        {feed.map(post => (
          <div key={post.id} className="bg-white shadow rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <img
                src={post.profile.avatar_url || '/default-avatar.png'}
                alt={post.profile.username}
                className="w-10 h-10 rounded-full mr-2"
              />
              <div>
                <p className="font-semibold">{post.profile.full_name}</p>
                <p className="text-sm text-gray-500">{post.mood}</p>
              </div>
            </div>

            <p className="mb-2">{post.content}</p>

            {post.media_url && (
              post.media_type === 'image' ? (
                <img src={post.media_url} alt="media" className="w-full rounded mb-2" />
              ) : (
                <video src={post.media_url} controls className="w-full rounded mb-2" />
              )
            )}

            <div className="flex items-center space-x-4 mt-2">
              <button
                className="text-blue-500 font-semibold"
                onClick={() => handleLike(post.id)}
              >
                Like ({post.likes.length})
              </button>
              <button className="text-green-500 font-semibold">
                Comment ({post.comments.length})
              </button>
            </div>

            <div className="mt-2">
              {post.comments.map(comment => (
                <p key={comment.id} className="text-sm text-gray-700">
                  <span className="font-semibold">{comment.user_id}</span>: {comment.content}
                </p>
              ))}
            </div>
          </div>
        ))}
      </InfiniteScroll>
      {loading && <p className="text-center mt-4">Loading...</p>}
    </div>
  );
};

export default FeedPage;
