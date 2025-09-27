// src/components/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

interface ProfileProps {
  user: User | null;
}

const ProfilePage: React.FC<ProfileProps> = ({ user }) => {
  const [profile, setProfile] = useState<any>({ full_name: '', age: '', gender: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [user]);

  const updateProfile = async () => {
    if (!user) return;
    await supabase.from('profiles').upsert({ id: user.id, ...profile });
    alert('Profile updated!');
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-xl font-bold">Profile</h2>
      <input
        type="text"
        placeholder="Full Name"
        value={profile.full_name}
        onChange={e => setProfile({ ...profile, full_name: e.target.value })}
        className="w-full border rounded px-2 py-1"
      />
      <input
        type="number"
        placeholder="Age"
        value={profile.age}
        onChange={e => setProfile({ ...profile, age: e.target.value })}
        className="w-full border rounded px-2 py-1"
      />
      <select
        value={profile.gender}
        onChange={e => setProfile({ ...profile, gender: e.target.value })}
        className="w-full border rounded px-2 py-1"
      >
        <option value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
      <button onClick={updateProfile} className="bg-blue-500 text-white px-4 py-1 rounded">
        Save Profile
      </button>
    </div>
  );
};

export default ProfilePage;
