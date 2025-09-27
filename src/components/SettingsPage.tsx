// src/components/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft,
  User,
  Shield,
  Bell,
  MapPin,
  Eye,
  Lock,
  Smartphone,
  Globe,
  Download,
  Trash2,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Volume2,
  MessageCircle,
  Users,
  HelpCircle,
  Mail,
  AlertTriangle
} from 'lucide-react';

interface SettingsData {
  notifications: {
    push_enabled: boolean;
    email_enabled: boolean;
    messages: boolean;
    connections: boolean;
    nearby_users: boolean;
    security_alerts: boolean;
  };
  privacy: {
    profile_visibility: 'public' | 'limited' | 'private';
    show_online_status: boolean;
    show_last_seen: boolean;
    allow_location_sharing: boolean;
    show_age: boolean;
    show_real_name: boolean;
  };
  security: {
    two_factor_enabled: boolean;
    login_alerts: boolean;
    block_unverified: boolean;
    auto_decline_time: number;
  };
  app: {
    theme: 'light' | 'dark' | 'auto';
    sound_enabled: boolean;
    vibration_enabled: boolean;
    language: string;
  };
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    notifications: {
      push_enabled: true,
      email_enabled: true,
      messages: true,
      connections: true,
      nearby_users: false,
      security_alerts: true,
    },
    privacy: {
      profile_visibility: 'public',
      show_online_status: true,
      show_last_seen: true,
      allow_location_sharing: true,
      show_age: true,
      show_real_name: false,
    },
    security: {
      two_factor_enabled: false,
      login_alerts: true,
      block_unverified: false,
      auto_decline_time: 24,
    },
    app: {
      theme: 'dark',
      sound_enabled: true,
      vibration_enabled: true,
      language: 'en',
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load user settings from Supabase
      // For now using default settings
      setLoading(false);
    } catch (error) {
      console.error('Load settings error:', error);
      setLoading(false);
    }
  };

  const updateSettings = async (section: keyof SettingsData, key: string, value: any) => {
    setSaving(true);
    try {
      const newSettings = {
        ...settings,
        [section]: {
          ...settings[section],
          [key]: value
        }
      };
      setSettings(newSettings);
      
      // Save to Supabase
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      
    } catch (error) {
      console.error('Update settings error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Delete account logic here
      alert('Account deletion initiated. You will receive a confirmation email.');
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Delete account error:', error);
    }
  };

  const handleDataExport = async () => {
    try {
      // Export user data logic here
      alert('Data export started. You will receive a download link via email.');
    } catch (error) {
      console.error('Export data error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  const ToggleSwitch: React.FC<{ 
    enabled: boolean; 
    onChange: (value: boolean) => void; 
    disabled?: boolean 
  }> = ({ enabled, onChange, disabled = false }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`w-12 h-6 rounded-full transition-all ${
        enabled ? 'bg-green-500' : 'bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
        enabled ? 'translate-x-7' : 'translate-x-0.5'
      }`} />
    </button>
  );

  const SettingItem: React.FC<{
    icon: React.ComponentType<any>;
    title: string;
    description?: string;
    value?: any;
    type: 'toggle' | 'select' | 'action';
    options?: { label: string; value: any }[];
    onChange?: (value: any) => void;
    action?: () => void;
    danger?: boolean;
  }> = ({ icon: Icon, title, description, value, type, options, onChange, action, danger = false }) => (
    <div className={`p-4 bg-white/5 rounded-lg ${danger ? 'border border-red-500/30' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${danger ? 'text-red-400' : 'text-purple-400'}`} />
          <div>
            <h3 className={`font-medium ${danger ? 'text-red-300' : 'text-white'}`}>{title}</h3>
            {description && (
              <p className="text-white/60 text-sm">{description}</p>
            )}
          </div>
        </div>
        
        {type === 'toggle' && onChange && (
          <ToggleSwitch
            enabled={value}
            onChange={onChange}
            disabled={saving}
          />
        )}
        
        {type === 'select' && options && onChange && (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-purple-400"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-800">
                {option.label}
              </option>
            ))}
          </select>
        )}
        
        {type === 'action' && action && (
          <button
            onClick={action}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              danger 
                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' 
                : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

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
          
          <h1 className="text-xl font-bold text-white">Settings</h1>
          
          <div className="w-8"></div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-8">
          {/* Profile Settings */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-purple-400" />
              Profile & Privacy
            </h2>
            <div className="space-y-3">
              <SettingItem
                icon={Eye}
                title="Profile Visibility"
                description="Who can see your profile"
                type="select"
                value={settings.privacy.profile_visibility}
                options={[
                  { label: 'Public', value: 'public' },
                  { label: 'Limited', value: 'limited' },
                  { label: 'Private', value: 'private' }
                ]}
                onChange={(value) => updateSettings('privacy', 'profile_visibility', value)}
              />
              
              <SettingItem
                icon={Globe}
                title="Show Online Status"
                description="Let others see when you're online"
                type="toggle"
                value={settings.privacy.show_online_status}
                onChange={(value) => updateSettings('privacy', 'show_online_status', value)}
              />
              
              <SettingItem
                icon={MapPin}
                title="Location Sharing"
                description="Allow location-based discovery"
                type="toggle"
                value={settings.privacy.allow_location_sharing}
                onChange={(value) => updateSettings('privacy', 'allow_location_sharing', value)}
              />
              
              <SettingItem
                icon={User}
                title="Show Real Name"
                description="Display your full name instead of username"
                type="toggle"
                value={settings.privacy.show_real_name}
                onChange={(value) => updateSettings('privacy', 'show_real_name', value)}
              />
            </div>
          </section>

          {/* Security Settings */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-400" />
              Security
            </h2>
            <div className="space-y-3">
              <SettingItem
                icon={Lock}
                title="Two-Factor Authentication"
                description="Add an extra layer of security"
                type="toggle"
                value={settings.security.two_factor_enabled}
                onChange={(value) => updateSettings('security', 'two_factor_enabled', value)}
              />
              
              <SettingItem
                icon={Bell}
                title="Login Alerts"
                description="Get notified of new sign-ins"
                type="toggle"
                value={settings.security.login_alerts}
                onChange={(value) => updateSettings('security', 'login_alerts', value)}
              />
              
              <SettingItem
                icon={Shield}
                title="Block Unverified Users"
                description="Only interact with verified accounts"
                type="toggle"
                value={settings.security.block_unverified}
                onChange={(value) => updateSettings('security', 'block_unverified', value)}
              />
            </div>
          </section>

          {/* Notification Settings */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-400" />
              Notifications
            </h2>
            <div className="space-y-3">
              <SettingItem
                icon={Smartphone}
                title="Push Notifications"
                description="Receive notifications on your device"
                type="toggle"
                value={settings.notifications.push_enabled}
                onChange={(value) => updateSettings('notifications', 'push_enabled', value)}
              />
              
              <SettingItem
                icon={MessageCircle}
                title="Message Notifications"
                description="Get notified of new messages"
                type="toggle"
                value={settings.notifications.messages}
                onChange={(value) => updateSettings('notifications', 'messages', value)}
              />
              
              <SettingItem
                icon={Users}
                title="Connection Requests"
                description="Notifications for friend requests"
                type="toggle"
                value={settings.notifications.connections}
                onChange={(value) => updateSettings('notifications', 'connections', value)}
              />
              
              <SettingItem
                icon={MapPin}
                title="Nearby Users"
                description="When new users are discovered nearby"
                type="toggle"
                value={settings.notifications.nearby_users}
                onChange={(value) => updateSettings('notifications', 'nearby_users', value)}
              />
            </div>
          </section>

          {/* App Settings */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-yellow-400" />
              App Preferences
            </h2>
            <div className="space-y-3">
              <SettingItem
                icon={Moon}
                title="Theme"
                description="Choose your preferred theme"
                type="select"
                value={settings.app.theme}
                options={[
                  { label: 'Dark', value: 'dark' },
                  { label: 'Light', value: 'light' },
                  { label: 'Auto', value: 'auto' }
                ]}
                onChange={(value) => updateSettings('app', 'theme', value)}
              />
              
              <SettingItem
                icon={Volume2}
                title="Sound Effects"
                description="Play sounds for interactions"
                type="toggle"
                value={settings.app.sound_enabled}
                onChange={(value) => updateSettings('app', 'sound_enabled', value)}
              />
              
              <SettingItem
                icon={Smartphone}
                title="Vibration"
                description="Vibrate for notifications"
                type="toggle"
                value={settings.app.vibration_enabled}
                onChange={(value) => updateSettings('app', 'vibration_enabled', value)}
              />
            </div>
          </section>

          {/* Support & Help */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-cyan-400" />
              Support & Help
            </h2>
            <div className="space-y-3">
              <SettingItem
                icon={HelpCircle}
                title="Help Center"
                description="Get help and find answers"
                type="action"
                action={() => window.open('#', '_blank')}
              />
              
              <SettingItem
                icon={Mail}
                title="Contact Support"
                description="Send us a message"
                type="action"
                action={() => window.open('mailto:support@echovibe.com')}
              />
              
              <SettingItem
                icon={Download}
                title="Export Your Data"
                description="Download your personal data"
                type="action"
                action={handleDataExport}
              />
            </div>
          </section>

          {/* Account Actions */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              Account
            </h2>
            <div className="space-y-3">
              <SettingItem
                icon={LogOut}
                title="Sign Out"
                description="Sign out of your account"
                type="action"
                action={handleSignOut}
                danger
              />
              
              <SettingItem
                icon={Trash2}
                title="Delete Account"
                description="Permanently delete your account and data"
                type="action"
                action={() => setShowDeleteConfirm(true)}
                danger
              />
            </div>
          </section>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Account</h3>
              <p className="text-white/70">
                This action cannot be undone. All your data, connections, and messages will be permanently deleted.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;