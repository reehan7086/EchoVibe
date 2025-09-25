import type { Database } from '@/supabase/types';

export interface VibeEcho {
  id: string;
  content: string;
  mood: string;
  activity?: string;
  created_at: string;
  likes_count: number;
  responses_count: number;
  media_url?: string;
  media_type?: string;
  user_id?: string;
  profiles?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
    vibe_score?: number;
  } | null;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  formatted?: string;
  city?: string;
  country?: string;
}

export type VibeEchoChangePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Database['public']['Tables']['vibe_echoes']['Row'];
  old?: Database['public']['Tables']['vibe_echoes']['Row'];
};

export type MessageChangePayload = {
  eventType: 'INSERT';
  new: Database['public']['Tables']['messages']['Row'];
};

export type MatchChangePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Database['public']['Tables']['vibe_matches']['Row'];
  old?: Database['public']['Tables']['vibe_matches']['Row'];
};