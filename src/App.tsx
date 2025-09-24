import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Send, Image, Video, Smile, TrendingUp, Users, Settings, Home, Search, Bell, Menu, X, ChevronDown, Bookmark, Hash, MoreHorizontal, User, LogOut, HelpCircle, Shield } from 'lucide-react';

interface Post {
  id: number;
  author: string;
  avatar: string;
  time: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
  image?: boolean;
}

interface Comment {
  text: string;
  author: string;
  time: string;
}

interface TrendingTopic {
  tag: string;
  posts: string;
}

interface SuggestedFriend {
  id: number;
  name: string;
  role: string;
  avatar: string;
  mutualFriends: number;
}

interface Notification {
  id: number;
  type: 'like' | 'comment' | 'follow';
  user: string;
  action: string;
  time: string;
}

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      author: 'Alex Johnson',
      avatar: 'AJ',
      time: '2 hours ago',
      content: 'Just launched our new feature! Excited to see how the community responds. What do you think about real-time collaboration tools? 🚀',
      likes: 245,
      comments: 42,
      shares: 18,
      liked: false
    },
    {
      id: 2,
      author: 'Sarah Chen',
      avatar: 'SC',
      time: '5 hours ago',
      content: 'Beautiful sunrise this morning! Sometimes we need to pause and appreciate the simple things in life. 🌅',
      likes: 189,
      comments: 23,
      shares: 12,
      liked: false,
      image: true
    },
    {
      id: 3,
      author: 'David Kim',
      avatar: 'DK',
      time: '8 hours ago',
      content: 'Working on something exciting! AI-powered tools are revolutionizing how we approach problem-solving. The future is here! 💡',
      likes: 412,
      comments: 67,
      shares: 34,
      liked: false
    },
    {
      id: 4,
      author: 'Emily Rodriguez',
      avatar: 'ER',
      time: '1 day ago',
      content: 'Just completed my first marathon! 26.2 miles of pure determination. Never thought I could do it, but here we are! 🏃‍♀️🏅',
      likes: 892,
      comments: 124,
      shares: 45,
      liked: true,
      image: true
    }
  ]);

  const [newPost, setNewPost] = useState<string>('');
  const [notifications, setNotifications] = useState<number>(3);
  const [showCommentModal, setShowCommentModal] = useState<boolean>(false);
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  const [newComment, setNewComment] = useState<string>('');
  const [comments, setComments] = useState<{ [key: number]: Comment[] }>({});
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('feed');
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [followStatus, setFollowStatus] = useState<{ [key: number]: boolean }>({});

  const trendingTopics: TrendingTopic[] = [
    { tag: '#WebDevelopment', posts: '12.5k' },
    { tag: '#ReactJS', posts: '8.3k' },
    { tag: '#Innovation', posts: '6.7k' },
    { tag: '#TechNews', posts: '5.2k' },
    { tag: '#AI', posts: '15.2k' },
    { tag: '#StartupLife', posts: '9.8k' }
  ];

  const suggestedFriends: SuggestedFriend[] = [
    { id: 1, name: 'Michael Zhang', role: 'Data Scientist', avatar: 'MZ', mutualFriends: 12 },
    { id: 2, name: 'Lisa Wang', role: 'Product Manager', avatar: 'LW', mutualFriends: 8 },
    { id: 3, name: 'James Wilson', role: 'DevOps Engineer', avatar: 'JW', mutualFriends: 15 }
  ];

  const notificationsList: Notification[] = [
    { id: 1, type: 'like', user: 'Alex Johnson', action: 'liked your post', time: '5m ago' },
    { id: 2, type: 'comment', user: 'Sarah Chen', action: 'commented on your post', time: '1h ago' },
    { id: 3, type: 'follow', user: 'David Kim', action: 'started following you', time: '2h ago' }
  ];

  useEffect(() => {
    const savedPosts = localStorage.getItem('echovibe-posts');
    if (savedPosts) {
      setPosts(JSON.parse(savedPosts));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('echovibe-posts', JSON.stringify(posts));
  }, [posts]);

  const handlePost = () => {
    if (newPost.trim()) {
      const post: Post = {
        id: Date.now(),
        author: 'You',
        avatar: 'U',
        time: 'Just now',
        content: newPost,
        likes: 0,
        comments: 0,
        shares: 0,
        liked: false
      };
      setPosts([post, ...posts]);
      setNewPost('');
    }
  };

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handleComment = (postId: number) => {
    setSelectedPost(postId);
    setShowCommentModal(true);
  };

  const submitComment = () => {
    if (newComment.trim() && selectedPost) {
      const newCommentObj: Comment = {
        text: newComment,
        author: 'You',
        time: 'Just now'
      };
      
      setComments({
        ...comments,
        [selectedPost]: [...(comments[selectedPost] || []), newCommentObj]
      });
      
      setPosts(posts.map(post => 
        post.id === selectedPost 
          ? { ...post, comments: post.comments + 1 }
          : post
      ));
      
      setNewComment('');
      setShowCommentModal(false);
    }
  };

  const handleShare = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, shares: post.shares + 1 }
        : post
    ));
    
    const message = document.createElement('div');
    message.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse';
    message.textContent = 'Post shared successfully!';
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 3000);
  };

  const handleFollow = (friendId: number) => {
    setFollowStatus({
      ...followStatus,
      [friendId]: !followStatus[friendId]
    });
  };

  const clearNotifications = () => {
    setNotifications(0);
    setShowNotifications(false);
  };

  const handleDeletePost = (postId: number) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setPosts(posts.filter(post => post.id !== postId));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-800/95 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-700 transition-colors"
              >
                {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent cursor-pointer">
                EchoVibe
              </h1>
              
              <div className="hidden md:flex items-center bg-slate-700 rounded-lg px-3 py-2 w-64">
                <Search size={18} className="text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none text-sm flex-1 placeholder-gray-400"
                />
              </div>
            </div>

            <nav className="hidden lg:flex items-center space-x-8">
              <button className="hover:text-indigo-400 transition-colors flex items-center space-x-1">
                <Home size={18} />
                <span>Home</span>
              </button>
              <button className="hover:text-indigo-400 transition-colors flex items-center space-x-1">
                <Hash size={18} />
                <span>Explore</span>
              </button>
              <button className="hover:text-indigo-400 transition-colors flex items-center space-x-1">
                <MessageCircle size={18} />
                <span>Messages</span>
              </button>
              <button className="hover:text-indigo-400 transition-colors flex items-center space-x-1">
                <Bookmark size={18} />
                <span>Bookmarks</span>
              </button>
            </nav>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Bell size={20} />
                  {notifications > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                      <h3 className="font-semibold">Notifications</h3>
                      <button 
                        onClick={clearNotifications}
                        className="text-sm text-indigo-400 hover:underline"
                      >
                        Mark all as read
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notificationsList.map(notif => (
                        <div key={notif.id} className="p-4 hover:bg-slate-700 transition-colors cursor-pointer border-b border-slate-700/50">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-xs">
                              {notif.type === 'like' ? '❤️' : notif.type === 'comment' ? '💬' : '👤'}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="font-semibold">{notif.user}</span> {notif.action}
                              </p>
                              <span className="text-xs text-gray-400">{notif.time}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                >
                  U
                </button>
                
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-700">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                          U
                        </div>
                        <div>
                          <p className="font-semibold">Your Name</p>
                          <p className="text-sm text-gray-400">@username</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <User size={18} />
                        <span>Profile</span>
                      </button>
                      <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <Settings size={18} />
                        <span>Settings</span>
                      </button>
                      <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <Shield size={18} />
                        <span>Privacy</span>
                      </button>
                      <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <HelpCircle size={18} />
                        <span>Help</span>
                      </button>
                      <div className="border-t border-slate-700 mt-2 pt-2">
                        <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors text-red-400">
                          <LogOut size={18} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {showMobileMenu && (
        <div className="lg:hidden fixed inset-x-0 top-16 bg-slate-800/95 backdrop-blur-md z-40 border-b border-slate-700">
          <nav className="flex flex-col p-4 space-y-2">
            <button className="text-left py-2 px-4 hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-2">
              <Home size={18} />
              <span>Home</span>
            </button>
            <button className="text-left py-2 px-4 hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-2">
              <Hash size={18} />
              <span>Explore</span>
            </button>
            <button className="text-left py-2 px-4 hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-2">
              <MessageCircle size={18} />
              <span>Messages</span>
            </button>
            <button className="text-left py-2 px-4 hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-2">
              <Bookmark size={18} />
              <span>Bookmarks</span>
            </button>
          </nav>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="hidden lg:block lg:col-span-3">
            <div className="bg-slate-800 rounded-xl p-6 sticky top-24">
              <nav className="space-y-2">
                <button 
                  onClick={() => setActiveTab('feed')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === 'feed' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700'
                  }`}
                >
                  <Home size={20} />
                  <span>Feed</span>
                </button>
                <button 
                  onClick={() => setActiveTab('discover')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === 'discover' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700'
                  }`}
                >
                  <Search size={20} />
                  <span>Discover</span>
                </button>
                <button 
                  onClick={() => setActiveTab('friends')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === 'friends' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700'
                  }`}
                >
                  <Users size={20} />
                  <span>Friends</span>
                </button>
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === 'analytics' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700'
                  }`}
                >
                  <TrendingUp size={20} />
                  <span>Analytics</span>
                </button>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700'
                  }`}
                >
                  <Settings size={20} />
                  <span>Settings</span>
                </button>
              </nav>

              <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
                <h4 className="font-semibold mb-3 text-sm">Your Stats</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Posts</span>
                    <span className="font-medium">47</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Followers</span>
                    <span className="font-medium">2.3k</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Following</span>
                    <span className="font-medium">849</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-6">
            <div className="bg-slate-800 rounded-xl p-6 mb-6">
              <div className="flex space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  U
                </div>
                <div className="flex-1">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full bg-slate-700 rounded-lg p-3 text-gray-100 placeholder-gray-400 border border-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                    rows={3}
                  />
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex space-x-2">
                      <button className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                        <Image size={18} />
                        <span className="hidden sm:inline">Photo</span>
                      </button>
                      <button className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                        <Video size={18} />
                        <span className="hidden sm:inline">Video</span>
                      </button>
                      <button className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                        <Smile size={18} />
                        <span className="hidden sm:inline">Feeling</span>
                      </button>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-400">{280 - newPost.length} characters</span>
                      <button
                        onClick={handlePost}
                        disabled={!newPost.trim() || newPost.length > 280}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {posts.map(post => (
                <article key={post.id} className="bg-slate-800 rounded-xl p-6 hover:bg-slate-800/80 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        post.author === 'Sarah Chen' 
                          ? 'bg-gradient-to-br from-pink-500 to-red-500'
                          : post.author === 'David Kim'
                          ? 'bg-gradient-to-br from-green-500 to-teal-500'
                          : post.author === 'Emily Rodriguez'
                          ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                          : post.author === 'You'
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                          : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                      }`}>
                        {post.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold hover:text-indigo-400 cursor-pointer">{post.author}</h3>
                        <span className="text-sm text-gray-400">{post.time}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => post.author === 'You' && handleDeletePost(post.id)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </div>

                  <p className="mb-4 leading-relaxed">{post.content}</p>

                  {post.image && (
                    <div className="mb-4 h-64 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-lg animate-pulse"></div>
                  )}

                  <div className="flex items-center space-x-6 text-sm text-gray-400 pb-3 mb-3 border-b border-slate-700">
                    <span className="hover:text-indigo-400 cursor-pointer">{post.likes} likes</span>
                    <span className="hover:text-indigo-400 cursor-pointer">{post.comments} comments</span>
                    <span className="hover:text-indigo-400 cursor-pointer">{post.shares} shares</span>
                  </div>

                  <div className="flex justify-around">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all hover:scale-105 ${
                        post.liked 
                          ? 'text-red-500 hover:bg-red-500/10' 
                          : 'text-gray-400 hover:bg-slate-700 hover:text-gray-200'
                      }`}
                    >
                      <Heart size={18} fill={post.liked ? 'currentColor' : 'none'} />
                      <span>Like</span>
                    </button>
                    <button
                      onClick={() => handleComment(post.id)}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:bg-slate-700 hover:text-gray-200 rounded-lg transition-all hover:scale-105"
                    >
                      <MessageCircle size={18} />
                      <span>Comment</span>
                    </button>
                    <button
                      onClick={() => handleShare(post.id)}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:bg-slate-700 hover:text-gray-200 rounded-lg transition-all hover:scale-105"
                    >
                      <Share2 size={18} />
                      <span>Share</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                Load more posts
              </button>
            </div>
          </main>

          <aside className="hidden lg:block lg:col-span-3">
            <div className="bg-slate-800 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center space-x-2">
                <TrendingUp size={20} />
                <span>Trending Topics</span>
              </h3>
              <div className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer transition-all hover:translate-x-1"
                  >
                    <h4 className="font-medium text-indigo-400">{topic.tag}</h4>
                    <span className="text-sm text-gray-400">{topic.posts} posts</span>
                  </div>
                ))}
              </div>
              <button className="mt-4 text-indigo-400 text-sm hover:underline">
                Show more
              </button>
            </div>

            <div className="bg-slate-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center space-x-2">
                <Users size={20} />
                <span>Suggested Friends</span>
              </h3>
              <div className="space-y-4">
                {suggestedFriends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-sm">
                        {friend.avatar}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm hover:text-indigo-400 cursor-pointer">{friend.name}</h4>
                        <span className="text-xs text-gray-400">{friend.role}</span>
                        <p className="text-xs text-gray-500">{friend.mutualFriends} mutual friends</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleFollow(friend.id)}
                      className={`px-3 py-1 text-sm rounded-lg transition-all ${
                        followStatus[friend.id]
                          ? 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                          : 'bg-indigo-600 text-white hover:bg-indigo-500'
                      }`}
                    >
                      {followStatus[friend.id] ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showCommentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Add Comment</h3>
              <button 
                onClick={() => setShowCommentModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your comment..."
              className="w-full bg-slate-700 rounded-lg p-3 text-gray-100 placeholder-gray-400 border border-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              rows={4}
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={submitComment}
                disabled={!newComment.trim()}
                className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                Post Comment
              </button>
            </div>
            {selectedPost && comments[selectedPost]?.length > 0 && (
              <div className="mt-4 max-h-48 overflow-y-auto">
                {comments[selectedPost].map((comment, index) => (
                  <div key={index} className="p-3 bg-slate-700/50 rounded-lg mb-2">
                    <p className="text-sm font-semibold">{comment.author}</p>
                    <p className="text-sm">{comment.text}</p>
                    <span className="text-xs text-gray-400">{comment.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;