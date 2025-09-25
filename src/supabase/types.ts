export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chats: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_message_at: string | null
          match_id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          match_id: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          match_id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "vibe_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          category: string
          created_at: string | null
          creator_id: string
          description: string
          id: string
          is_active: boolean | null
          location: Json | null
          location_based: boolean | null
          member_count: number | null
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          creator_id: string
          description: string
          id?: string
          is_active?: boolean | null
          location?: Json | null
          location_based?: boolean | null
          member_count?: number | null
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          creator_id?: string
          description?: string
          id?: string
          is_active?: boolean | null
          location?: Json | null
          location_based?: boolean | null
          member_count?: number | null
          name?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string | null
          id: string
          media_url: string | null
          message_type: string | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string | null
          id?: string
          media_url?: string | null
          message_type?: string | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string | null
          id?: string
          media_url?: string | null
          message_type?: string | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          related_user_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          related_user_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          related_user_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          follower_count: number | null
          following_count: number | null
          full_name: string
          id: string
          is_online: boolean | null
          is_private: boolean | null
          last_active: string | null
          location: Json | null
          updated_at: string | null
          user_id: string
          username: string
          vibe_score: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          follower_count?: number | null
          following_count?: number | null
          full_name: string
          id?: string
          is_online?: boolean | null
          is_private?: boolean | null
          last_active?: string | null
          location?: Json | null
          updated_at?: string | null
          user_id: string
          username: string
          vibe_score?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          follower_count?: number | null
          following_count?: number | null
          full_name?: string
          id?: string
          is_online?: boolean | null
          is_private?: boolean | null
          last_active?: string | null
          location?: Json | null
          updated_at?: string | null
          user_id?: string
          username?: string
          vibe_score?: number | null
        }
        Relationships: []
      }
      vibe_echoes: {
        Row: {
          activity: string | null
          content: string
          created_at: string | null
          duration: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          likes_count: number | null
          location: Json | null
          media_type: string | null
          media_url: string | null
          mood: string
          profile_id: string | null
          responses_count: number | null
          user_id: string
        }
        Insert: {
          activity?: string | null
          content: string
          created_at?: string | null
          duration?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          likes_count?: number | null
          location?: Json | null
          media_type?: string | null
          media_url?: string | null
          mood: string
          profile_id?: string | null
          responses_count?: number | null
          user_id: string
        }
        Update: {
          activity?: string | null
          content?: string
          created_at?: string | null
          duration?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          likes_count?: number | null
          location?: Json | null
          media_type?: string | null
          media_url?: string | null
          mood?: string
          profile_id?: string | null
          responses_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vibe_echoes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vibe_likes: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          vibe_echo_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          vibe_echo_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          vibe_echo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vibe_likes_vibe_echo_id_fkey"
            columns: ["vibe_echo_id"]
            isOneToOne: false
            referencedRelation: "vibe_echoes"
            referencedColumns: ["id"]
          },
        ]
      }
      vibe_matches: {
        Row: {
          chat_started: boolean | null
          compatibility_score: number | null
          id: string
          is_active: boolean | null
          matched_at: string | null
          user1_id: string
          user2_id: string
        }
        Insert: {
          chat_started?: boolean | null
          compatibility_score?: number | null
          id?: string
          is_active?: boolean | null
          matched_at?: string | null
          user1_id: string
          user2_id: string
        }
        Update: {
          chat_started?: boolean | null
          compatibility_score?: number | null
          id?: string
          is_active?: boolean | null
          matched_at?: string | null
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      vibe_echoes_with_profiles: {
        Row: {
          activity: string | null
          avatar_url: string | null
          bio: string | null
          content: string
          created_at: string | null
          duration: number | null
          expires_at: string | null
          full_name: string | null
          id: string | null
          is_active: boolean | null
          is_online: boolean | null
          likes_count: number | null
          location: Json | null
          media_type: string | null
          media_url: string | null
          mood: string | null
          profile_id: string | null
          responses_count: number | null
          user_id: string | null
          username: string | null
          vibe_score: number | null
        }
      }
    }
    Functions: {
      get_vibe_echoes_with_profiles: {
        Args: {
          limit_count?: number
          offset_count?: number
        }
        Returns: {
          activity: string | null
          avatar_url: string | null
          bio: string | null
          content: string
          created_at: string
          duration: number | null
          expires_at: string | null
          full_name: string
          id: string
          is_active: boolean
          is_online: boolean | null
          likes_count: number
          location: Json | null
          media_type: string | null
          media_url: string | null
          mood: string
          profile_id: string | null
          responses_count: number
          user_id: string
          username: string
          vibe_score: number | null
        }[]
      }
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      populate_vibe_echo_profile_id: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_community_member_count: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_updated_at_column: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_vibe_echo_likes_count: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never