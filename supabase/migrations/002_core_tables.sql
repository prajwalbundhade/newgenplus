-- =============================================================================
-- NeuwGenX — Migration 002: Core Tables
-- =============================================================================
-- Run order: 2 of 5
-- Description: Creates all core domain tables.
--   - admin_users
--   - categories
--   - models
--   - resources
--   - resource_media
--   - reviews
--   - resource_events
-- =============================================================================

-- ---------------------------------------------------------------------------
-- admin_users
-- ---------------------------------------------------------------------------
-- Mirrors auth.users for allowlist enforcement.
-- A user must exist in BOTH auth.users AND admin_users to perform admin actions.
-- The id column is intentionally tied to auth.users.id so RLS policies can
-- reference auth.uid() directly.
-- ---------------------------------------------------------------------------

CREATE TABLE admin_users (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL UNIQUE,
  role        admin_role  NOT NULL DEFAULT 'admin',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE admin_users IS
  'Allowlist of approved admin identities. Must match auth.users. '
  'Being authenticated is necessary but not sufficient — this table is the gate.';

COMMENT ON COLUMN admin_users.role IS
  'admin: content CRUD + review moderation. '
  'super_admin: all admin permissions + manage other admins.';

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

CREATE TABLE categories (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT          NOT NULL,
  slug        TEXT          NOT NULL UNIQUE,
  description TEXT,
  icon        TEXT,                          -- Icon name or storage path
  sort_order  INT           NOT NULL DEFAULT 0,
  status      content_status NOT NULL DEFAULT 'published',
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT categories_name_length   CHECK (char_length(name) BETWEEN 1 AND 100),
  CONSTRAINT categories_slug_format   CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT categories_slug_length   CHECK (char_length(slug) BETWEEN 1 AND 100)
);

COMMENT ON TABLE categories IS
  'Content categories (e.g. "Portrait", "Architecture", "Logo Design"). '
  'Each resource belongs to exactly one category.';

-- ---------------------------------------------------------------------------
-- models
-- ---------------------------------------------------------------------------

CREATE TABLE models (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT           NOT NULL,
  slug        TEXT           NOT NULL UNIQUE,
  description TEXT,
  logo_path   TEXT,                          -- Storage path in model-logos bucket
  provider    TEXT,                          -- e.g. "Midjourney", "OpenAI", "Stability AI"
  status      content_status NOT NULL DEFAULT 'published',
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT models_name_length  CHECK (char_length(name) BETWEEN 1 AND 100),
  CONSTRAINT models_slug_format  CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT models_slug_length  CHECK (char_length(slug) BETWEEN 1 AND 100)
);

COMMENT ON TABLE models IS
  'AI models used to generate prompts (e.g. "Midjourney v6", "DALL-E 3", "GPT-4o"). '
  'Resources are associated with the model they were designed for.';

-- ---------------------------------------------------------------------------
-- resources
-- ---------------------------------------------------------------------------
-- The unified polymorphic content table. resource_type discriminates between
-- image prompts, video prompts, website kits, and workflows.
-- Type-specific binary data (image dimensions, video duration) lives in
-- resource_media to keep this table lean.
-- ---------------------------------------------------------------------------

CREATE TABLE resources (
  id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Polymorphic type discriminator
  resource_type resource_type  NOT NULL DEFAULT 'image',

  -- Core content fields
  title         TEXT           NOT NULL,
  slug          TEXT           NOT NULL UNIQUE,
  description   TEXT,
  prompt_text   TEXT,                        -- The copyable prompt content
  creator_name  TEXT           NOT NULL DEFAULT 'NeuwGenX',

  -- Taxonomy
  category_id   UUID           REFERENCES categories(id) ON DELETE SET NULL,
  model_id      UUID           REFERENCES models(id) ON DELETE SET NULL,
  tags          TEXT[]         NOT NULL DEFAULT '{}',

  -- Lifecycle
  status        content_status NOT NULL DEFAULT 'draft',
  published_at  TIMESTAMPTZ,

  -- Denormalized engagement counters (updated via atomic RPC, never direct UPDATE)
  view_count    BIGINT         NOT NULL DEFAULT 0,
  copy_count    BIGINT         NOT NULL DEFAULT 0,
  review_count  INT            NOT NULL DEFAULT 0,
  avg_rating    NUMERIC(2,1)   CHECK (avg_rating IS NULL OR avg_rating BETWEEN 1.0 AND 5.0),

  -- Timestamps
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT resources_title_length       CHECK (char_length(title) BETWEEN 1 AND 300),
  CONSTRAINT resources_slug_format        CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT resources_slug_length        CHECK (char_length(slug) BETWEEN 1 AND 200),
  CONSTRAINT resources_view_count_pos     CHECK (view_count >= 0),
  CONSTRAINT resources_copy_count_pos     CHECK (copy_count >= 0),
  CONSTRAINT resources_review_count_pos   CHECK (review_count >= 0),
  CONSTRAINT resources_published_at_logic CHECK (
    (status = 'published' AND published_at IS NOT NULL)
    OR status != 'published'
  )
);

COMMENT ON TABLE resources IS
  'Unified polymorphic content table. resource_type discriminates between '
  'image prompts, video prompts, website kits, and workflows. '
  'Type-specific media metadata lives in resource_media.';

COMMENT ON COLUMN resources.prompt_text IS
  'The copyable prompt content. May be NULL for website-kit or workflow types '
  'where the primary deliverable is a file download rather than text.';

COMMENT ON COLUMN resources.view_count IS
  'Denormalized counter. Updated ONLY via increment_view_count() RPC. '
  'Never UPDATE this column directly.';

COMMENT ON COLUMN resources.copy_count IS
  'Denormalized counter. Updated ONLY via increment_copy_count() RPC. '
  'Never UPDATE this column directly.';

COMMENT ON COLUMN resources.avg_rating IS
  'Denormalized average. Recomputed by trigger on review approval/rejection. '
  'Never UPDATE this column directly.';

-- ---------------------------------------------------------------------------
-- resource_media
-- ---------------------------------------------------------------------------
-- One-to-one extension table for binary/media metadata.
-- Kept separate to avoid nullable column sprawl on the hot-path resources table.
-- Joined only when the detail page or admin console needs media specifics.
-- ---------------------------------------------------------------------------

CREATE TABLE resource_media (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id       UUID        NOT NULL UNIQUE REFERENCES resources(id) ON DELETE CASCADE,

  -- Storage
  storage_path      TEXT        NOT NULL,    -- Path within the relevant bucket
  storage_bucket    TEXT        NOT NULL,    -- Bucket name for direct URL construction
  mime_type         TEXT,
  file_size_bytes   BIGINT,

  -- Image / video dimensions (stored to prevent CLS in masonry grid)
  width             INT,
  height            INT,

  -- Blur placeholder (LQIP — Low Quality Image Placeholder)
  blur_data_url     TEXT,                    -- Base64 data URI, ~20px wide

  -- Video-specific (NULL for non-video types)
  duration_seconds  INT,
  thumbnail_path    TEXT,                    -- Separate thumbnail for video types

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT resource_media_dimensions CHECK (
    (width IS NULL AND height IS NULL)
    OR (width > 0 AND height > 0)
  ),
  CONSTRAINT resource_media_file_size CHECK (
    file_size_bytes IS NULL OR file_size_bytes > 0
  )
);

COMMENT ON TABLE resource_media IS
  'One-to-one extension for binary/media metadata. '
  'Joined only when media specifics are needed (detail page, admin). '
  'Kept separate to keep the resources hot-path table lean.';

COMMENT ON COLUMN resource_media.blur_data_url IS
  'Base64-encoded LQIP (~20px wide). Stored to enable instant blur-up '
  'placeholder without a separate network request.';

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------

CREATE TABLE reviews (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id     UUID          NOT NULL REFERENCES resources(id) ON DELETE CASCADE,

  -- Reviewer identity (no account required)
  reviewer_name   TEXT          NOT NULL,
  reviewer_email  TEXT          NOT NULL,    -- Never exposed publicly; moderation/contact only

  -- Content
  rating          SMALLINT      CHECK (rating BETWEEN 1 AND 5),
  body            TEXT          NOT NULL,

  -- Moderation
  status          review_status NOT NULL DEFAULT 'pending',
  approved_at     TIMESTAMPTZ,

  -- Abuse mitigation (hashed — no raw PII stored beyond email)
  ip_hash         TEXT,                      -- SHA-256 of submitter IP for rate-limit auditing

  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT reviews_name_length  CHECK (char_length(reviewer_name) BETWEEN 1 AND 100),
  CONSTRAINT reviews_email_format CHECK (reviewer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT reviews_body_length  CHECK (char_length(body) BETWEEN 10 AND 2000),
  CONSTRAINT reviews_approved_at_logic CHECK (
    (status = 'approved' AND approved_at IS NOT NULL)
    OR status != 'approved'
  )
);

COMMENT ON TABLE reviews IS
  'Anonymous reviews submitted by public users. All reviews land in pending '
  'status and require explicit admin approval before public visibility.';

COMMENT ON COLUMN reviews.reviewer_email IS
  'Stored for moderation/contact purposes only. Never returned in public queries. '
  'Covered by privacy policy.';

COMMENT ON COLUMN reviews.ip_hash IS
  'SHA-256 hash of submitter IP address. Used for rate-limit auditing only. '
  'Raw IP is never stored.';

-- ---------------------------------------------------------------------------
-- resource_events
-- ---------------------------------------------------------------------------
-- Append-only analytics event log. Never read on the public critical path.
-- Powers admin analytics: trending over time, referrer breakdown, content gaps.
-- Partitioned by month at scale (see partitioning note below).
-- ---------------------------------------------------------------------------

CREATE TABLE resource_events (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id       UUID        NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  event_type        event_type  NOT NULL,

  -- Session context (all hashed/anonymized — no raw PII)
  session_id        TEXT,                    -- Client-generated anonymous session ID
  ip_hash           TEXT,                    -- SHA-256 of IP
  user_agent_hash   TEXT,                    -- SHA-256 of user agent string
  referrer          TEXT,                    -- Referrer URL (truncated to 500 chars)
  country_code      CHAR(2),                 -- From Vercel geo headers

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT resource_events_referrer_length CHECK (
    referrer IS NULL OR char_length(referrer) <= 500
  )
);

COMMENT ON TABLE resource_events IS
  'Append-only analytics event log. Never queried on the public read path. '
  'Powers admin analytics dashboard. '
  'Partition by created_at month when row count exceeds ~10M rows.';

-- NOTE: Partitioning strategy for resource_events at scale:
-- ALTER TABLE resource_events RENAME TO resource_events_legacy;
-- CREATE TABLE resource_events (LIKE resource_events_legacy INCLUDING ALL)
--   PARTITION BY RANGE (created_at);
-- CREATE TABLE resource_events_2025_01 PARTITION OF resource_events
--   FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
-- (Automate partition creation via pg_partman extension)
