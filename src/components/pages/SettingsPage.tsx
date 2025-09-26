import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Bell, 
  Shield, 
  Moon, 
  Globe, 
  HelpCircle, 
  FileText, 
  AlertTriangle,
  Download,
  Trash2,
  Lock,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types';

interface SettingsPageProps {
  user: User;
  profile: Profile | null;
  updateProfile: (updates: Partial<Profile>) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user, profile, updateProfile }) => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      likes: true,
      comments: true,
      follows: true,
      messages: true
    },
    privacy: {
      isPrivate: false,
      showEmail: false,
      showActivity: true,
      allowMessages: true
    },
    appearance: {
      darkMode: true,
      language: 'en'
    }
  });
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    if (profile) {
      setSettings(prev => ({
        ...prev,
        privacy: {
          ...prev.privacy,
          isPrivate: false
        }
      }));
    }
  }, [profile]);

  const handleSettingChange = async (category: string, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value
      }
    }));

    // Save privacy settings to database
    if (category === 'privacy' && setting === 'isPrivate') {
      try {
        // Note: is_private field doesn't exist in current schema
        // This would need to be added to the database schema if privacy is needed
        console.log('Privacy setting changed:', value);
      } catch (error) {
        console.error('Error updating privacy setting:', error);
      }
    }
  };

  const handleExportData = async () => {
    try {
      // Fetch user's data
      const [postsData, likesData, followsData] = await Promise.all([
        supabase.from('vibe_echoes').select('*').eq('user_id', user.id),
        supabase.from('likes').select('*').eq('user_id', user.id),
        supabase.from('follows').select('*').eq('follower_id', user.id)
      ]);

      const userData = {
        profile: profile,
        posts: postsData.data,
        likes: likesData.data,
        follows: followsData.data,
        exportDate: new Date().toISOString()
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sparkvibe-data-${user.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setShowDataModal(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data.');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      alert('Please type DELETE to confirm account deletion.');
      return;
    }

    try {
      // Delete user's data (posts, likes, follows, etc.)
      await Promise.all([
        supabase.from('vibe_echoes').update({ is_active: false }).eq('user_id', user.id),
        supabase.from('vibe_likes').delete().eq('user_id', user.id),
        supabase.from('follows').delete().eq('follower_id', user.id),
        supabase.from('follows').delete().eq('following_id', user.id),
        supabase.from('community_members').delete().eq('user_id', user.id),
        supabase.from('profiles').delete().eq('id', user.id)
      ]);

      // Delete auth user
      await supabase.auth.admin.deleteUser(user.id);
      
      alert('Your account has been deleted successfully.');
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please contact support.');
    }
  };

  const settingSections = [
    {
      title: 'Notifications',
      icon: <Bell size={20} />,
      settings: [
        {
          key: 'email',
          label: 'Email Notifications',
          description: 'Receive notifications via email',
          type: 'toggle'
        },
        {
          key: 'push',
          label: 'Push Notifications',
          description: 'Receive push notifications in your browser',
          type: 'toggle'
        },
        {
          key: 'likes',
          label: 'Like Notifications',
          description: 'Get notified when someone likes your posts',
          type: 'toggle'
        },
        {
          key: 'comments',
          label: 'Comment Notifications',
          description: 'Get notified when someone comments on your posts',
          type: 'toggle'
        },
        {
          key: 'follows',
          label: 'Follow Notifications',
          description: 'Get notified when someone follows you',
          type: 'toggle'
        },
        {
          key: 'messages',
          label: 'Message Notifications',
          description: 'Get notified about new messages',
          type: 'toggle'
        }
      ]
    },
    {
      title: 'Privacy & Security',
      icon: <Shield size={20} />,
      settings: [
        {
          key: 'isPrivate',
          label: 'Private Account',
          description: 'Only approved followers can see your posts',
          type: 'toggle'
        },
        {
          key: 'showEmail',
          label: 'Show Email',
          description: 'Display your email address on your profile',
          type: 'toggle'
        },
        {
          key: 'showActivity',
          label: 'Show Activity Status',
          description: 'Let others see when you were last active',
          type: 'toggle'
        },
        {
          key: 'allowMessages',
          label: 'Allow Messages',
          description: 'Allow anyone to send you direct messages',
          type: 'toggle'
        }
      ]
    },
    {
      title: 'Appearance',
      icon: <Moon size={20} />,
      settings: [
        {
          key: 'darkMode',
          label: 'Dark Mode',
          description: 'Use dark theme throughout the app',
          type: 'toggle'
        },
        {
          key: 'language',
          label: 'Language',
          description: 'Choose your preferred language',
          type: 'select',
          options: [
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Español' },
            { value: 'fr', label: 'Français' },
            { value: 'de', label: 'Deutsch' }
          ]
        }
      ]
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings size={24} />
          Settings
        </h2>
        <p className="text-white/60 mt-1">Manage your account preferences and privacy settings</p>
      </div>

      {/* Settings Sections */}
      {settingSections.map((section) => (
        <div key={section.title} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
            {section.icon}
            {section.title}
          </h3>
          <div className="space-y-4">
            {section.settings.map((setting) => (
              <div key={setting.key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex-1">
                  <h4 className="font-medium text-white">{setting.label}</h4>
                  <p className="text-sm text-white/60 mt-1">{setting.description}</p>
                </div>
                <div className="ml-4">
                  {setting.type === 'toggle' && (
                    <button
                      onClick={() => {
                        const category = section.title === 'Notifications' ? 'notifications' :
                                       section.title === 'Privacy & Security' ? 'privacy' : 'appearance';
                        const currentValue = settings[category][setting.key as keyof typeof settings[typeof category]];
                        handleSettingChange(category, setting.key, !currentValue);
                      }}
                      className={`w-12 h-6 rounded-full transition-all ${
                        (() => {
                          const category = section.title === 'Notifications'
                            ? 'notifications'
                            : section.title === 'Privacy & Security'
                              ? 'privacy'
                              : 'appearance';
                          const value = settings[category][setting.key as keyof typeof settings[typeof category]];
                          return value ? 'bg-purple-500' : 'bg-white/20';
                        })()
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          (() => {
                            const category =
                              section.title === 'Notifications'
                                ? 'notifications'
                                : section.title === 'Privacy & Security'
                                  ? 'privacy'
                                  : 'appearance';
                            const value = settings[category][setting.key as keyof typeof settings[typeof category]];
                            return value ? 'translate-x-7' : 'translate-x-0.5';
                          })()
                        }`}
                      />
                    </button>
                  )}
                  {setting.type === 'select' && setting.options && (
                    <select
                      value={settings.appearance[setting.key as keyof typeof settings.appearance] as string}
                      onChange={(e) => handleSettingChange('appearance', setting.key, e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                    >
                      {setting.options.map((option) => (
                        <option key={option.value} value={option.value} className="bg-slate-800">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Support & Legal */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
          <HelpCircle size={20} />
          Support & Legal
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Help Center', icon: HelpCircle, action: () => window.open('#', '_blank') },
            { label: 'Privacy Policy', icon: FileText, action: () => window.open('#', '_blank') },
            { label: 'Terms of Service', icon: FileText, action: () => window.open('#', '_blank') },
            { label: 'Community Guidelines', icon: Globe, action: () => window.open('#', '_blank') }
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-left text-white"
            >
              <item.icon size={20} className="text-purple-400" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data & Account */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
          <Lock size={20} />
          Data & Account
        </h3>
        <div className="space-y-3">
          <button
            onClick={() => setShowDataModal(true)}
            className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-left text-white"
          >
            <Download size={20} className="text-blue-400" />
            <div>
              <div className="font-medium">Download Your Data</div>
              <div className="text-sm text-white/60">Get a copy of all your SparkVibe data</div>
            </div>
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center gap-4 p-4 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-all text-left text-red-400"
          >
            <Trash2 size={20} />
            <div>
              <div className="font-medium">Delete Account</div>
              <div className="text-sm text-red-400/60">Permanently delete your account and all data</div>
            </div>
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 text-center">
        <h3 className="text-lg font-semibold mb-2 text-white">SparkVibe</h3>
        <p className="text-white/60 text-sm">Version 1.0.0</p>
        <p className="text-white/40 text-xs mt-2">© 2025 SparkVibe. All rights reserved.</p>
      </div>

      {/* Export Data Modal */}
      {showDataModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-md">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-semibold text-white">Download Your Data</h3>
              <button
                onClick={() => setShowDataModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-white/80 mb-4">
                This will download a JSON file containing all your SparkVibe data including posts, likes, follows, and profile information.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDataModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExportData}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-md">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-400" />
                Delete Account
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                <p className="text-red-400 text-sm font-medium mb-2">Warning: This action cannot be undone!</p>
                <p className="text-red-400/80 text-sm">
                  Deleting your account will permanently remove all your posts, messages, follows, and profile data.
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm text-white/60 mb-2">
                  Type <strong>DELETE</strong> to confirm:
                </label>
                <input
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-red-400"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== 'DELETE'}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SettingsPage;