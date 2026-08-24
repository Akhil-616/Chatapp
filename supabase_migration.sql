-- ==============================================================================
-- Sajilo Patra / ConnectJutti: Extended Profiles & Friend Request System Migration
-- ==============================================================================

-- 1. Extend profiles table with optional extended fields and permanent college column
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
  ADD COLUMN IF NOT EXISTS section text,
  ADD COLUMN IF NOT EXISTS faculty text,
  ADD COLUMN IF NOT EXISTS college text,
  ADD COLUMN IF NOT EXISTS bio text;

-- 2. Create friend_requests table
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'accepted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT no_self_friend_request CHECK (requester_id <> addressee_id),
  CONSTRAINT unique_friend_request_pair UNIQUE (requester_id, addressee_id)
);

-- 3. Create index for bidirectional relationship queries
CREATE INDEX IF NOT EXISTS idx_friend_requests_requester ON public.friend_requests(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_addressee ON public.friend_requests(addressee_id, status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for friend_requests table
DROP POLICY IF EXISTS "Users can view friend requests involving them" ON public.friend_requests;
CREATE POLICY "Users can view friend requests involving them"
  ON public.friend_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "Users can insert friend requests as requester" ON public.friend_requests;
CREATE POLICY "Users can insert friend requests as requester"
  ON public.friend_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');

DROP POLICY IF EXISTS "Addressee can update friend request status" ON public.friend_requests;
CREATE POLICY "Addressee can update friend request status"
  ON public.friend_requests FOR UPDATE
  USING (auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = addressee_id);

DROP POLICY IF EXISTS "Users can delete friend requests involving them" ON public.friend_requests;
CREATE POLICY "Users can delete friend requests involving them"
  ON public.friend_requests FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- 6. Update or create trigger function to automatically derive college at signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  derived_college text;
BEGIN
  -- Automatically derive college name from verified college email domain
  IF NEW.email ILIKE '%@islingtoncollege.edu.np' THEN
    derived_college := 'Islington College Kathmandu';
  ELSE
    derived_college := COALESCE(NEW.raw_user_meta_data->>'college', 'Islington College Kathmandu');
  END IF;

  INSERT INTO public.profiles (
    id, 
    email, 
    username, 
    full_name, 
    college, 
    faculty, 
    section, 
    gender, 
    bio
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    derived_college,
    COALESCE(NEW.raw_user_meta_data->>'faculty', NULL),
    COALESCE(NEW.raw_user_meta_data->>'section', NULL),
    COALESCE(NEW.raw_user_meta_data->>'gender', NULL),
    COALESCE(NEW.raw_user_meta_data->>'bio', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    college = COALESCE(public.profiles.college, EXCLUDED.college);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger on auth.users if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
