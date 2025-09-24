export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      vibe_echoes: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          media_url: string | null;
          media_type: string | null;
          mood: string | null;
          likes_count: number;
          responses_count: number;
          created_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          media_url?: string | null;
          media_type?: string | null;
          mood?: string | null;
          likes_count?: number;
          responses_count?: number;
          created_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          media_url?: string | null;
          media_type?: string | null;
          mood?: string | null;
          likes_count?: number;
          responses_count?: number;
          created_at?: string;
          is_active?: boolean;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          full_name: string;
          avatar_url: string | null;
          vibe_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          full_name: string;
          avatar_url?: string | null;
          vibe_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string;
          full_name?: string;
          avatar_url?: string | null;
          vibe_score?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      vibe_matches: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          compatibility_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user1_id: string;
          user2_id: string;
          compatibility_score?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user1_id?: string;
          user2_id?: string;
          compatibility_score?: number;
          created_at?: string;
        };
      };
      chats: {
        Row: {
          id: string;
          match_id: string;
          user1_id: string;
          user2_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          user1_id: string;
          user2_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          user1_id?: string;
          user2_id?: string;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string;
          content: string;
          message_type: string;
          media_url: string | null;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          chat_id: string;
          sender_id: string;
          content: string;
          message_type: string;
          media_url?: string | null;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          chat_id?: string;
          sender_id?: string;
          content?: string;
          message_type?: string;
          media_url?: string | null;
          created_at?: string;
          read_at?: string | null;
        };
      };
      communities: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string;
          member_count: number;
          created_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category: string;
          member_count?: number;
          created_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string;
          member_count?: number;
          created_at?: string;
          is_active?: boolean;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}