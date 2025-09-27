// src/types.ts - Fully aligned with Supabase schema

export type Profile = {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  bio?: string | null;
  avatar_url?: string | null;
  location?: any | null;
  city?: string | null;
  created_at: string;
  updated_at?: string | null;
  vibe_score: number;
  is_online: boolean;
  last_active?: string;

  // Added fields
  cards_generated?: number;
  cards_shared?: number;
  viral_score?: string | number;
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
  expires_at?: string | null;
  likes_count: number;
  responses_count: number;
  is_active: boolean;
  profile_id?: string | null;
  user_has_liked?: boolean;
  profiles?: Profile;

  // New fields
  vibe_card_id?: string;
  card_shares?: number;
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
  match_id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  last_message?: string | null;
  last_message_at?: string | null;
  is_active?: boolean;
  other_user?: Profile;
};

export type Community = {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  category: string;
  location_based?: boolean;
  location?: any | null;
  member_count: number;
  created_at: string;
  is_active: boolean;
  is_member?: boolean;
};

export type Notification = {
  id: string;
  user_id: string;
  related_user_id?: string | null;
  type: string;
  message?: string | null;
  content?: string;
  created_at: string;
  read: boolean;
  is_read?: boolean;
  related_user_profile?: Profile;
};

export type Like = {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
};

export type Follow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type VibeMatch = {
  id: string;
  user1_id: string;
  user2_id: string;
  compatibility_score: string | number;
  matched_at: string;
  chat_started: boolean;
  is_active: boolean;
};

export type CommunityMember = {
  id: string;
  community_id: string;
  user_id: string;
  created_at: string;
};

export type CommunityMembership = {
  id: string;
  user_id: string;
  community_id: string;
  joined_at: string;
  role: string;
};

export type Post = {
  id: string;
  user_id: string;
  content?: string | null;
  created_at: string;
  updated_at: string;
};

export type VibeCard = {
  id: string;
  user_id: string;
  post_id: string;
  card_data: any; // store raw JSON
  template_theme: 'cosmic' | 'nature' | 'retro' | 'minimal';
  generated_at: string;
  shared_count: number;
  view_count: number;
  is_active: boolean;
};

export type CardShare = {
  id: string;
  card_id: string;
  user_id: string;
  platform: string;
  shared_at: string;
};

// Database types
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { user_id: string; username: string; full_name: string }; Update: Partial<Profile>; };
      vibe_echoes: { Row: VibeEcho; Insert: Partial<VibeEcho> & { user_id: string; content: string; mood: string }; Update: Partial<VibeEcho>; };
      messages: { Row: Message; Insert: Partial<Message> & { chat_id: string; sender_id: string; content: string }; Update: Partial<Message>; };
      chats: { Row: Chat; Insert: Partial<Chat> & { match_id: string; user1_id: string; user2_id: string }; Update: Partial<Chat>; };
      communities: { Row: Community; Insert: Partial<Community> & { name: string; description: string; creator_id: string; category: string }; Update: Partial<Community>; };
      notifications: { Row: Notification; Insert: Partial<Notification> & { user_id: string; type: string }; Update: Partial<Notification>; };
      likes: { Row: Like; Insert: Partial<Like> & { user_id: string; post_id: string }; Update: Partial<Like>; };
      follows: { Row: Follow; Insert: Partial<Follow> & { follower_id: string; following_id: string }; Update: Partial<Follow>; };
      vibe_matches: { Row: VibeMatch; Insert: Partial<VibeMatch> & { user1_id: string; user2_id: string }; Update: Partial<VibeMatch>; };
      community_members: { Row: CommunityMember; Insert: Partial<CommunityMember> & { community_id: string; user_id: string }; Update: Partial<CommunityMember>; };
      community_memberships: { Row: CommunityMembership; Insert: Partial<CommunityMembership> & { user_id: string; community_id: string }; Update: Partial<CommunityMembership>; };
      posts: { Row: Post; Insert: Partial<Post> & { user_id: string }; Update: Partial<Post>; };
    };
  };
};
