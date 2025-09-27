// src/components/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

interface SettingsProps {
  user: User | null;
}

const SettingsPage: React.FC<SettingsProps> = ({ user }) => {
  const [settings, setSettings] = useState({ notifications: true, darkMode: false });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      const { data } = await supabase.from('settings').select('*').eq('id', user.id).single();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, [user]);

  const updateSettings = async () => {
    if (!user) return;
    await supabase.from('settings').upsert({ id: user.id, ...settings });
    alert('Settings updated!');
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-xl font-bold">Settings</h2>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={settings.notifications}
          onChange={e => setSettings({ ...settings, notifications: e.target.checked })}
        />
        Enable Notifications
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={settings.darkMode}
          onChange={e => setSettings({ ...settings, darkMode: e.target.checked })}
        />
        Enable Dark Mode
      </label>
      <button onClick={updateSettings} className="bg-blue-500 text-white px-4 py-1 rounded">
        Save Settings
      </button>
    </div>
  );
};

export default SettingsPage;
