-- EchoVibe Database Schema
-- This file contains the complete database schema for EchoVibe
-- Execute these commands in your Supabase SQL editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  location POINT, -- PostGIS point for lat/lng
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  vibe_score INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT FALSE,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vibe echoes table
CREATE TABLE public.vibe_echoes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('text', 'video', 'audio', 'image')) DEFAULT 'text',
  mood TEXT NOT NULL,
  activity TEXT,
  location POINT,
  city TEXT,
  duration INTEGER, -- for video/audio in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  likes_count INTEGER DEFAULT 0,
  responses_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Vibe matches table
CREATE TABLE public.vibe_matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  compatibility_score FLOAT NOT NULL,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  chat_started BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user1_id, user2_id)
);

-- Chats table
CREATE TABLE public.chats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES public.vibe_matches(id) ON DELETE CASCADE NOT NULL,
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Messages table
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'audio', 'video')) DEFAULT 'text',
  media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Communities table
CREATE TABLE public.communities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  location_based BOOLEAN DEFAULT FALSE,
  location POINT,
  radius INTEGER, -- in km
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Community members table
CREATE TABLE public.community_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  UNIQUE(community_id, user_id)
);

-- Vibe likes table
CREATE TABLE public.vibe_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vibe_echo_id UUID REFERENCES public.vibe_echoes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vibe_echo_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_profiles_location ON public.profiles USING GIST(location);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_is_online ON public.profiles(is_online);

CREATE INDEX idx_vibe_echoes_user_id ON public.vibe_echoes(user_id);
CREATE INDEX idx_vibe_echoes_location ON public.vibe_echoes USING GIST(location);
CREATE INDEX idx_vibe_echoes_created_at ON public.vibe_echoes(created_at);
CREATE INDEX idx_vibe_echoes_is_active ON public.vibe_echoes(is_active);
CREATE INDEX idx_vibe_echoes_expires_at ON public.vibe_echoes(expires_at);

CREATE INDEX idx_vibe_matches_user1_id ON public.vibe_matches(user1_id);
CREATE INDEX idx_vibe_matches_user2_id ON public.vibe_matches(user2_id);
CREATE INDEX idx_vibe_matches_is_active ON public.vibe_matches(is_active);

CREATE INDEX idx_chats_match_id ON public.chats(match_id);
CREATE INDEX idx_chats_user1_id ON public.chats(user1_id);
CREATE INDEX idx_chats_user2_id ON public.chats(user2_id);

CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_echoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Vibe echoes policies
CREATE POLICY "Vibe echoes are viewable by everyone" ON public.vibe_echoes
  FOR SELECT USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Users can insert their own vibe echoes" ON public.vibe_echoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vibe echoes" ON public.vibe_echoes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vibe echoes" ON public.vibe_echoes
  FOR DELETE USING (auth.uid() = user_id);

-- Vibe matches policies
CREATE POLICY "Users can view their own matches" ON public.vibe_matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can insert matches" ON public.vibe_matches
  FOR INSERT WITH CHECK (TRUE);

-- Chats policies
CREATE POLICY "Users can view their own chats" ON public.chats
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create chats from their matches" ON public.chats
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages policies
CREATE POLICY "Users can view messages from their chats" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages to their chats" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = chat_id 
      AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())
    ) AND sender_id = auth.uid()
  );

-- Communities policies
CREATE POLICY "Communities are viewable by everyone" ON public.communities
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can create communities" ON public.communities
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their communities" ON public.communities
  FOR UPDATE USING (auth.uid() = creator_id);

-- Community members policies
CREATE POLICY "Users can view community members" ON public.community_members
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can join communities" ON public.community_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities" ON public.community_members
  FOR DELETE USING (auth.uid() = user_id);

-- Vibe likes policies
CREATE POLICY "Users can view vibe likes" ON public.vibe_likes
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can like vibe echoes" ON public.vibe_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike vibe echoes" ON public.vibe_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Functions

-- Function to update profiles updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to update vibe echo likes count
CREATE OR REPLACE FUNCTION public.update_vibe_echo_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.vibe_echoes 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.vibe_echo_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.vibe_echoes 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.vibe_echo_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vibe likes count
CREATE TRIGGER update_vibe_echo_likes_count_trigger
  AFTER INSERT OR DELETE ON public.vibe_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vibe_echo_likes_count();

-- Function to update community member count
CREATE OR REPLACE FUNCTION public.update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities 
    SET member_count = member_count + 1 
    WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities 
    SET member_count = member_count - 1 
    WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for community member count
CREATE TRIGGER update_community_member_count_trigger
  AFTER INSERT OR DELETE ON public.community_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_member_count();