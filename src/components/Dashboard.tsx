// src/components/Dashboard.tsx - Updated Dashboard
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Users, 
  MessageCircle, 
  Zap, 
  Shield,
  TrendingUp,
  Bell,
  Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  nearbyUsers: number;
  connections: number;
  unreadMessages: number;
  vibeScore: number;
  securityLevel: 'high' | 'medium' | 'low';
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    nearbyUsers: 0,
    connections: 0,
    unreadMessages: 0,
    vibeScore: 0,
    securityLevel: 'high'
  });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const initDashboard = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        await fetchDashboardStats();
      } catch (error) {
        console.error('Dashboard init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Mock stats - replace with actual API calls
      setStats({
        nearbyUsers: 23,
        connections: 156,
        unreadMessages: 7,
        vibeScore: 8.7,
        securityLevel: 'high'
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">SparkVibe</h1>
              <p className="text-white/60 text-sm">Welcome back, {currentUser?.email || 'Vibe Explorer'}!</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
              <Search className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all relative">
              <Bell className="w-5 h-5 text-white" />
              {stats.unreadMessages > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{stats.unreadMessages}</span>
                </div>
              )}
            </button>
            <Link 
              to="/profile"
              className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
              <span className="text-white font-bold">
                {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Link
            to="/map"
            className="group bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6 hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-purple-500/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <h3 className="text-white font-bold">Secure Vibe Map</h3>
                <p className="text-purple-300 text-sm">Enhanced & Safe</p>
              </div>
            </div>
            <p className="text-white/70 text-sm mb-3">
              Discover nearby vibes with advanced privacy and security features
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400">{stats.nearbyUsers} users nearby</span>
            </div>
          </Link>

          <Link
            to="/chat"
            className="group bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6 hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <h3 className="text-white font-bold">Chat Hub</h3>
                <p className="text-blue-300 text-sm">Connect & Vibe</p>
              </div>
            </div>
            <p className="text-white/70 text-sm mb-3">
              Start conversations with people who share your vibe
            </p>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-blue-400">{stats.unreadMessages} new messages</span>
            </div>
          </Link>

          <Link
            to="/profile"
            className="group bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6 hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-green-500/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-green-300" />
              </div>
              <div>
                <h3 className="text-white font-bold">Your Vibe</h3>
                <p className="text-green-300 text-sm">Profile & Stats</p>
              </div>
            </div>
            <p className="text-white/70 text-sm mb-3">
              Manage your profile and track your vibe journey
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-green-400" />
              <span className="text-green-400">Score: {stats.vibeScore}/10</span>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Security settings updated</p>
                <p className="text-white/60 text-sm">Enhanced privacy mode enabled</p>
              </div>
              <span className="text-white/40 text-sm">2m ago</span>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">3 new users discovered nearby</p>
                <p className="text-white/60 text-sm">Check them out on the map</p>
              </div>
              <span className="text-white/40 text-sm">5m ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;