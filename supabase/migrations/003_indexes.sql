-- =============================================================================
-- NeuwGenX — Migration 003: Indexes
-- =============================================================================
-- Run order: 3 of 5
-- Description: All indexes for query performance.
--   Organized by table. Each index includes a comment explaining the query
--   pattern it supports.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- admin_users indexes
-- ---------------------------------------------------------------------------

-- Email lookup during middleware auth check and allowlist validation
CREATE INDEX idx_admin_users_email
  ON admin_users (email);

-- ---------------------------------------------------------------------------
-- categories indexes
-- ---------------------------------------------------------------------------

-- Slug lookup for SEO routing: /category/[slug]
-- Already covered by UNIQUE constraint index, listed here for documentation.
-- CREATE UNIQUE INDEX idx_categories_slug ON categories (slug); -- implicit from UNIQUE

-- Published categories for public nav/filter rendering
CREATE INDEX idx_categories_status_sort
  ON categories (status, sort_order ASC)
  WHERE status = 'published';

-- ---------------------------------------------------------------------------
-- models indexes
-- ---------------------------------------------------------------------------

-- Slug lookup for SEO routing: /model/[slug]
-- Already covered by UNIQUE constraint index.

-- Published models for public filter rendering
CREATE INDEX idx_models_status
  ON models (status)
  WHERE status = 'published';

-- ---------------------------------------------------------------------------
-- resources indexes
-- ---------------------------------------------------------------------------

-- PRIMARY READ PATH: Homepage feed — published resources ordered by recency.
-- This is the most-hit index in the entire system.
CREATE INDEX idx_resources_published_feed
  ON resources (status, published_at DESC)
  WHERE status = 'published';

-- Category landing page: /category/[slug] — filtered published feed
CREATE INDEX idx_resources_category_published
  ON resources (category_id, published_at DESC)
  WHERE status = 'published';

-- Model landing page: /model/[slug] — filtered published feed
CREATE INDEX idx_resources_model_published
  ON resources (model_id, published_at DESC)
  WHERE status = 'published';

-- Resource type filter (future: browse by type)
CREATE INDEX idx_resources_type_published
  ON resources (resource_type, published_at DESC)
  WHERE status = 'published';

-- Trending sort: highest copy_count among published resources
CREATE INDEX idx_resources_copy_count
  ON resources (copy_count DESC)
  WHERE status = 'published';

-- Trending sort: highest view_count among published resources
CREATE INDEX idx_resources_view_count
  ON resources (view_count DESC)
  WHERE status = 'published';

-- Top-rated sort: highest avg_rating among published resources with reviews
CREATE INDEX idx_resources_avg_rating
  ON resources (avg_rating DESC NULLS LAST)
  WHERE status = 'published' AND avg_rating IS NOT NULL;

-- Admin console: list all resources by status + recency (includes drafts/archived)
CREATE INDEX idx_resources_admin_list
  ON resources (status, created_at DESC);

-- Tags: GIN index for array containment queries (@> operator)
-- Supports: WHERE tags @> ARRAY['portrait', 'cinematic']
CREATE INDEX idx_resources_tags
  ON resources USING GIN (tags);

-- Full-text search: GIN index on a generated tsvector column.
-- Covers title (weight A), description (weight B), prompt_text (weight C).
-- Using a generated column for index stability and query simplicity.
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS search_vector TSVECTOR
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(prompt_text, '')), 'C')
    ) STORED;

CREATE INDEX idx_resources_search_vector
  ON resources USING GIN (search_vector);

-- Trigram index for partial/fuzzy title search (supports ILIKE '%query%')
CREATE INDEX idx_resources_title_trgm
  ON resources USING GIN (title gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- resource_media indexes
-- ---------------------------------------------------------------------------

-- resource_id lookup (1:1 join from resources)
-- Already covered by UNIQUE constraint index.

-- Storage path lookup (admin deduplication check)
CREATE INDEX idx_resource_media_storage_path
  ON resource_media (storage_path);

-- ---------------------------------------------------------------------------
-- reviews indexes
-- ---------------------------------------------------------------------------

-- Public read: approved reviews for a resource (detail page)
CREATE INDEX idx_reviews_resource_approved
  ON reviews (resource_id, created_at DESC)
  WHERE status = 'approved';

-- Admin moderation queue: pending reviews ordered by submission time
CREATE INDEX idx_reviews_pending_queue
  ON reviews (created_at ASC)
  WHERE status = 'pending';

-- Abuse detection: reviews by IP hash within a time window
CREATE INDEX idx_reviews_ip_hash_created
  ON reviews (ip_hash, created_at DESC)
  WHERE ip_hash IS NOT NULL;

-- ---------------------------------------------------------------------------
-- resource_events indexes
-- ---------------------------------------------------------------------------

-- Analytics aggregation: count events by type for a resource over time
CREATE INDEX idx_resource_events_resource_type_time
  ON resource_events (resource_id, event_type, created_at DESC);

-- Time-series analytics: all events in a time range (admin dashboard)
CREATE INDEX idx_resource_events_created_at
  ON resource_events (created_at DESC);

-- Session deduplication: prevent double-counting views per session
CREATE INDEX idx_resource_events_session
  ON resource_events (session_id, resource_id, event_type)
  WHERE session_id IS NOT NULL;

-- Country analytics
CREATE INDEX idx_resource_events_country
  ON resource_events (country_code, event_type, created_at DESC)
  WHERE country_code IS NOT NULL;
