-- Complete Fixed SQL Schema for EchoVibe
-- This enables direct joins between vibe_echoes and profiles

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  location JSONB,
  vibe_score INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT false,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create vibe_echoes table with FIXED relationships
CREATE TABLE public.vibe_echoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NEW: Direct link to profiles
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('text', 'video', 'audio', 'image')) DEFAULT 'text',
  mood TEXT NOT NULL,
  activity TEXT,
  location JSONB,
  duration INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE,
  likes_count INTEGER DEFAULT 0,
  responses_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create vibe_matches table
CREATE TABLE public.vibe_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  compatibility_score DECIMAL(3,2) DEFAULT 0.0,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  chat_started BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user1_id, user2_id)
);

-- Create chats table
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.vibe_matches(id) ON DELETE CASCADE,
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'audio', 'video')) DEFAULT 'text',
  media_url TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create communities table
CREATE TABLE public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  location_based BOOLEAN DEFAULT false,
  location JSONB,
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create vibe_likes table (missing from original)
CREATE TABLE public.vibe_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vibe_echo_id UUID NOT NULL REFERENCES public.vibe_echoes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(vibe_echo_id, user_id)
);

-- Create community_members table (missing from original)
CREATE TABLE public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vibe_echoes_user_id ON public.vibe_echoes(user_id);
CREATE INDEX IF NOT EXISTS idx_vibe_echoes_profile_id ON public.vibe_echoes(profile_id);
CREATE INDEX IF NOT EXISTS idx_vibe_echoes_created_at ON public.vibe_echoes(created_at);
CREATE INDEX IF NOT EXISTS idx_vibe_echoes_is_active ON public.vibe_echoes(is_active);
CREATE INDEX IF NOT EXISTS idx_vibe_matches_user1_id ON public.vibe_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_vibe_matches_user2_id ON public.vibe_matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_echoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for vibe_echoes
CREATE POLICY "Vibe echoes are viewable by everyone"
  ON public.vibe_echoes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can create their own vibe echoes"
  ON public.vibe_echoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vibe echoes"
  ON public.vibe_echoes FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for matches
CREATE POLICY "Users can view their own matches"
  ON public.vibe_matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create matches"
  ON public.vibe_matches FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for chats
CREATE POLICY "Users can view their own chats"
  ON public.chats FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create chats from their matches"
  ON public.chats FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their chats"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their chats"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())
    )
  );

-- RLS Policies for communities
CREATE POLICY "Communities are viewable by everyone"
  ON public.communities FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can create communities"
  ON public.communities FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their communities"
  ON public.communities FOR UPDATE
  USING (auth.uid() = creator_id);

-- RLS Policies for vibe_likes
CREATE POLICY "Users can view all vibe likes"
  ON public.vibe_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like vibe echoes"
  ON public.vibe_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes"
  ON public.vibe_likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for community_members
CREATE POLICY "Community members are viewable by everyone"
  ON public.community_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join communities"
  ON public.community_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities"
  ON public.community_members FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- NEW: Function to automatically populate profile_id in vibe_echoes
CREATE OR REPLACE FUNCTION public.populate_vibe_echo_profile_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Find the profile_id for the user_id
  SELECT id INTO NEW.profile_id 
  FROM public.profiles 
  WHERE user_id = NEW.user_id;
  
  -- If no profile found, this will be null (which is fine)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- NEW: Trigger to automatically set profile_id when creating vibe echoes
CREATE TRIGGER populate_profile_id_on_vibe_echo
  BEFORE INSERT ON public.vibe_echoes
  FOR EACH ROW EXECUTE FUNCTION public.populate_vibe_echo_profile_id();

-- NEW: Function to update likes count when vibe_likes changes
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
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = OLD.vibe_echo_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- NEW: Triggers for likes count
CREATE TRIGGER update_likes_count_on_insert
  AFTER INSERT ON public.vibe_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_vibe_echo_likes_count();

CREATE TRIGGER update_likes_count_on_delete
  AFTER DELETE ON public.vibe_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_vibe_echo_likes_count();

-- NEW: Function to update community member count
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
    SET member_count = GREATEST(member_count - 1, 0) 
    WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- NEW: Triggers for community member count
CREATE TRIGGER update_member_count_on_join
  AFTER INSERT ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.update_community_member_count();

CREATE TRIGGER update_member_count_on_leave
  AFTER DELETE ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.update_community_member_count();

-- NEW: Create a view for easy querying of vibe echoes with profiles
CREATE OR REPLACE VIEW public.vibe_echoes_with_profiles AS
SELECT 
  ve.*,
  p.username,
  p.full_name,
  p.avatar_url,
  p.bio,
  p.vibe_score,
  p.is_online
FROM public.vibe_echoes ve
LEFT JOIN public.profiles p ON ve.profile_id = p.id
WHERE ve.is_active = true;

-- Grant access to the view
GRANT SELECT ON public.vibe_echoes_with_profiles TO authenticated;
GRANT SELECT ON public.vibe_echoes_with_profiles TO anon;

-- NEW: Function for efficient vibe echo queries with profiles
CREATE OR REPLACE FUNCTION public.get_vibe_echoes_with_profiles(
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  profile_id UUID,
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  mood TEXT,
  activity TEXT,
  location JSONB,
  duration INTEGER,
  expires_at TIMESTAMPTZ,
  likes_count INTEGER,
  responses_count INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  vibe_score INTEGER,
  is_online BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ve.id,
    ve.user_id,
    ve.profile_id,
    ve.content,
    ve.media_url,
    ve.media_type,
    ve.mood,
    ve.activity,
    ve.location,
    ve.duration,
    ve.expires_at,
    ve.likes_count,
    ve.responses_count,
    ve.is_active,
    ve.created_at,
    p.username,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.vibe_score,
    p.is_online
  FROM public.vibe_echoes ve
  LEFT JOIN public.profiles p ON ve.profile_id = p.id
  WHERE ve.is_active = true
  ORDER BY ve.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_vibe_echoes_with_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_vibe_echoes_with_profiles TO anon;