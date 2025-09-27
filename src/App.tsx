// src/App.tsx - Fixed version with proper error handling and routing
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

// Components
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import MainDashboard from './components/MainDashboard';
import LoadingSpinner from './components/LoadingSpinner';

// Fixed types
type Profile = {
  id: string;
  username: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  vibe_score: number;
  is_online: boolean;
  created_at: string;
  updated_at?: string;
  location?: string;
  city?: string;
};

type InsertProfile = {
  id: string;
  username: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  vibe_score?: number;
  is_online?: boolean;
};

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing authentication...');
        setLoading(true);
        setError(null);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) {
            setError('Authentication failed. Please try again.');
            setUser(null);
            setProfile(null);
          }
          return;
        }

        if (mounted) {
          setUser(session?.user ?? null);
        }

        if (session?.user && mounted) {
          console.log('✅ User session found, fetching profile...');
          await fetchOrCreateProfile(session.user);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        if (mounted) {
          setError('Failed to initialize authentication');
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (mounted) {
          setUser(session?.user ?? null);
          setError(null);
        }

        if (event === 'SIGNED_IN' && session?.user && mounted) {
          console.log('✅ User signed in, fetching profile...');
          await fetchOrCreateProfile(session.user);
        }

        if (event === 'SIGNED_OUT' && mounted) {
          console.log('👋 User signed out');
          setProfile(null);
          if (!['/login', '/signup', '/'].includes(location.pathname)) {
            navigate('/');
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const fetchOrCreateProfile = async (user: User) => {
    try {
      console.log('🔄 Fetching profile for user:', user.id);

      // First, try to fetch existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          bio,
          avatar_url,
          vibe_score,
          is_online,
          created_at,
          updated_at,
          location,
          city
        `)
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching profile:', fetchError);
        throw fetchError;
      }

      if (existingProfile) {
        console.log('✅ Profile found:', existingProfile);
        setProfile(existingProfile);
        return;
      }

      // Profile doesn't exist, create one
      console.log('📝 Creating new profile...');
      const newProfile: InsertProfile = {
        id: user.id,
        username: user.user_metadata?.preferred_username ||
                 user.user_metadata?.name?.toLowerCase().replace(/\s+/g, '') ||
                 user.email?.split('@')[0] ||
                 `user_${user.id.slice(0, 8)}`,
        full_name: user.user_metadata?.full_name || 
                  user.user_metadata?.name || 
                  'New User',
        avatar_url: user.user_metadata?.avatar_url || null,
        vibe_score: 0,
        is_online: true
      };

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select(`
          id,
          username,
          full_name,
          bio,
          avatar_url,
          vibe_score,
          is_online,
          created_at,
          updated_at,
          location,
          city
        `)
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        throw createError;
      }

      console.log('✅ Profile created:', createdProfile);
      setProfile(createdProfile);

    } catch (err: any) {
      console.error('Error fetching/creating profile:', err);
      setError(`Profile error: ${err.message || 'Unknown error'}`);
    }
  };

  const handleRetry = () => {
    setError(null);
    window.location.reload();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center text-white p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Connection Error</h1>
          <p className="text-white/80 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={!user ? <LandingPage /> : <MainDashboard user={user} profile={profile} />}
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        path="/dashboard/*"
        element={user ? <MainDashboard user={user} profile={profile} /> : <LoginPage />}
      />
    </Routes>
  );
};

const App: React.FC = () => (
  <AppContent />
);

export default App;