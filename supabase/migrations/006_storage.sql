-- =============================================================================
-- NeuwGenX — Migration 006: Storage Buckets & Policies
-- =============================================================================
-- Run order: 6 of 6
-- Description:
--   Create Supabase Storage buckets and their access policies.
--   All public buckets serve read-only to anonymous users.
--   All writes are restricted to authenticated admins.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Buckets
-- ---------------------------------------------------------------------------

-- Resource cover images (image prompts, website kit previews)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resource-images',
  'resource-images',
  true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Video prompt files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resource-videos',
  'resource-videos',
  true,
  524288000,  -- 500 MB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Website kit downloadable assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resource-kits',
  'resource-kits',
  true,
  104857600,  -- 100 MB
  ARRAY['application/zip', 'application/x-zip-compressed', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- AI model brand logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'model-logos',
  'model-logos',
  true,
  2097152,  -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Category icons
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'category-icons',
  'category-icons',
  true,
  1048576,  -- 1 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Cached Open Graph images (generated per resource slug)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'og-images',
  'og-images',
  true,
  2097152,  -- 2 MB
  ARRAY['image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Private admin staging area (pre-processing uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'admin-uploads',
  'admin-uploads',
  false,  -- PRIVATE
  524288000,  -- 500 MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/zip', 'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Storage RLS Policies
-- ---------------------------------------------------------------------------
-- Pattern:
--   Public buckets  → anon SELECT, admin INSERT/UPDATE/DELETE
--   Private buckets → admin only for all operations

-- ── resource-images ─────────────────────────────────────────────────────────

CREATE POLICY "resource-images: public read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'resource-images');

CREATE POLICY "resource-images: admin insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resource-images' AND is_admin());

CREATE POLICY "resource-images: admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resource-images' AND is_admin());

CREATE POLICY "resource-images: admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'resource-images' AND is_admin());

-- ── resource-videos ──────────────────────────────────────────────────────────

CREATE POLICY "resource-videos: public read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'resource-videos');

CREATE POLICY "resource-videos: admin insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resource-videos' AND is_admin());

CREATE POLICY "resource-videos: admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resource-videos' AND is_admin());

CREATE POLICY "resource-videos: admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'resource-videos' AND is_admin());

-- ── resource-kits ────────────────────────────────────────────────────────────

CREATE POLICY "resource-kits: public read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'resource-kits');

CREATE POLICY "resource-kits: admin insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resource-kits' AND is_admin());

CREATE POLICY "resource-kits: admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resource-kits' AND is_admin());

CREATE POLICY "resource-kits: admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'resource-kits' AND is_admin());

-- ── model-logos ──────────────────────────────────────────────────────────────

CREATE POLICY "model-logos: public read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'model-logos');

CREATE POLICY "model-logos: admin insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'model-logos' AND is_admin());

CREATE POLICY "model-logos: admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'model-logos' AND is_admin());

CREATE POLICY "model-logos: admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'model-logos' AND is_admin());

-- ── category-icons ───────────────────────────────────────────────────────────

CREATE POLICY "category-icons: public read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'category-icons');

CREATE POLICY "category-icons: admin insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'category-icons' AND is_admin());

CREATE POLICY "category-icons: admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'category-icons' AND is_admin());

CREATE POLICY "category-icons: admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'category-icons' AND is_admin());

-- ── og-images ────────────────────────────────────────────────────────────────

CREATE POLICY "og-images: public read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'og-images');

CREATE POLICY "og-images: admin insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'og-images' AND is_admin());

CREATE POLICY "og-images: admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'og-images' AND is_admin());

CREATE POLICY "og-images: admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'og-images' AND is_admin());

-- ── admin-uploads (PRIVATE) ──────────────────────────────────────────────────

CREATE POLICY "admin-uploads: admin only read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'admin-uploads' AND is_admin());

CREATE POLICY "admin-uploads: admin only insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'admin-uploads' AND is_admin());

CREATE POLICY "admin-uploads: admin only update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'admin-uploads' AND is_admin());

CREATE POLICY "admin-uploads: admin only delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'admin-uploads' AND is_admin());
