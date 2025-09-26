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
import { Profile } from './types';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize authentication
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchOrCreateProfile(session.user);
      }
      
      // Redirect logic
      if (!session?.user && !['/login', '/signup', '/'].includes(location.pathname)) {
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const fetchOrCreateProfile = async (user: User) => {
    try {
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create one
        const newProfile = {
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
          is_online: false
        };
        
        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();
          
        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          profileData = createdProfile;
        }
      } else if (profileError) {
        throw new Error(`Profile fetch failed: ${profileError.message}`);
      }
      
      setProfile(profileData);
    } catch (error) {
      console.error('Error fetching/creating profile:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route path="/" element={!user ? <LandingPage /> : <MainDashboard user={user} profile={profile} />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/dashboard/*" element={user ? <MainDashboard user={user} profile={profile} /> : <LoginPage />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;