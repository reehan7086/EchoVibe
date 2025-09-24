// src/utils/supabaseDebug.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// 1. Runtime Environment Variable Check for DigitalOcean
export const checkDeploymentEnv = () => {
  console.log('=== DigitalOcean Environment Check ===');
  console.log('NODE_ENV:', import.meta.env.NODE_ENV);
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  
  // Log first few characters to verify it's loading
  if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.log('Key prefix:', import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 10));
  } else {
    console.error('❌ VITE_SUPABASE_ANON_KEY is missing!');
  }
  
  if (!import.meta.env.VITE_SUPABASE_URL) {
    console.error('❌ VITE_SUPABASE_URL is missing!');
  }
};

// 2. Fallback Supabase Client with Error Handling
export const createSupabaseClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rtrwrjzatvdyclntelca.supabase.co';
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0cndyanphdHZkeWNsbnRlbGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NjM2NjMsImV4cCI6MjA3NDAzOTY2M30.r2w14sflhDGf9GGuTqeiLG34bQ0JTpVuLD7i1r-Xlx4';
  
  console.log('Creating Supabase client with:');
  console.log('URL:', supabaseUrl);
  console.log('Key prefix:', supabaseKey.substring(0, 20));
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    throw new Error('Missing Supabase environment variables');
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
};

// 3. Test Connection Function for DigitalOcean
export const testSupabaseConnection = async () => {
  try {
    checkDeploymentEnv();
    
    const supabase = createSupabaseClient();
    
    console.log('🔄 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Supabase connection successful!');
    return { success: true, data };
    
  } catch (error: any) {
    console.error('❌ Connection test failed:', error);
    return { success: false, error: error.message };
  }
};

// 4. Production-Ready Vibe Echoes Fetch
export const fetchVibeEchoesProd = async (): Promise<any[]> => {
  try {
    const supabase = createSupabaseClient();
    
    console.log('🔄 Fetching vibe echoes in production...');
    
    // Try without join first to avoid relation issues
    const { data, error } = await supabase
      .from('vibe_echoes')
      .select(`
        id,
        content,
        mood,
        activity,
        created_at,
        likes_count,
        responses_count,
        media_url,
        media_type,
        user_id
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('❌ Error fetching vibe echoes:', error);
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    // If we got vibe echoes, try to fetch associated profiles separately
    if (data && data.length > 0) {
      try {
        const userIds = data.map((vibe: any) => vibe.user_id).filter(Boolean);
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, username, full_name, avatar_url, vibe_score')
            .in('user_id', userIds);

          // Merge profiles with vibe echoes
          const enrichedData = data.map((vibe: any) => ({
            ...vibe,
            profiles: profilesData?.find((profile: any) => profile.user_id === vibe.user_id) || null
          }));

          console.log('✅ Successfully fetched', enrichedData.length, 'vibe echoes with profiles');
          return enrichedData;
        }
      } catch (profileError) {
        console.log('⚠️ Failed to fetch profiles, returning vibe echoes without profiles');
      }
    }

    console.log('✅ Successfully fetched', data?.length || 0, 'vibe echoes');
    return data || [];
    
  } catch (error: any) {
    console.error('❌ fetchVibeEchoesProd failed:', error);
    throw error;
  }
};

// 5. Direct API Call with Proper Error Handling (Alternative Method)
export const fetchVibeEchoesDirectAPI = async (): Promise<any[]> => {
  const url = import.meta.env.VITE_SUPABASE_URL || 'https://rtrwrjzatvdyclntelca.supabase.co';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0cndyanphdHZkeWNsbnRlbGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NjM2NjMsImV4cCI6MjA3NDAzOTY2M30.r2w14sflhDGf9GGuTqeiLG34bQ0JTpVuLD7i1r-Xlx4';
  
  // First try simple query without join
  const apiUrl = `${url}/rest/v1/vibe_echoes?select=id,content,mood,activity,created_at,likes_count,responses_count,media_url,media_type,user_id&is_active=eq.true&order=created_at.desc&limit=20`;
  
  try {
    console.log('🔄 Making direct API call to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`API call failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Direct API call successful, got', data?.length || 0, 'records');
    
    // Try to fetch profiles separately if we got vibe echoes
    if (data && data.length > 0) {
      try {
        const userIds = data.map((vibe: any) => vibe.user_id).filter(Boolean);
        if (userIds.length > 0) {
          const profilesUrl = `${url}/rest/v1/profiles?select=user_id,username,full_name,avatar_url,vibe_score&user_id=in.(${userIds.join(',')})`;
          
          const profilesResponse = await fetch(profilesUrl, {
            headers: {
              'apikey': key,
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (profilesResponse.ok) {
            const profilesData = await profilesResponse.json();
            // Merge profiles with vibe echoes
            const enrichedData = data.map((vibe: any) => ({
              ...vibe,
              profiles: profilesData?.find((profile: any) => profile.user_id === vibe.user_id) || null
            }));
            return enrichedData;
          }
        }
      } catch (profileError) {
        console.log('⚠️ Failed to fetch profiles via API, returning vibe echoes without profiles');
      }
    }
    
    return data || [];
    
  } catch (error: any) {
    console.error('❌ Direct API call failed:', error);
    throw error;
  }
};