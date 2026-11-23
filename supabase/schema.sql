-- ==============================================================================
-- VaultStyle: Supabase Database Schema & Storage Configuration
-- Production-Ready with Strict Row-Level Security (RLS)
-- Single Active Device Session Enforcement (Concurrent Login Invalidation)
-- ==============================================================================

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.avatars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    landmarks JSONB DEFAULT '{}'::jsonb,
    width INT DEFAULT 1024,
    height INT DEFAULT 1024,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.wardrobe_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('shirt', 'tshirt', 'outerwear', 'bottom', 'footwear', 'accessory')),
    image_url TEXT NOT NULL,
    primary_color TEXT DEFAULT '#000000',
    secondary_color TEXT DEFAULT NULL,
    color_palette JSONB DEFAULT '[]'::jsonb,
    is_neutral BOOLEAN DEFAULT FALSE,
    pattern_type TEXT DEFAULT 'solid' CHECK (pattern_type IN ('solid', 'patterned')),
    style_vibe TEXT DEFAULT 'casual' CHECK (style_vibe IN ('casual', 'formal', 'streetwear', 'athletic')),
    fit_transform JSONB DEFAULT '{"scale": 1, "scaleX": 1, "scaleY": 1, "x": 0, "y": 0, "rotation": 0}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.outfits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    item_ids JSONB NOT NULL,
    score INT DEFAULT 100,
    style_reason TEXT DEFAULT '',
    style_vibe TEXT DEFAULT 'casual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Single Active Session Tracker:
-- Stores the latest active session_id for each user.
-- When a user logs in on Device B, session_id is replaced.
-- Device A immediately detects mismatch and is logged out.
CREATE TABLE IF NOT EXISTS public.user_sessions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    device_info TEXT DEFAULT 'Browser Web App',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Indexes for Fast User Queries
CREATE INDEX IF NOT EXISTS idx_avatars_user_id ON public.avatars(user_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_user_id ON public.wardrobe_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_category ON public.wardrobe_items(category);
CREATE INDEX IF NOT EXISTS idx_outfits_user_id ON public.outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);

-- 3. Enable Row-Level Security (RLS)
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: avatars
DROP POLICY IF EXISTS "Users can read own avatars" ON public.avatars;
CREATE POLICY "Users can read own avatars"
    ON public.avatars FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own avatars" ON public.avatars;
CREATE POLICY "Users can insert own avatars"
    ON public.avatars FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own avatars" ON public.avatars;
CREATE POLICY "Users can update own avatars"
    ON public.avatars FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own avatars" ON public.avatars;
CREATE POLICY "Users can delete own avatars"
    ON public.avatars FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5. RLS Policies: wardrobe_items
DROP POLICY IF EXISTS "Users can read own wardrobe items" ON public.wardrobe_items;
CREATE POLICY "Users can read own wardrobe items"
    ON public.wardrobe_items FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wardrobe items" ON public.wardrobe_items;
CREATE POLICY "Users can insert own wardrobe items"
    ON public.wardrobe_items FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wardrobe items" ON public.wardrobe_items;
CREATE POLICY "Users can update own wardrobe items"
    ON public.wardrobe_items FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own wardrobe items" ON public.wardrobe_items;
CREATE POLICY "Users can delete own wardrobe items"
    ON public.wardrobe_items FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 6. RLS Policies: outfits
DROP POLICY IF EXISTS "Users can read own outfits" ON public.outfits;
CREATE POLICY "Users can read own outfits"
    ON public.outfits FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own outfits" ON public.outfits;
CREATE POLICY "Users can insert own outfits"
    ON public.outfits FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own outfits" ON public.outfits;
CREATE POLICY "Users can delete own outfits"
    ON public.outfits FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 7. RLS Policies: user_sessions (Single Active Session)
DROP POLICY IF EXISTS "Users can manage own session" ON public.user_sessions;
CREATE POLICY "Users can manage own session"
    ON public.user_sessions FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 8. Enable Realtime on user_sessions so other devices detect new logins immediately
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;

-- 9. Supabase Storage Buckets Setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('garments', 'garments', true)
ON CONFLICT (id) DO NOTHING;

-- 10. Storage RLS Policies (Per-User Folder Isolation: {user_id}/{filename})
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
CREATE POLICY "Public avatar access"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('avatars', 'garments'));

DROP POLICY IF EXISTS "Authenticated users can upload to avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload to avatars"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Authenticated users can update own avatars" ON storage.objects;
CREATE POLICY "Authenticated users can update own avatars"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Authenticated users can delete own avatars" ON storage.objects;
CREATE POLICY "Authenticated users can delete own avatars"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Authenticated users can upload to garments" ON storage.objects;
CREATE POLICY "Authenticated users can upload to garments"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'garments' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Authenticated users can update own garments" ON storage.objects;
CREATE POLICY "Authenticated users can update own garments"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'garments' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Authenticated users can delete own garments" ON storage.objects;
CREATE POLICY "Authenticated users can delete own garments"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'garments' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
