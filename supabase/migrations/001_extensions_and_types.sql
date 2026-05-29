-- =============================================================================
-- NewGenPlus — Migration 001: Extensions & Custom Types
-- =============================================================================
-- Run order: 1 of 5
-- Description: Enable required Postgres extensions and define all custom
--              enum types used across the schema.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

-- UUID generation (gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Full-text search with unaccent support (handles accented characters in search)
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- pg_trgm for fuzzy/trigram search on title and description
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ---------------------------------------------------------------------------
-- Custom Enum Types
-- ---------------------------------------------------------------------------

-- Resource content types — the core polymorphic discriminator.
-- Add new values here as new content types are introduced (ALTER TYPE ... ADD VALUE).
CREATE TYPE resource_type AS ENUM (
  'image',        -- AI image prompt (V1)
  'video',        -- AI video prompt (future)
  'website-kit',  -- Website kit / template (future)
  'workflow'      -- AI workflow / automation (future)
);

-- Lifecycle status for resources, categories, and models.
CREATE TYPE content_status AS ENUM (
  'draft',       -- Created but not visible publicly
  'published',   -- Live and publicly visible
  'archived'     -- Soft-deleted; hidden but preserved for SEO/history
);

-- Review moderation states.
CREATE TYPE review_status AS ENUM (
  'pending',    -- Awaiting admin moderation (default on insert)
  'approved',   -- Visible publicly
  'rejected'    -- Hidden; kept for audit trail
);

-- Admin role tiers.
CREATE TYPE admin_role AS ENUM (
  'admin',        -- Standard admin: full content CRUD + review moderation
  'super_admin'   -- Super admin: can manage other admin accounts
);

-- Analytics event types — extend as new interactions are tracked.
CREATE TYPE event_type AS ENUM (
  'view',           -- Resource detail page viewed
  'copy',           -- Prompt text copied
  'review_submit',  -- Review submitted (pending approval)
  'share',          -- Share button clicked (future)
  'bookmark',       -- Bookmarked by a user (future)
  'like'            -- Liked by a user (future)
);
