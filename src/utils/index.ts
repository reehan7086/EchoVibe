// src/utils/index.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Date formatting utility
export const formatDate = (date: string) => {
  const now = new Date();
  const postDate = new Date(date);
  const diffInHours = (now.getTime() - postDate.getTime()) / (1000 * 3600);

  if (diffInHours < 1) return `${Math.floor(diffInHours * 60)}m`;
  if (diffInHours < 24) return `${Math.floor(diffInHours)}h`;
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`;
  return postDate.toLocaleDateString();
};

// Get current user utility
export const getCurrentUser = async () => {
  try {
    // First try to get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return null;
    }
    
    if (!session?.user) {
      console.warn('No active session found');
      return null;
    }
    
    return session.user;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
};