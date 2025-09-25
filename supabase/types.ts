export type Database = {
  public: {
    Tables: {
      vibe_echoes: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          mood: string;
          media_type: string | null;
          media_url: string | null;
          likes_count: number;
          responses_count: number;
          created_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          mood: string;
          media_type?: string | null;
          media_url?: string | null;
          likes_count?: number;
          responses_count?: number;
          created_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          mood?: string;
          media_type?: string | null;
          media_url?: string | null;
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
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string;
          content: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          chat_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
          read_at?: string | null;
        };
      };
      communities: {
        Row: {
          id: string;
          name: string;
          description: string;
          category: string;
          member_count: number;
          created_at: string;
          is_active: boolean;
        };
      };
      chats: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          created_at: string;
        };
      };
    };
  };
};