// src/pages/ProfilePage.tsx
import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

interface ProfilePageProps {
  user: User;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  mood?: string;
  city?: string;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (error) console.error(error);
    else setProfile(data);
    setLoading(false);
  };

  const updateProfile = async () => {
    if (!profile) return;
    setUpdating(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        username: profile.username,
        avatar_url: profile.avatar_url,
        mood: profile.mood,
      })
      .eq('user_id', user.id);
    if (error) console.error(error);
    else alert('Profile updated successfully!');
    setUpdating(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex justify-center">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-white text-2xl font-bold mb-4">Your Profile</h2>
        <div className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="p-2 rounded-lg w-full"
            value={profile?.full_name || ''}
            onChange={(e) => setProfile({ ...profile!, full_name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Username"
            className="p-2 rounded-lg w-full"
            value={profile?.username || ''}
            onChange={(e) => setProfile({ ...profile!, username: e.target.value })}
          />
          <input
            type="text"
            placeholder="Mood"
            className="p-2 rounded-lg w-full"
            value={profile?.mood || ''}
            onChange={(e) => setProfile({ ...profile!, mood: e.target.value })}
          />
          <input
            type="url"
            placeholder="Avatar URL"
            className="p-2 rounded-lg w-full"
            value={profile?.avatar_url || ''}
            onChange={(e) => setProfile({ ...profile!, avatar_url: e.target.value })}
          />
          <button
            onClick={updateProfile}
            disabled={updating}
            className="bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
          >
            {updating ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
