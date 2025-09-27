// src/types.ts - Updated for Map-based SparkVibe

// ------------------
// Auth/User - Use Supabase User type directly
// ------------------
export type { User } from '@supabase/supabase-js';

// ------------------
// Profile (for map users)
// ------------------
export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  bio?: string;
  website?: string;
  location?: string; // JSON string of {lat, lng} or undefined
  city?: string;
  avatar_url?: string;
  is_online?: boolean;
  mood?: string; // Current vibe/mood
  vibe_score?: number;
  last_active?: string;
  cards_generated?: number;
  cards_shared?: number;
  viral_score?: number;
  created_at?: string;
  updated_at?: string;
}

// ------------------
// Connection between users (for matches)
// ------------------
export interface Connection {
  id: string;
  user1_id: string;
  user2_id: string;
  status: "pending" | "connected" | "blocked";
  created_at?: string;
  updated_at?: string;
}

// ------------------
// Vibe Match (for algorithm matching)
// ------------------
export interface VibeMatch {
  id: string;
  user1_id: string;
  user2_id: string;
  compatibility_score: number;
  chat_started: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// ------------------
// Chat/Conversation
// ------------------
export interface Chat {
  id: string;
  match_id: string;
  user1_id: string;
  user2_id: string;
  is_active: boolean;
  last_message?: string;
  last_message_at?: string;
  created_at: string;
  other_user?: Profile; // Populated based on current user
}

// ------------------
// Messages (for chat)
// ------------------
export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  receiver_id: string;
  topic: string;
  content: string;
  extension: string;
  message_type: 'text' | 'image' | 'video' | 'audio';
  private: boolean;
  created_at: string;
  profiles?: Profile; // Populated from join
}

// ------------------
// Community (for shared interests)
// ------------------
export interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  creator_id?: string;
  member_count: number;
  is_active: boolean;
  created_at: string;
  is_member?: boolean; // Populated based on current user
}

// ------------------
// Community Member
// ------------------
export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: 'member' | 'moderator' | 'admin';
  joined_at: string;
}

// ------------------
// Location types for map
// ------------------
export interface LocationCoords {
  lat: number;
  lng: number;
}

// Map user with parsed location coordinates
export interface MapUser {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  bio?: string;
  website?: string;
  location: LocationCoords; // Actual coordinates for map users
  city?: string;
  avatar_url?: string;
  is_online?: boolean;
  mood?: string;
  vibe_score?: number;
  last_active?: string;
  cards_generated?: number;
  cards_shared?: number;
  viral_score?: number;
  created_at?: string;
  updated_at?: string;
  distance?: number; // Distance from current user
}

// ------------------
// Notification types
// ------------------
export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'match' | 'message';
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  related_user_id?: string;
  related_user_profile?: Profile;
}

// ------------------
// Vibe Echo (deprecated but keeping for compatibility)
// ------------------
export interface VibeEcho {
  id: string;
  user_id: string;
  content: string;
  mood: string;
  media_url?: string;
  media_type?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  profiles?: Profile;
}

// ------------------
// Comment (deprecated but keeping for compatibility)
// ------------------
export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}