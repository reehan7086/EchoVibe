// src/App.tsx - Fixed version with proper routing and loading states
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

// Components
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import MainDashboard from './components/MainDashboard';
import LoadingSpinner from './components/LoadingSpinner';

// Import types from your types file
import { Profile } from './types';

type InsertProfile = {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  bio?: string | null;
  avatar_url?: string | null;
  location?: string | null;
  city?: string | null;
  created_at?: string;
  updated_at?: string | null;
  vibe_score?: number;
  is_online?: boolean;
  last_active?: string;
};

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const mountedRef = useRef(true);
  const authProcessingRef = useRef(false);

  const fetchOrCreateProfile = async (user: User): Promise<Profile | null> => {
    if (authProcessingRef.current) return null;
    authProcessingRef.current = true;

    try {
      console.log('🔄 Fetching profile for user:', user.id);

      // First, try to fetch existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          username,
          full_name,
          bio,
          avatar_url,
          vibe_score,
          is_online,
          created_at,
          updated_at,
          location,
          city,
          last_active
        `)
        .eq('user_id', user.id)
        .single();

      if (existingProfile && mountedRef.current) {
        // Profile exists, update online status
        const updatedProfile = { ...existingProfile, is_online: true };
        
        // Update online status in database
        await supabase
          .from('profiles')
          .update({ is_online: true, last_active: new Date().toISOString() })
          .eq('user_id', user.id);

        console.log('✅ Using existing profile:', updatedProfile);
        setProfile(updatedProfile);
        return updatedProfile;
      }

      // Only create if profile doesn't exist (no rows returned)
      if (fetchError?.code === 'PGRST116' && mountedRef.current) {
        console.log('📝 Creating new profile...');
        
        const newProfile: InsertProfile = {
          id: user.id,
          user_id: user.id,
          username: user.user_metadata?.preferred_username ||
                   user.user_metadata?.name?.toLowerCase().replace(/\s+/g, '') ||
                   user.email?.split('@')[0] ||
                   `user_${user.id.slice(0, 8)}`,
          full_name: user.user_metadata?.full_name || 
                    user.user_metadata?.name || 
                    'New User',
          avatar_url: user.user_metadata?.avatar_url || null,
          bio: null,
          location: null,
          city: null,
          created_at: new Date().toISOString(),
          updated_at: null,
          vibe_score: 0,
          is_online: true,
          last_active: new Date().toISOString()
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select(`
            id,
            user_id,
            username,
            full_name,
            bio,
            avatar_url,
            vibe_score,
            is_online,
            created_at,
            updated_at,
            location,
            city,
            last_active
          `)
          .single();

        if (createError) {
          console.error('❌ Error creating profile:', createError);
          throw createError;
        }

        if (mountedRef.current) {
          console.log('✅ Profile created successfully:', createdProfile);
          setProfile(createdProfile);
          return createdProfile;
        }
      } else if (fetchError) {
        console.error('❌ Error fetching profile:', fetchError);
        throw fetchError;
      }

      return null;
    } catch (error: any) {
      console.error('❌ Profile fetch/create failed:', error);
      if (mountedRef.current) {
        setError('Failed to load user profile. Please try again.');
      }
      return null;
    } finally {
      authProcessingRef.current = false;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      if (authInitialized || authProcessingRef.current) return;
      
      try {
        console.log('🔄 Initializing authentication...');
        setLoading(true);
        setError(null);
        authProcessingRef.current = true;

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          if (mountedRef.current) {
            setError('Authentication failed. Please try again.');
            setUser(null);
            setProfile(null);
          }
          return;
        }

        if (mountedRef.current) {
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('✅ User session found, fetching profile...');
            await fetchOrCreateProfile(session.user);
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        if (mountedRef.current) {
          setError('Failed to initialize authentication');
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setAuthInitialized(true);
          authProcessingRef.current = false;
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current || authProcessingRef.current) return;
        
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user && !user) {
          authProcessingRef.current = true;
          setUser(session.user);
          setError(null);
          await fetchOrCreateProfile(session.user);
          authProcessingRef.current = false;
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setProfile(null);
          setUser(null);
          if (!['/login', '/signup', '/'].includes(location.pathname)) {
            navigate('/');
          }
        }
      }
    );

    authSubscription = subscription;

    return () => {
      mountedRef.current = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array to prevent infinite loops

  const handleRetry = () => {
    setError(null);
    setAuthInitialized(false);
    setLoading(true);
    authProcessingRef.current = false;
  };

  if (loading || !authInitialized) {
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
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        path="/dashboard/*"
        element={user ? <MainDashboard user={user} /> : <LoginPage />}
      />
      <Route
        path="/*"
        element={!user ? <LandingPage /> : <MainDashboard user={user} />}
      />
    </Routes>
  );
};

const App: React.FC = () => (
  <AppContent />
);

export default App;