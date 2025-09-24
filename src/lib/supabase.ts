import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Use environment variables only (remove hardcoded fallbacks for security)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be defined');
}

// Log environment status (only in development)
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Configuration:');
  console.log('URL:', supabaseUrl ? '✅' : '❌');
  console.log('Key:', supabaseAnonKey ? '✅' : '❌');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Test connection function
export const testConnection = async () => {
  try {
    const { error } = await supabase.from('profiles').select('count').limit(1).single();
    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Supabase connection error:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

// Helper functions for common operations
export const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  return data;
};

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
};

// Real-time helpers
export const subscribeToVibeEchoes = (callback: (payload: any) => void) => {
  return supabase
    .channel('vibe_echoes_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'vibe_echoes' }, 
      callback
    )
    .subscribe();
};

export const subscribeToMessages = (chatId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`messages_${chatId}`)
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, 
      callback
    )
    .subscribe();
};

export const subscribeToMatches = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`matches_${userId}`)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'vibe_matches', filter: `user1_id=eq.${userId}` }, 
      callback
    )
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'vibe_matches', filter: `user2_id=eq.${userId}` }, 
      callback
    )
    .subscribe();
};