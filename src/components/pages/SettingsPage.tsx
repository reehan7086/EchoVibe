// src/components/pages/SettingsPage.tsx - Enhanced with beautiful UI and comprehensive settings
import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Bell, MapPin, Eye, Users, Lock, Smartphone, Globe,
  Moon, Sun, Volume2, VolumeX, Trash2, Download, Upload,
  Settings, Save, AlertTriangle, Check, X, Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SettingsPageProps {
  user: User;
}

interface UserSettings {
  notifications: {
    push_enabled: boolean;
    email_enabled: boolean;
    friend_requests: boolean;
    messages: boolean;
    nearby_users: boolean;
    marketing: boolean;
  };
  privacy: {
    profile_visibility: 'public' | 'friends' | 'private';
    show_online_status: boolean;
    show_location: boolean;
    allow_friend_requests: boolean;
    allow_messages_from: 'everyone' | 'friends' | 'none';
    show_age: boolean;
    show_real_name: boolean;
  };
  location: {
    share_location: boolean;
    location_precision: 'exact' | 'approximate' | 'city_only';
    auto_update: boolean;
    radius_km: number;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    sound_effects: boolean;
    animations: boolean;
    language: string;
  };
  security: {
    two_factor_enabled: boolean;
    login_alerts: boolean;
    data_download_requested: boolean;
  };
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user }) => {
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      push_enabled: true,
      email_enabled: true,
      friend_requests: true,
      messages: true,
      nearby_users: false,
      marketing: false,
    },
    privacy: {
      profile_visibility: 'public',
      show_online_status: true,
      show_location: true,
      allow_friend_requests: true,
      allow_messages_from: 'everyone',
      show_age: true,
      show_real_name: true,
    },
    location: {
      share_location: true,
      location_precision: 'approximate',
      auto_update: true,
      radius_km: 5,
    },
    appearance: {
      theme: 'dark',
      sound_effects: true,
      animations: true,
      language: 'en',
    },
    security: {
      two_factor_enabled: false,
      login_alerts: true,
      data_download_requested: false,
    },
  });

  const [activeSection, setActiveSection] = useState('notifications');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const sections = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'appearance', label: 'Appearance', icon: Eye },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you absolutely sure? This action cannot be undone.')) {
      try {
        // Here you would implement account deletion
        // For now, just show an alert
        alert('Account deletion would be processed. This is a demo.');
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
    setShowDeleteAccount(false);
  };

  const requestDataDownload = async () => {
    try {
      // Implement data download request
      alert('Data download request submitted. You will receive an email when ready.');
      updateSetting('security', 'data_download_requested', true);
    } catch (error) {
      console.error('Error requesting data download:', error);
    }
  };

  const ToggleSwitch: React.FC<{ 
    enabled: boolean; 
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
  }> = ({ enabled, onChange, disabled = false }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-purple-600' : 'bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      disabled={disabled}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Push Notifications</h3>
          <p className="text-white/60 text-sm">Receive notifications on your device</p>
        </div>
        <ToggleSwitch
          enabled={settings.notifications.push_enabled}
          onChange={(value) => updateSetting('notifications', 'push_enabled', value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Email Notifications</h3>
          <p className="text-white/60 text-sm">Receive important updates via email</p>
        </div>
        <ToggleSwitch
          enabled={settings.notifications.email_enabled}
          onChange={(value) => updateSetting('notifications', 'email_enabled', value)}
        />
      </div>

      <div className="space-y-4 pt-4 border-t border-white/10">
        <h4 className="text-white font-medium">Notification Types</h4>
        
        {[
          { key: 'friend_requests', label: 'Friend Requests', desc: 'When someone wants to connect' },
          { key: 'messages', label: 'Messages', desc: 'New messages from connections' },
          { key: 'nearby_users', label: 'Nearby Users', desc: 'When interesting people are nearby' },
          { key: 'marketing', label: 'Marketing', desc: 'Tips, features, and updates' },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div>
              <div className="text-white">{item.label}</div>
              <div className="text-white/60 text-sm">{item.desc}</div>
            </div>
            <ToggleSwitch
              enabled={settings.notifications[item.key as keyof typeof settings.notifications] as boolean}
              onChange={(value) => updateSetting('notifications', item.key, value)}
              disabled={!settings.notifications.push_enabled && !settings.notifications.email_enabled}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderPrivacySection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Profile Visibility</h3>
        <div className="grid grid-cols-1 gap-3">
          {[
            { value: 'public', label: 'Public', desc: 'Anyone can see your profile' },
            { value: 'friends', label: 'Friends Only', desc: 'Only your connections can see your profile' },
            { value: 'private', label: 'Private', desc: 'Only you can see your profile' },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
              <input
                type="radio"
                name="visibility"
                value={option.value}
                checked={settings.privacy.profile_visibility === option.value}
                onChange={(e) => updateSetting('privacy', 'profile_visibility', e.target.value)}
                className="w-4 h-4 text-purple-600"
              />
              <div>
                <div className="text-white font-medium">{option.label}</div>
                <div className="text-white/60 text-sm">{option.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-white/10">
        <h4 className="text-white font-medium">What Others Can See</h4>
        
        {[
          { key: 'show_online_status', label: 'Online Status', desc: 'Show when you\'re active' },
          { key: 'show_location', label: 'Location', desc: 'Share your approximate location' },
          { key: 'show_age', label: 'Age', desc: 'Display your age on profile' },
          { key: 'show_real_name', label: 'Real Name', desc: 'Show your full name' },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div>
              <div className="text-white">{item.label}</div>
              <div className="text-white/60 text-sm">{item.desc}</div>
            </div>
            <ToggleSwitch
              enabled={settings.privacy[item.key as keyof typeof settings.privacy] as boolean}
              onChange={(value) => updateSetting('privacy', item.key, value)}
            />
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/10">
        <h4 className="text-white font-medium mb-4">Communication Preferences</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white">Allow Friend Requests</div>
              <div className="text-white/60 text-sm">Let others send you connection requests</div>
            </div>
            <ToggleSwitch
              enabled={settings.privacy.allow_friend_requests}
              onChange={(value) => updateSetting('privacy', 'allow_friend_requests', value)}
            />
          </div>

          <div>
            <div className="text-white mb-2">Who Can Message You</div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: 'everyone', label: 'Everyone' },
                { value: 'friends', label: 'Friends Only' },
                { value: 'none', label: 'No One' },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="radio"
                    name="messages"
                    value={option.value}
                    checked={settings.privacy.allow_messages_from === option.value}
                    onChange={(e) => updateSetting('privacy', 'allow_messages_from', e.target.value)}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div className="text-white">{option.label}</div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLocationSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Share Location</h3>
          <p className="text-white/60 text-sm">Allow SparkVibe to access your location</p>
        </div>
        <ToggleSwitch
          enabled={settings.location.share_location}
          onChange={(value) => updateSetting('location', 'share_location', value)}
        />
      </div>

      {settings.location.share_location && (
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div>
            <h4 className="text-white font-medium mb-3">Location Precision</h4>
            <div className="grid grid-cols-1 gap-3">
              {[
                { value: 'exact', label: 'Exact Location', desc: 'Share your precise location (within 10m)' },
                { value: 'approximate', label: 'Approximate', desc: 'Share general area (within 1km)' },
                { value: 'city_only', label: 'City Only', desc: 'Only share your city' },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="radio"
                    name="precision"
                    value={option.value}
                    checked={settings.location.location_precision === option.value}
                    onChange={(e) => updateSetting('location', 'location_precision', e.target.value)}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div>
                    <div className="text-white font-medium">{option.label}</div>
                    <div className="text-white/60 text-sm">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-white">Auto-Update Location</div>
              <div className="text-white/60 text-sm">Update your location automatically as you move</div>
            </div>
            <ToggleSwitch
              enabled={settings.location.auto_update}
              onChange={(value) => updateSetting('location', 'auto_update', value)}
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              Discovery Radius: {settings.location.radius_km} km
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={settings.location.radius_km}
              onChange={(e) => updateSetting('location', 'radius_km', parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-white/60 text-sm mt-1">
              <span>1 km</span>
              <span>50 km</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAppearanceSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Theme</h3>
        <div className="grid grid-cols-1 gap-3">
          {[
            { value: 'light', label: 'Light', desc: 'Light theme', icon: Sun },
            { value: 'dark', label: 'Dark', desc: 'Dark theme', icon: Moon },
            { value: 'auto', label: 'Auto', desc: 'Match system preference', icon: Smartphone },
          ].map((option) => {
            const Icon = option.icon;
            return (
              <label key={option.value} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="radio"
                  name="theme"
                  value={option.value}
                  checked={settings.appearance.theme === option.value}
                  onChange={(e) => updateSetting('appearance', 'theme', e.target.value)}
                  className="w-4 h-4 text-purple-600"
                />
                <Icon className="w-5 h-5 text-white/60" />
                <div>
                  <div className="text-white font-medium">{option.label}</div>
                  <div className="text-white/60 text-sm">{option.desc}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-white">Sound Effects</div>
          <div className="text-white/60 text-sm">Play sounds for interactions</div>
        </div>
        <ToggleSwitch
          enabled={settings.appearance.sound_effects}
          onChange={(value) => updateSetting('appearance', 'sound_effects', value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-white">Animations</div>
          <div className="text-white/60 text-sm">Enable smooth animations and transitions</div>
        </div>
        <ToggleSwitch
          enabled={settings.appearance.animations}
          onChange={(value) => updateSetting('appearance', 'animations', value)}
        />
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Language</label>
        <select
          value={settings.appearance.language}
          onChange={(e) => updateSetting('appearance', 'language', e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="ar">العربية</option>
        </select>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
          <p className="text-white/60 text-sm">Add an extra layer of security to your account</p>
        </div>
        <ToggleSwitch
          enabled={settings.security.two_factor_enabled}
          onChange={(value) => updateSetting('security', 'two_factor_enabled', value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-white">Login Alerts</div>
          <div className="text-white/60 text-sm">Get notified of new logins to your account</div>
        </div>
        <ToggleSwitch
          enabled={settings.security.login_alerts}
          onChange={(value) => updateSetting('security', 'login_alerts', value)}
        />
      </div>

      <div className="pt-4 border-t border-white/10 space-y-4">
        <h4 className="text-white font-medium">Data & Privacy</h4>
        
        <button
          onClick={requestDataDownload}
          disabled={settings.security.data_download_requested}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          {settings.security.data_download_requested ? 'Download Requested' : 'Download My Data'}
        </button>

        <button
          onClick={() => setShowDeleteAccount(true)}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </button>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'notifications': return renderNotificationsSection();
      case 'privacy': return renderPrivacySection();
      case 'location': return renderLocationSection();
      case 'appearance': return renderAppearanceSection();
      case 'security': return renderSecuritySection();
      default: return renderNotificationsSection();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-white/70">Customize your SparkVibe experience</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeSection === section.id
                          ? 'bg-purple-600 text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
{/* Main Content - FIXED SCROLLING */}
<motion.div
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  className="lg:col-span-3 overflow-hidden flex flex-col"
>
  <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 flex flex-col h-full">
    <div className="flex items-center justify-between p-8 border-b border-white/10 flex-shrink-0">
      <h2 className="text-2xl font-bold text-white">
        {sections.find(s => s.id === activeSection)?.label}
      </h2>
      
      <div className="flex items-center gap-3">
        {saved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-green-400"
          >
            <Check className="w-4 h-4" />
            <span className="text-sm">Saved</span>
          </motion.div>
        )}
        
        <button
          onClick={saveSettings}
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-medium py-2 px-4 rounded-lg transition-all flex items-center gap-2"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>

    {/* SCROLLABLE CONTENT */}
    <div className="flex-1 overflow-y-auto p-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderSection()}
        </motion.div>
      </AnimatePresence>
    </div>
  </div>
</motion.div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteAccount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteAccount(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Delete Account</h3>
                  <p className="text-white/60 text-sm">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-white/80 mb-4">
                  Are you sure you want to permanently delete your account? This will:
                </p>
                <ul className="text-white/70 text-sm space-y-1 list-disc list-inside">
                  <li>Remove all your profile data</li>
                  <li>Delete all your messages and connections</li>
                  <li>Cancel any active subscriptions</li>
                  <li>Remove you from all communities</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteAccount(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-all"
                >
                  Delete Account
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;