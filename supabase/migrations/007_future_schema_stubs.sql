-- =============================================================================
-- NewGenPlus — Migration 007: Future Schema Stubs
-- =============================================================================
-- Status: COMMENTED OUT — Do not run in V1.
-- Purpose: Documents the V2+ schema extensions so future migrations are
--          additive and non-breaking. Reviewed and uncommented per phase.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- V2: User Profiles
-- ---------------------------------------------------------------------------
-- Extends auth.users with a public profile. Linked 1:1 via auth.uid().
-- Unlocks: user submissions, bookmarks, likes, collections.

/*
CREATE TABLE profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT        NOT NULL UNIQUE,
  display_name  TEXT,
  avatar_path   TEXT,
  bio           TEXT,
  website_url   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT profiles_username_format CHECK (username ~ '^[a-z0-9_]{3,30}$'),
  CONSTRAINT profiles_bio_length      CHECK (bio IS NULL OR char_length(bio) <= 500)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

-- Public can read all profiles
CREATE POLICY "profiles: public can read"
  ON profiles FOR SELECT TO anon, authenticated USING (true);

-- Users can update their own profile
CREATE POLICY "profiles: user can update own"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
*/

-- ---------------------------------------------------------------------------
-- V2: User Submissions
-- ---------------------------------------------------------------------------
-- Adds submitted_by FK to resources. A new status 'submitted' feeds the
-- existing admin moderation pattern (mirrors review approval flow).

/*
ALTER TABLE resources
  ADD COLUMN submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- New status value: ALTER TYPE content_status ADD VALUE 'submitted';
-- New RLS policy: authenticated users can INSERT with status = 'submitted'
-- Admin moderation queue picks up status = 'submitted' alongside reviews.
*/

-- ---------------------------------------------------------------------------
-- V2: Bookmarks
-- ---------------------------------------------------------------------------

/*
CREATE TABLE bookmarks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resource_id UUID        NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, resource_id)
);

CREATE INDEX idx_bookmarks_user    ON bookmarks (user_id, created_at DESC);
CREATE INDEX idx_bookmarks_resource ON bookmarks (resource_id);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookmarks: user can read own"
  ON bookmarks FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "bookmarks: user can insert own"
  ON bookmarks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "bookmarks: user can delete own"
  ON bookmarks FOR DELETE TO authenticated USING (user_id = auth.uid());
*/

-- ---------------------------------------------------------------------------
-- V2: Likes
-- ---------------------------------------------------------------------------

/*
CREATE TABLE likes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resource_id UUID        NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, resource_id)
);

CREATE INDEX idx_likes_user     ON likes (user_id, created_at DESC);
CREATE INDEX idx_likes_resource ON likes (resource_id);

-- Add denormalized like_count to resources when this ships:
-- ALTER TABLE resources ADD COLUMN like_count INT NOT NULL DEFAULT 0;
*/

-- ---------------------------------------------------------------------------
-- V2: Collections
-- ---------------------------------------------------------------------------

/*
CREATE TABLE collections (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL,
  description TEXT,
  is_public   BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, slug),
  CONSTRAINT collections_name_length CHECK (char_length(name) BETWEEN 1 AND 100)
);

CREATE TABLE collection_items (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID        NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  resource_id   UUID        NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  sort_order    INT         NOT NULL DEFAULT 0,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (collection_id, resource_id)
);

CREATE INDEX idx_collection_items_collection ON collection_items (collection_id, sort_order);
*/
