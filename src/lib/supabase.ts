import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Profile {
  id: string
  username: string
  full_name: string
  bio?: string
  avatar_url?: string
  location?: {
    latitude: number
    longitude: number
    city?: string
  }
  created_at: string
  updated_at: string
  vibe_score: number
  is_online: boolean
  last_active: string
}

export interface VibeEcho {
  id: string
  user_id: string
  content: string
  media_url?: string
  media_type: 'text' | 'video' | 'audio' | 'image'
  mood: string
  activity?: string
  location?: {
    latitude: number
    longitude: number
    city?: string
  }
  duration?: number // for video/audio
  created_at: string
  expires_at?: string
  likes_count: number
  responses_count: number
  is_active: boolean
}

export interface VibeMatch {
  id: string
  user1_id: string
  user2_id: string
  compatibility_score: number
  matched_at: string
  chat_started: boolean
  is_active: boolean
}

export interface Chat {
  id: string
  match_id: string
  user1_id: string
  user2_id: string
  created_at: string
  last_message_at: string
  is_active: boolean
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'audio' | 'video'
  media_url?: string
  created_at: string
  read_at?: string
}

export interface Community {
  id: string
  name: string
  description: string
  creator_id: string
  category: string
  location_based: boolean
  location?: {
    latitude: number
    longitude: number
    radius: number // in km
  }
  member_count: number
  created_at: string
  is_active: boolean
}