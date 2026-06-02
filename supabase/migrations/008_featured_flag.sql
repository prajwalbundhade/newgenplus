-- =============================================================================
-- NeuwGenX — Migration 008: Featured flag
-- =============================================================================
-- Run order: 8
-- Description:
--   Adds an is_featured flag to resources so admins can curate a "Featured"
--   section on the public homepage, plus a partial index for the featured feed.
--   Additive and non-breaking.
-- =============================================================================

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN resources.is_featured IS
  'Admin-curated flag. When true and status = published, the resource appears '
  'in the homepage Featured section.';

-- Featured feed: published + featured, newest first.
CREATE INDEX IF NOT EXISTS idx_resources_featured
  ON resources (is_featured, published_at DESC)
  WHERE status = 'published' AND is_featured = true;
