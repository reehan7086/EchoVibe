// src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

// Components
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import MainDashboard from './components/MainDashboard';
import LoadingSpinner from './components/LoadingSpinner';

// Types
import type { Database } from './types';
type Profile = Database['public']['Tables']['profiles']['Row'];
type InsertProfile = Database['public']['Tables']['profiles']['Insert'];

// AppContent handles auth state and routing
const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error && error.name !== 'AuthSessionMissingError') {
          throw new Error(`Session fetch failed: ${error.message}`);
        }

        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchOrCreateProfile(session.user);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          await fetchOrCreateProfile(session.user);
        }

        if (!session?.user && !['/login', '/signup', '/'].includes(location.pathname)) {
          navigate('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  const fetchOrCreateProfile = async (user: User) => {
    try {
      // Fetch existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single() as { data: Profile | null; error: any };

      let profileData = data;

      // If profile not found, create one
      if (error && error.code === 'PGRST116') {
        const newProfile: InsertProfile = {
          id: user.id,
          username:
            user.user_metadata?.preferred_username ||
            user.user_metadata?.name?.toLowerCase().replace(/\s+/g, '') ||
            user.email?.split('@')[0] ||
            `user_${user.id.slice(0, 8)}`,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'New User',
          avatar_url: user.user_metadata?.avatar_url || null,
          vibe_score: 0,
          is_online: false,
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile] as InsertProfile[])
          .select()
          .single() as { data: Profile | null; error: any };

        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          profileData = createdProfile;
        }
      } else if (error) {
        throw new Error(`Profile fetch failed: ${error.message}`);
      }

      setProfile(profileData ?? null);
    } catch (err) {
      console.error('Error fetching/creating profile:', err);
    }
  };

  if (loading) return <LoadingSpinner />;

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

// Only one BrowserRouter at the very top
const App: React.FC = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);

export default App;
