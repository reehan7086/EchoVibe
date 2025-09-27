// src/types.ts - Fixed and simplified type definitions

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  bio?: string | null;
  avatar_url?: string | null;
  location?: string | null;
  city?: string | null;
  created_at: string;
  updated_at?: string | null;
  vibe_score: number;
  is_online: boolean;
  last_active?: string;
};

export type VibeEcho = {
  id: string;
  user_id: string;
  content: string;
  media_url?: string | null;
  media_type: string;
  mood: string;
  activity?: string | null;
  location?: any | null;
  city?: string | null;
  duration?: number | null;
  created_at: string;
  expires_at?: string;
  likes_count: number;
  responses_count: number;
  is_active: boolean;
  user_has_liked?: boolean;
  profiles?: Profile;
};

export type Comment = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
};

export type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  message_type?: string;
  media_url?: string | null;
  created_at: string;
  read_at?: string | null;
  profiles?: Profile;
};

export type Chat = {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  last_message?: string;
  last_message_at?: string;
  is_active?: boolean;
  other_user?: Profile;
};

export type Community = {
  id: string;
  name: string;
  description?: string | null;
  creator_id: string;
  category: string;
  member_count: number;
  created_at: string;
  is_active: boolean;
  is_member?: boolean;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  content: string;
  is_read: boolean;
  created_at: string;
  related_user_id?: string | null;
  related_user_profile?: Profile;
};

// Database types for Supabase
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      vibe_echoes: {
        Row: VibeEcho;
        Insert: Partial<VibeEcho> & { user_id: string; content: string; mood: string };
        Update: Partial<VibeEcho>;
      };
      messages: {
        Row: Message;
        Insert: Partial<Message> & { chat_id: string; sender_id: string; content: string };
        Update: Partial<Message>;
      };
      chats: {
        Row: Chat;
        Insert: Partial<Chat> & { user1_id: string; user2_id: string };
        Update: Partial<Chat>;
      };
      communities: {
        Row: Community;
        Insert: Partial<Community> & { name: string; creator_id: string; category: string };
        Update: Partial<Community>;
      };
      notifications: {
        Row: Notification;
        Insert: Partial<Notification> & { user_id: string; type: string; content: string };
        Update: Partial<Notification>;
      };
      likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
        };
        Update: Partial<{
          post_id: string;
          user_id: string;
        }>;
      };
      community_members: {
        Row: {
          id: string;
          community_id: string;
          user_id: string;
          joined_at: string;
          role?: string;
        };
        Insert: {
          community_id: string;
          user_id: string;
          role?: string;
        };
        Update: Partial<{
          role: string;
        }>;
      };
    };
  };
};