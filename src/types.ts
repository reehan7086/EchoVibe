// src/types.ts
export type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  location?: any;
  city?: string;
  vibe_score?: number;
  is_online?: boolean;
  last_active?: string;
  cards_generated?: number;
  cards_shared?: number;
  viral_score?: number;
  created_at: string;
  updated_at: string;
}

export interface VibeEcho {
  id: string;
  user_id: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  mood: string;
  activity?: string;
  location?: any;
  city?: string;
  duration?: number;
  expires_at?: string;
  likes_count?: number;
  responses_count?: number;
  is_active?: boolean;
  created_at: string;
  profile_id?: string;
  vibe_card_id?: string;
  card_shares?: number;
  profiles?: Profile;
  user_has_liked?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  post_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  category: string;
  location_based?: boolean;
  location?: any;
  member_count: number;
  is_active?: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  topic: string;
  content: string;
  extension: string;
  message_type?: string;
  payload?: any;
  event?: string;
  media_url?: string;
  read_at?: string;
  private?: boolean;
  created_at: string;
  updated_at: string;
  inserted_at: string;
}

export interface Chat {
  id: string;
  match_id: string;
  user1_id: string;
  user2_id: string;
  last_message_at?: string;
  last_message?: string;
  is_active?: boolean;
  created_at: string;
  other_user?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  related_user_id?: string;
  type: 'like' | 'comment' | 'follow' | 'message';
  message: string;
  read: boolean;
  created_at: string;
}