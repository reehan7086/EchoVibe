// src/pages/SettingsPage.tsx
import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface SettingsPageProps {
  user: User;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user }) => {
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const updateSettings = async () => {
    setUpdating(true);
    if (email !== user.email) {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) console.error(error);
    }
    if (password) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) console.error(error);
    }
    alert('Settings updated!');
    setUpdating(false);
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex justify-center">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md flex flex-col space-y-4">
        <h2 className="text-white text-2xl font-bold mb-4">Settings</h2>
        <input
          type="email"
          placeholder="Email"
          className="p-2 rounded-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="New Password"
          className="p-2 rounded-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={updateSettings}
          disabled={updating}
          className="bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
        >
          {updating ? 'Updating...' : 'Update Settings'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
