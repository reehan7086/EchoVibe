// src/components/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { User, Profile } from '../../types';
import { Edit3, Camera, X, Save, MapPin, Calendar } from 'lucide-react';

interface ProfilePageProps {
  user: User;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    username: '',
    bio: '',
    website: '',
    location: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setProfile(data);
        setEditForm({ ...editForm, ...data });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data, error } = await supabase.from('profiles').update({
        ...editForm,
        updated_at: new Date().toISOString()
      }).eq('id', user.id).select().single();
      if (error) throw error;
      setProfile(data);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${ext}`;
      await supabase.storage.from('avatars').upload(fileName, file);
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setEditForm(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (error) {
      console.error(error);
      alert('Failed to upload avatar.');
    }
  };

  useEffect(() => { fetchProfile(); }, [user.id]);

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 flex gap-6">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-3xl font-bold">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover"/> : profile?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          {isEditing && (
            <label className="absolute bottom-0 right-0 bg-purple-500 rounded-full p-2 cursor-pointer">
              <Camera size={16} className="text-white" />
              <input type="file" onChange={handleAvatarUpload} className="hidden" />
            </label>
          )}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{profile?.full_name}</h1>
              <p className="text-white/60">@{profile?.username}</p>
            </div>
            <button onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg">
              <Edit3 size={16} /> Edit Profile
            </button>
          </div>
          <p className="text-white/80">{profile?.bio}</p>
          <div className="flex flex-wrap gap-4 text-sm text-white/60 mt-2">
            {profile?.location && <div className="flex items-center gap-1"><MapPin size={14} />{profile.location}</div>}
            <div className="flex items-center gap-1"><Calendar size={14} /> Joined {new Date(profile?.created_at || '').toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-slate-800 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Full Name</label>
                  <input type="text" value={editForm.full_name} onChange={e => setEditForm(prev => ({ ...prev, full_name: e.target.value }))} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"/>
                </div>
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Username</label>
                  <input type="text" value={editForm.username} onChange={e => setEditForm(prev => ({ ...prev, username: e.target.value }))} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"/>
                </div>
                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Bio</label>
                  <textarea value={editForm.bio} onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white resize-none"/>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-1 px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg">{saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProfilePage;
