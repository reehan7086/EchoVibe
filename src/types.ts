// src/types.ts - Updated for Map-based SparkVibe (Schema-aligned)

// ------------------
// Auth/User - Use Supabase User type directly
// ------------------
export type { User } from '@supabase/supabase-js';

// ------------------
// Profile (aligned with Supabase schema)
// ------------------
export interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  
  // Location fields matching schema
  latitude?: number;
  longitude?: number;
  
  // Mood fields from schema
  current_mood?: string;
  mood_message?: string;
  
  // Other schema fields
  is_verified?: boolean;
  last_active?: string;
  vibe_score?: number;
  reputation_score?: number;
  privacy_level?: 'public' | 'private' | 'friends';
  privacy_settings?: {
    show_age?: boolean;
    show_bio?: boolean;
    show_full_name?: boolean;
    min_reputation_to_view?: number;
  };
  movement_speed?: number;
  created_at?: string;
  updated_at?: string;
}

// ------------------
// Enhanced Map User (extends Profile with calculated fields)
// ------------------
export interface MapUser extends Profile {
  // Calculated fields for map display
  distance?: number; // Distance from current user in km
  activity?: string; // Derived from current_mood
  status?: 'online' | 'away' | 'offline'; // Calculated from last_active
  gender?: 'male' | 'female'; // For pin display
  age?: number; // If available
  country?: string; // For display
  location_name?: string; // Human readable location
}

// ------------------
// Location types for map
// ------------------
export interface LocationCoords {
  lat: number;
  lng: number;
}

// ------------------
// Chat Room (matching schema)
// ------------------
export interface ChatRoom {
  id: string;
  name?: string;
  is_group: boolean;
  created_by?: string;
  created_at: string;
}

// ------------------
// Chat Participant (matching schema)
// ------------------
export interface ChatParticipant {
  id: string;
  chat_room_id: string;
  user_id: string;
  joined_at: string;
}

// ------------------
// Message (aligned with schema)
// ------------------
export interface Message {
  id: string;
  chat_room_id?: string;
  user_id?: string;
  content: string;
  message_type?: 'text' | 'image' | 'video' | 'audio';
  is_read?: boolean;
  created_at: string;
  profile?: Profile; // Populated from join
}

// ------------------
// Connection/Friend Request (matching schema)
// ------------------
export interface Connection {
  id: string;
  requester_id?: string;
  addressee_id?: string;
  status?: 'pending' | 'accepted' | 'blocked';
  created_at?: string;
  updated_at?: string;
}

// ------------------
// User Connection (matching schema)
// ------------------
export interface UserConnection {
  id: string;
  user_id?: string;
  connected_user_id?: string;
  status?: 'pending' | 'connected' | 'blocked';
  created_at?: string;
}

// ------------------
// Vibe Match (matching schema)
// ------------------
export interface VibeMatch {
  id: string;
  user1_id: string;
  user2_id: string;
  compatibility_score?: number;
  chat_started?: boolean;
  is_active?: boolean;
  matched_at?: string;
}

// ------------------
// Vibe Location (matching schema)
// ------------------
export interface VibeLocation {
  id: string;
  user_id?: string;
  latitude: number;
  longitude: number;
  message?: string;
  vibe_type?: string;
  is_public?: boolean;
  expires_at?: string;
  created_at?: string;
}

// ------------------
// Location History (matching schema)
// ------------------
export interface LocationHistory {
  id: string;
  user_id?: string;
  location_coordinates?: string; // Point type from PostGIS
  location_name?: string;
  accuracy_meters?: number;
  created_at?: string;
}

// ------------------
// Notification (matching schema)
// ------------------
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message?: string;
  read?: boolean;
  related_user_id?: string;
  created_at?: string;
  related_user_profile?: Profile;
}

// ------------------
// Community (matching schema)
// ------------------
export interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  creator_id?: string;
  member_count?: number;
  is_active?: boolean;
  location_based?: boolean;
  location?: any; // JSONB type
  created_at?: string;
}

// ------------------
// Community Membership (matching schema)
// ------------------
export interface CommunityMembership {
  id: string;
  user_id?: string;
  community_id?: string;
  role?: string;
  joined_at?: string;
}

// ------------------
// Vibe Echo (matching schema)
// ------------------
export interface VibeEcho {
  id: string;
  user_id: string;
  content: string;
  mood: string;
  activity?: string;
  city?: string;
  location?: any; // JSONB type
  media_url?: string;
  media_type?: string;
  duration?: number;
  is_active?: boolean;
  likes_count?: number;
  responses_count?: number;
  card_shares?: number;
  expires_at?: string;
  created_at?: string;
  vibe_card_id?: string;
  profile_id?: string;
  profile?: Profile; // Populated from join
}

// ------------------
// API Response Types
// ------------------
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count?: number;
  page?: number;
  limit?: number;
  has_more?: boolean;
}

// ------------------
// Map-specific types
// ------------------
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapSettings {
  radius: number; // in km
  show_offline_users: boolean;
  min_vibe_score: number;
  privacy_level: 'all' | 'verified_only' | 'friends_only';
}

// ------------------
// Real-time subscription types
// ------------------
export interface RealtimePayload<T> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: T;
  old?: T;
}

// ------------------
// Authentication state
// ------------------
export interface AuthState {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

// ------------------
// Chat state
// ------------------
export interface ChatState {
  active_chat: string | null;
  messages: Message[];
  participants: Profile[];
  loading: boolean;
  typing_users: string[];
}