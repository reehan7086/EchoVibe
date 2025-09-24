import { supabase } from '@/lib/supabase';

export const checkDeploymentEnv = () => {
  if (import.meta.env.DEV) {
    console.log('🔍 Deployment Environment Check:');
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌');
    console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌');
  }
};

export const testSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('profiles').select('count').limit(1).single();
    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
};

export const fetchVibeEchoesProd = async () => {
  try {
    const { data, error } = await supabase
      .from('vibe_echoes')
      .select('*, profiles(username, full_name, avatar_url, vibe_score)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error in fetchVibeEchoesProd:', error);
    throw error;
  }
};

export const fetchVibeEchoesDirectAPI = async () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or Anon Key');
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/vibe_echoes?select=*,profiles(username,full_name,avatar_url,vibe_score)&is_active=eq.true&order=created_at.desc`,
    {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Direct API fetch failed: ${error.message}`);
  }

  return response.json();
};