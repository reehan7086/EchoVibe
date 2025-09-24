-- Fix search path security issues and add new functions

-- Fixed handle_new_user function
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

-- Fixed update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

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

-- Grant execute permissions on the new function
GRANT EXECUTE ON FUNCTION public.get_vibe_echoes_with_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_vibe_echoes_with_profiles TO anon;

-- Create triggers for the new functions (if not already created)

-- Trigger to automatically set profile_id when creating vibe echoes
DROP TRIGGER IF EXISTS populate_profile_id_on_vibe_echo ON public.vibe_echoes;
CREATE TRIGGER populate_profile_id_on_vibe_echo
  BEFORE INSERT ON public.vibe_echoes
  FOR EACH ROW EXECUTE FUNCTION public.populate_vibe_echo_profile_id();

-- Triggers for likes count (only create if vibe_likes table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vibe_likes' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS update_likes_count_on_insert ON public.vibe_likes;
    CREATE TRIGGER update_likes_count_on_insert
      AFTER INSERT ON public.vibe_likes
      FOR EACH ROW EXECUTE FUNCTION public.update_vibe_echo_likes_count();

    DROP TRIGGER IF EXISTS update_likes_count_on_delete ON public.vibe_likes;
    CREATE TRIGGER update_likes_count_on_delete
      AFTER DELETE ON public.vibe_likes
      FOR EACH ROW EXECUTE FUNCTION public.update_vibe_echo_likes_count();
  END IF;
END $$;

-- Triggers for community member count (only create if community_members table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_members' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS update_member_count_on_join ON public.community_members;
    CREATE TRIGGER update_member_count_on_join
      AFTER INSERT ON public.community_members
      FOR EACH ROW EXECUTE FUNCTION public.update_community_member_count();

    DROP TRIGGER IF EXISTS update_member_count_on_leave ON public.community_members;
    CREATE TRIGGER update_member_count_on_leave
      AFTER DELETE ON public.community_members
      FOR EACH ROW EXECUTE FUNCTION public.update_community_member_count();
  END IF;
END $$;