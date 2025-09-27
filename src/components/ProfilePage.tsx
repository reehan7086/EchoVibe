// src/components/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  User,
  Settings,
  MapPin,
  Shield,
  Star,
  MessageCircle,
  UserPlus,
  Edit3,
  Camera,
  ArrowLeft,
  Mail,
  Calendar,
  Heart,
  Users,
  Zap
} from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url: string;
  location: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  mood: string;
  mood_message: string;
  created_at: string;
  is_verified: boolean;
  reputation_score: number;
  connection_count: number;
  vibe_score: number;
}

const ProfilePage: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '',
    bio: '',
    mood_message: '',
    location: ''
  });

  useEffect(() => {
    const initProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        
        if (!userId || userId === user?.id) {
          setIsOwnProfile(true);
          if (user?.id) {
            await loadOwnProfile(user.id);
          }
        } else {
          await loadUserProfile(userId);
        }
      } catch (error) {
        console.error('Profile init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initProfile();
  }, [userId]);

  const loadOwnProfile = async (currentUserId: string) => {
    // Mock data for current user - replace with Supabase query
    const mockProfile: UserProfile = {
      id: '1',
      user_id: currentUserId,
      full_name: currentUser?.user_metadata?.full_name || 'Your Name',
      username: currentUser?.email?.split('@')[0] || 'username',
      bio: 'Living my best vibe life! Love exploring new places and meeting amazing people.',
      avatar_url: currentUser?.user_metadata?.avatar_url || '',
      location: 'Dubai, UAE',
      age: 25,
      gender: 'other',
      mood: 'happy',
      mood_message: 'Feeling great and ready to connect!',
      created_at: new Date().toISOString(),
      is_verified: true,
      reputation_score: 95,
      connection_count: 156,
      vibe_score: 8.7
    };
    
    setProfile(mockProfile);
    setEditData({
      full_name: mockProfile.full_name,
      bio: mockProfile.bio,
      mood_message: mockProfile.mood_message,
      location: mockProfile.location
    });
  };

  const loadUserProfile = async (targetUserId: string) => {
    // Mock data for other user - replace with Supabase query
    const mockProfile: UserProfile = {
      id: '2',
      user_id: targetUserId,
      full_name: 'Sarah Ahmed',
      username: 'sarah_sparkle',
      bio: 'Adventure seeker and coffee lover ☕ Always up for discovering new vibes!',
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150',
      location: 'Dubai, UAE',
      age: 28,
      gender: 'female',
      mood: 'adventurous',
      mood_message: 'Ready for new adventures!',
      created_at: '2024-01-15T00:00:00Z',
      is_verified: true,
      reputation_score: 92,
      connection_count: 234,
      vibe_score: 9.1
    };
    
    setProfile(mockProfile);
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    
    try {
      // Update profile logic here
      setProfile({
        ...profile,
        ...editData
      });
      setShowEditModal(false);
    } catch (error) {
      console.error('Update profile error:', error);
    }
  };

  const handleSendMessage = () => {
    navigate(`/chat?user=${profile?.user_id}`);
  };

  const handleConnect = async () => {
    try {
      // Send connection request logic here
      alert('Connection request sent!');
    } catch (error) {
      console.error('Connect error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Profile Not Found</h2>
          <Link to="/dashboard" className="text-purple-400 hover:text-purple-300">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          
          <h1 className="text-xl font-bold text-white">
            {isOwnProfile ? 'Your Profile' : `${profile.full_name}'s Profile`}
          </h1>
          
          {isOwnProfile && (
            <Link
              to="/settings"
              className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"
            >
              <Settings className="w-5 h-5 text-white" />
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Profile Header */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-purple-400 overflow-hidden">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-4xl font-bold text-white ${
                    profile.gender === 'female' ? 'bg-pink-500' : 
                    profile.gender === 'male' ? 'bg-blue-500' : 'bg-purple-500'
                  }`}>
                    {profile.full_name.charAt(0)}
                  </div>
                )}
              </div>
              {profile.is_verified && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              )}
              {isOwnProfile && (
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center border-2 border-white">
                  <Camera className="w-4 h-4 text-white" />
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <h2 className="text-2xl font-bold text-white">{profile.full_name}</h2>
                {profile.is_verified && (
                  <Shield className="w-5 h-5 text-blue-400" />
                )}
              </div>
              <p className="text-white/70 mb-1">@{profile.username}</p>
              <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-white/60 mb-4">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Mood Message */}
              <div className="bg-purple-500/20 rounded-lg p-3 mb-4">
                <p className="text-purple-300 font-medium">{profile.mood_message}</p>
              </div>

              {/* Bio */}
              <p className="text-white/80 mb-4">{profile.bio}</p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {isOwnProfile ? (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSendMessage}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </button>
                    <button
                      onClick={handleConnect}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
                      Connect
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">{profile.vibe_score}/10</div>
            <div className="text-white/70 text-sm">Vibe Score</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">{profile.connection_count}</div>
            <div className="text-white/70 text-sm">Connections</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">{profile.reputation_score}%</div>
            <div className="text-white/70 text-sm">Reputation</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4 text-center">
            <div className="text-2xl font-bold text-pink-400 mb-1">42</div>
            <div className="text-white/70 text-sm">Posts</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Explored the Vibe Map</p>
                <p className="text-white/60 text-sm">Connected with 3 new users nearby</p>
              </div>
              <span className="text-white/40 text-sm">2h ago</span>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Reputation increased</p>
                <p className="text-white/60 text-sm">Great feedback from recent connections</p>
              </div>
              <span className="text-white/40 text-sm">1d ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Edit Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={editData.full_name}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Bio</label>
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Mood Message</label>
                <input
                  type="text"
                  value={editData.mood_message}
                  onChange={(e) => setEditData({ ...editData, mood_message: e.target.value })}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  value={editData.location}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;