export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string;
          bio: string | null;
          avatar_url: string | null;
          location: any | null; // PostGIS POINT type
          city: string | null;
          created_at: string;
          updated_at: string;
          vibe_score: number;
          is_online: boolean;
          last_active: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name: string;
          bio?: string | null;
          avatar_url?: string | null;
          location?: any | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
          vibe_score?: number;
          is_online?: boolean;
          last_active?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          location?: any | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
          vibe_score?: number;
          is_online?: boolean;
          last_active?: string;
        };
      };
      vibe_echoes: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          media_url: string | null;
          media_type: string;
          mood: string;
          activity: string | null;
          location: any | null; // PostGIS POINT type
          city: string | null;
          duration: number | null;
          created_at: string;
          expires_at: string;
          likes_count: number;
          responses_count: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          media_url?: string | null;
          media_type?: string;
          mood: string;
          activity?: string | null;
          location?: any | null;
          city?: string | null;
          duration?: number | null;
          created_at?: string;
          expires_at?: string;
          likes_count?: number;
          responses_count?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          media_url?: string | null;
          media_type?: string;
          mood?: string;
          activity?: string | null;
          location?: any | null;
          city?: string | null;
          duration?: number | null;
          created_at?: string;
          expires_at?: string;
          likes_count?: number;
          responses_count?: number;
          is_active?: boolean;
        };
      };
      vibe_matches: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          compatibility_score: number;
          matched_at: string;
          chat_started: boolean;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user1_id: string;
          user2_id: string;
          compatibility_score: number;
          matched_at?: string;
          chat_started?: boolean;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user1_id?: string;
          user2_id?: string;
          compatibility_score?: number;
          matched_at?: string;
          chat_started?: boolean;
          is_active?: boolean;
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
          message_type?: string;
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
      chats: {
        Row: {
          id: string;
          match_id: string;
          user1_id: string;
          user2_id: string;
          created_at: string;
          last_message_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          match_id: string;
          user1_id: string;
          user2_id: string;
          created_at?: string;
          last_message_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          match_id?: string;
          user1_id?: string;
          user2_id?: string;
          created_at?: string;
          last_message_at?: string;
          is_active?: boolean;
        };
      };
      communities: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          creator_id: string;
          category: string;
          location_based: boolean;
          location: any | null;
          radius: number | null;
          member_count: number;
          created_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          creator_id: string;
          category: string;
          location_based?: boolean;
          location?: any | null;
          radius?: number | null;
          member_count?: number;
          created_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          creator_id?: string;
          category?: string;
          location_based?: boolean;
          location?: any | null;
          radius?: number | null;
          member_count?: number;
          created_at?: string;
          is_active?: boolean;
        };
      };
      vibe_likes: {
        Row: {
          id: string;
          vibe_echo_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          vibe_echo_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          vibe_echo_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          content: string;
          is_read: boolean;
          created_at: string;
          related_user_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          content: string;
          is_read?: boolean;
          created_at?: string;
          related_user_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          content?: string;
          is_read?: boolean;
          created_at?: string;
          related_user_id?: string | null;
        };
      };
      community_members: {
        Row: {
          id: string;
          community_id: string;
          user_id: string;
          joined_at: string;
          role: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          user_id: string;
          joined_at?: string;
          role?: string;
        };
        Update: {
          id?: string;
          community_id?: string;
          user_id?: string;
          joined_at?: string;
          role?: string;
        };
      };
    };
  };
};