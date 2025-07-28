-- =================================================================
-- WARNING: THIS SCRIPT WILL DELETE EXISTING 'profiles' AND 'review_items' TABLES AND ALL THEIR DATA.
-- Execute this only if you are sure you want to reset the database schema to the correct state.
-- =================================================================

-- Step 1: Drop existing tables to ensure a clean slate.
DROP TABLE IF EXISTS public.review_items;
DROP TABLE IF EXISTS public.profiles;


-- Step 2: Create the 'profiles' table with the correct structure.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ,
  username TEXT UNIQUE,
  streak INT DEFAULT 0,
  stats JSONB,
  preferred_topic TEXT DEFAULT 'Tech News',
  preferred_lexile_level TEXT DEFAULT '800L-1000L'
);

COMMENT ON TABLE public.profiles IS 'Stores user-specific public information and preferences.';


-- Step 3: Create the 'review_items' table for spaced repetition.
CREATE TABLE public.review_items (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  content JSONB NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  ease_factor FLOAT DEFAULT 2.5,
  repetitions INT DEFAULT 0,
  interval INT DEFAULT 1
);

COMMENT ON TABLE public.review_items IS 'Stores items saved by users for spaced repetition review.';


-- Step 4: Enable Row Level Security (RLS) for both tables.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_items ENABLE ROW LEVEL SECURITY;


-- Step 5: Create security policies for the 'profiles' table.
CREATE POLICY "Users can view their own profile."
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);


-- Step 6: Create security policies for the 'review_items' table.
CREATE POLICY "Users can manage their own review items."
  ON public.review_items FOR ALL
  USING (auth.uid() = user_id);

-- =================================================================
-- End of script. Your database schema should now be correct.
-- =================================================================